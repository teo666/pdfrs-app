// Renders the logo (extension/icons/icon.svg, the same as the extension's)
// to what the website wants, into public/:
//
//   favicon.svg            browsers that take SVG favicons
//   favicon.ico            16, 32 and 48 px, for the rest (and /favicon.ico lookups)
//   apple-touch-icon.png   180 px on an opaque background (iOS home screen)
//   icon-192.png, icon-512.png            web app manifest
//   icon-maskable-512.png  manifest, "maskable": the logo inside the safe zone
//   og-image.png           1200×630, the preview shown when a link is shared
//
// Run once after changing the SVG or the texts below:
//   node scripts/make-web-icons.mjs
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const svgPath = join(root, 'extension', 'icons', 'icon.svg')
const svg = readFileSync(svgPath, 'utf8')
const accent = '#2f5bea'

const browser = await chromium.launch()

/** The page's content, at `width`×`height`, as a PNG. */
async function render(html, width, height, { transparent = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.setContent(
    `<style>html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;${transparent ? 'background:transparent' : ''}}</style>${html}`,
  )
  const png = await page.screenshot({ omitBackground: transparent })
  await page.close()
  return png
}

const logo = (size, style = '') =>
  svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block;${style}" `)

copyFileSync(svgPath, join(publicDir, 'favicon.svg'))

// favicon.ico: PNG images in an ICO container, which every current browser reads.
const icoSizes = [16, 32, 48]
const pngs = []
for (const size of icoSizes) pngs.push(await render(logo(size), size, size, { transparent: true }))
const header = Buffer.alloc(6 + 16 * pngs.length)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(pngs.length, 4)
let offset = header.length
pngs.forEach((png, i) => {
  const entry = 6 + 16 * i
  header.writeUInt8(icoSizes[i], entry) // width
  header.writeUInt8(icoSizes[i], entry + 1) // height
  header.writeUInt8(0, entry + 2) // palette
  header.writeUInt8(0, entry + 3) // reserved
  header.writeUInt16LE(1, entry + 4) // planes
  header.writeUInt16LE(32, entry + 6) // bits per pixel
  header.writeUInt32LE(png.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += png.length
})
writeFileSync(join(publicDir, 'favicon.ico'), Buffer.concat([header, ...pngs]))

// iOS fills transparency with black: the logo's rounded square goes edge to edge on its colour.
writeFileSync(
  join(publicDir, 'apple-touch-icon.png'),
  await render(`<div style="background:${accent}">${logo(180)}</div>`, 180, 180),
)
for (const size of [192, 512]) {
  writeFileSync(
    join(publicDir, `icon-${size}.png`),
    await render(logo(size), size, size, { transparent: true }),
  )
}
// Maskable: the platform crops it to its own shape, keeping only the middle 80%.
writeFileSync(
  join(publicDir, 'icon-maskable-512.png'),
  await render(
    `<div style="width:512px;height:512px;background:${accent};display:grid;place-items:center">${logo(400)}</div>`,
    512,
    512,
  ),
)

// The preview for shared links (Open Graph / Twitter): 1200×630.
const og = `
<div style="box-sizing:border-box;width:1200px;height:630px;padding:84px 96px;
  background:radial-gradient(circle at 85% 15%, #4d75ff 0, ${accent} 45%, #1f3fb0 100%);
  color:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
  display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;align-items:center;gap:28px">
    ${logo(112, 'border-radius:26px;box-shadow:0 10px 30px #0003')}
    <span style="font-size:84px;font-weight:800;letter-spacing:-2px">pdfrs</span>
  </div>
  <div>
    <div style="font-size:64px;font-weight:750;line-height:1.08;letter-spacing:-1.5px">
      Edit PDFs right in your browser.
    </div>
    <div style="margin-top:22px;font-size:32px;line-height:1.35;color:#dbe4ff">
      Reorder, rotate, sign, merge, split and protect.<br>Works offline. Nothing to install, nothing uploaded.
    </div>
  </div>
</div>`
writeFileSync(join(publicDir, 'og-image.png'), await render(og, 1200, 630))

await browser.close()
console.log('web icons written to public/')
