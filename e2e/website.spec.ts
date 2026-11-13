import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

// The website as GitHub Pages serves it (.github/workflows/pages.yml): built
// under a sub-path, with its own tags and files, and kept by the service
// worker so that it opens and works without a network.
const root = fileURLToPath(new URL('..', import.meta.url))
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const siteUrl = 'https://example.github.io/pdfrs-app/'
const port = 5178
const home = `http://localhost:${port}/pdfrs-app/`

// Service workers: Chromium only in Playwright.
// eslint-disable-next-line playwright/no-skipped-test -- see above
test.skip(({ browserName }) => browserName !== 'chromium', 'service workers: Chromium only')
test.describe.configure({ mode: 'serial' })

let out: string
let server: ChildProcess | undefined

test.beforeAll(async () => {
  test.setTimeout(180_000)
  out = mkdtempSync(join(tmpdir(), 'pdfrs-site-'))
  execFileSync('pnpm', ['exec', 'vite', 'build', '--base', '/pdfrs-app/', '--outDir', out, '--emptyOutDir'], {
    cwd: root,
    stdio: 'ignore',
    env: { ...process.env, SITE_URL: siteUrl },
  })
  // Vite itself, not through pnpm: killing it in afterAll must stop the server.
  server = spawn(
    process.execPath,
    [vite, 'preview', '--base', '/pdfrs-app/', '--outDir', out, '--port', String(port), '--strictPort'],
    { cwd: root, stdio: 'ignore' },
  )
  for (let tries = 0; ; tries++) {
    if (await fetch(home).then((response) => response.ok, () => false)) break
    if (tries > 100) throw new Error('the preview server did not start')
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
})

test.afterAll(() => {
  server?.kill()
  rmSync(out, { recursive: true, force: true })
})

test('the site has its address in the tags, and the files for search engines', async ({ page }) => {
  await page.goto(home)
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', siteUrl)
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${siteUrl}og-image.png`)
  await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href', '/pdfrs-app/manifest.webmanifest')
  expect(await page.content()).not.toContain('%SITE_URL%')

  expect(readFileSync(join(out, 'robots.txt'), 'utf8')).toContain(`Sitemap: ${siteUrl}sitemap.xml`)
  expect(readFileSync(join(out, 'sitemap.xml'), 'utf8')).toContain(`<loc>${siteUrl}</loc>`)
  expect(readFileSync(join(out, '404.html'), 'utf8')).toBe(readFileSync(join(out, 'index.html'), 'utf8'))
  for (const file of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'og-image.png', 'sw.js']) {
    expect(existsSync(join(out, file)), file).toBe(true)
  }
})

test('once opened, the site opens and edits PDFs without a network', async ({ page, context }) => {
  test.setTimeout(60_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(home)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  try {
    await page.reload()
    const chooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Apri file' }).first().click()
    await (await chooserPromise).setFiles(fixture('four_pages.pdf'))
    await expect(page.locator('main article img')).toHaveCount(4)
    expect(errors).toEqual([])
  } finally {
    await context.setOffline(false)
  }
})
