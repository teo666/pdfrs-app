// The README's screenshots (docs/screenshot*.png), taken from the built app
// with a PDF of your choice:
//
//   node scripts/make-screenshots.mjs path/to/document.pdf
//
// Builds the app into a temporary folder, serves it, and drives it with
// Playwright: light theme with a selection and the Firma panel, dark theme,
// and the page viewer.
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const pdf = process.argv[2] && resolve(process.argv[2])
if (!pdf) {
  console.error('usage: node scripts/make-screenshots.mjs path/to/document.pdf')
  process.exit(1)
}

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const docs = join(root, 'docs')
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const port = 5181
const home = `http://localhost:${port}/`
mkdirSync(docs, { recursive: true })

const out = mkdtempSync(join(tmpdir(), 'pdfrs-shots-'))
execFileSync(process.execPath, [vite, 'build', '--outDir', out, '--emptyOutDir'], { cwd: root, stdio: 'ignore' })
const server = spawn(process.execPath, [vite, 'preview', '--outDir', out, '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
})

const browser = await chromium.launch()
try {
  for (let tries = 0; ; tries++) {
    if (await fetch(home).then((response) => response.ok, () => false)) break
    if (tries > 100) throw new Error('the preview server did not start')
    await new Promise((done) => setTimeout(done, 200))
  }

  /** A fresh page in `theme`, with the PDF open and its first thumbnails drawn. */
  async function open(theme) {
    const page = await browser.newPage({
      locale: 'it-IT',
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: theme,
    })
    await page.addInitScript((value) => localStorage.setItem('pdfrs.theme', value), theme)
    await page.goto(home)
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Apri file' }).first().click()
    await (await chooser).setFiles(pdf)
    await page.getByRole('heading', { name: basename(pdf) }).waitFor()
    await page.waitForFunction(
      () => {
        const images = [...document.querySelectorAll('main article img')]
        return images.length >= 6 && images.slice(0, 6).every((img) => img.complete && img.naturalWidth > 0)
      },
      null,
      { timeout: 30_000 },
    )
    return page
  }

  // Light: a few pages selected, and the Firma panel open.
  let page = await open('light')
  const cards = page.locator('main article')
  await cards.nth(1).click()
  await cards.nth(2).click({ modifiers: ['Shift'] })
  await page.getByRole('button', { name: 'Firma' }).click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(docs, 'screenshot.png') })
  await page.close()

  // Dark: the grid as it opens.
  page = await open('dark')
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(docs, 'screenshot-dark.png') })

  // The page viewer, on the first page.
  await page.locator('main article').first().dblclick()
  await page.locator('dialog[open] img').first().waitFor()
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(docs, 'screenshot-viewer.png') })
  await page.close()

  console.log('screenshots written to docs/')
} finally {
  await browser.close()
  server.kill()
  rmSync(out, { recursive: true, force: true })
}
