import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { chromium, expect, test } from '@playwright/test'

// The extension as built by `pnpm build:extension`, loaded into Chromium:
// its page must run the whole editor - wasm, workers - under the
// extension's content security policy.
const root = fileURLToPath(new URL('..', import.meta.url))
const unpacked = fileURLToPath(new URL('../dist-extension/chrome', import.meta.url))
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))

// eslint-disable-next-line playwright/no-skipped-test -- Playwright loads extensions in Chromium only
test.skip(({ browserName }) => browserName !== 'chromium', 'Playwright loads extensions in Chromium only')

test('the extension opens the editor, which opens a PDF', async () => {
  test.setTimeout(180_000)
  execFileSync('node', ['scripts/build-extension.mjs'], { cwd: root, stdio: 'ignore' })
  expect(existsSync(`${unpacked}/manifest.json`)).toBe(true)

  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    locale: 'it-IT',
    args: [`--disable-extensions-except=${unpacked}`, `--load-extension=${unpacked}`],
  })
  try {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
    const id = new URL(worker.url()).host
    const errors: string[] = []
    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto(`chrome-extension://${id}/index.html`)

    const chooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Apri file' }).first().click()
    await (await chooserPromise).setFiles(fixture('four_pages.pdf'))
    await expect(page.locator('main article img')).toHaveCount(4)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
