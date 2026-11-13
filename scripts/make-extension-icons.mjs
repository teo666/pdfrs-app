// Renders extension/icons/icon.svg to the PNG sizes browsers want for an
// extension (they don't take SVG). Run once after changing the SVG:
//   node scripts/make-extension-icons.mjs
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const icons = join(dirname(fileURLToPath(import.meta.url)), '..', 'extension', 'icons')
const svg = readFileSync(join(icons, 'icon.svg'), 'utf8')
const browser = await chromium.launch()
for (const size of [16, 32, 48, 128]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  )
  await page.screenshot({ path: join(icons, `icon-${size}.png`), omitBackground: true })
  await page.close()
}
await browser.close()
console.log('icons written')
