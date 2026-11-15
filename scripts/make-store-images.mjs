// The images for the extension stores, in store/:
//
//   node scripts/make-store-images.mjs [document.pdf]
//
// - screenshots/<lang>/*.png  1280x800, five per language (it, en): the
//   Chrome Web Store, Edge Add-ons and addons.mozilla.org take them as they are;
// - promo-440x280.png         the Chrome Web Store's small promo tile;
// - marquee-1400x560.png      its marquee (only if the extension is featured);
// - icon-128.png              the store icon: 96x96 artwork in a 128x128
//                             transparent square, as the Chrome Web Store asks.
//
// The document on show is the PDF given, or, without one, a sample made here
// (an HTML page printed to PDF by Chromium). Builds the app into a temporary
// folder, serves it, and drives it with Playwright.
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'

const given = process.argv[2] && resolve(process.argv[2])
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const store = join(root, 'store')
const vite = join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const port = 5182
const home = `http://localhost:${port}/`
const icon = readFileSync(join(root, 'extension', 'icons', 'icon.svg'), 'utf8')

/** What changes with the language: the sample document, and the labels the script clicks. */
const LANGUAGES = {
  it: {
    open: 'Apri file',
    tools: 'Strumenti',
    applyWatermark: 'Applica filigrana',
    file: 'Relazione-2026.pdf',
    title: 'Relazione annuale 2026',
    subtitle: 'Laboratorio di ricerca · Sintesi per il consiglio',
    sections: [
      ['Il nostro anno', 'Abbiamo completato tre progetti, avviato due collaborazioni e pubblicato sei studi. Il gruppo è cresciuto da 12 a 17 persone e i tempi di consegna si sono ridotti di un terzo.'],
      ['Risultati', 'I nuovi strumenti di analisi hanno ridotto il tempo medio di elaborazione da 40 a 18 minuti per campione. La qualità dei dati, misurata sulle verifiche esterne, è salita al 98,7%.'],
      ['Bilancio', 'Le entrate sono cresciute del 14% rispetto all’anno precedente, grazie ai contratti con l’industria. Il 60% della spesa è andato al personale, il 25% alle attrezzature.'],
      ['Prossimi passi', 'Nel 2027 apriremo una sede a Torino, porteremo i laboratori a lavorare in continuo e renderemo pubblici i nostri dati, come già il codice.'],
      ['Ringraziamenti', 'Grazie a chi ha lavorato con noi quest’anno, ai partner e ai revisori che hanno letto queste pagine prima di voi.'],
    ],
    quarters: ['T1', 'T2', 'T3', 'T4'],
  },
  en: {
    open: 'Open files',
    tools: 'Tools',
    applyWatermark: 'Apply watermark',
    file: 'Annual-report-2026.pdf',
    title: 'Annual report 2026',
    subtitle: 'Research lab · Summary for the board',
    sections: [
      ['Our year', 'We completed three projects, started two partnerships and published six studies. The team grew from 12 to 17 people, and delivery times fell by a third.'],
      ['Results', 'The new analysis tools cut the average processing time from 40 to 18 minutes per sample. Data quality, measured by external checks, rose to 98.7%.'],
      ['Budget', 'Income grew by 14% on the previous year, thanks to industry contracts. 60% of spending went to staff, 25% to equipment.'],
      ['Next steps', 'In 2027 we will open an office in Turin, run the labs around the clock, and publish our data, as we already do our code.'],
      ['Thanks', 'Thanks to everyone who worked with us this year, to our partners, and to the reviewers who read these pages before you.'],
    ],
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
  },
}

/** The sample document: a cover and one page per section, each with a small chart. */
function sampleHtml(lang) {
  const l = LANGUAGES[lang]
  const colours = ['#2f5bd3', '#1a9e77', '#d95f02', '#7570b3', '#e7298a']
  const chart = (seed) => {
    const bars = l.quarters
      .map((q, i) => {
        const h = 40 + ((seed * 37 + i * 53) % 110)
        return `<rect x="${30 + i * 90}" y="${170 - h}" width="56" height="${h}" rx="4" fill="${colours[(seed + i) % 5]}"/>
          <text x="${58 + i * 90}" y="192" text-anchor="middle" font-size="14" fill="#555">${q}</text>`
      })
      .join('')
    return `<svg viewBox="0 0 400 200" width="100%"><line x1="20" y1="170" x2="390" y2="170" stroke="#ccc"/>${bars}</svg>`
  }
  const pages = l.sections
    .map(
      ([title, text], i) => `
      <section class="page">
        <header><span>${l.title}</span><span>${i + 2}</span></header>
        <h2>${title}</h2>
        <p>${text}</p>
        <p>${text}</p>
        <figure>${chart(i + 1)}</figure>
        <p class="muted">${text.split('. ')[0]}.</p>
      </section>`,
    )
    .join('')
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 0 }
    body { margin: 0; font: 13pt/1.55 Georgia, serif; color: #1c2026 }
    .page { box-sizing: border-box; height: 297mm; padding: 22mm 22mm; page-break-after: always }
    .cover { background: linear-gradient(160deg, #1d3a8a, #2f5bd3 55%, #6f8ff0); color: #fff; display: flex; flex-direction: column; justify-content: flex-end }
    .cover h1 { font: 700 36pt/1.1 system-ui, sans-serif; margin: 0 0 8mm }
    .cover p { font: 15pt system-ui, sans-serif; opacity: .85; margin: 0 0 30mm }
    header { display: flex; justify-content: space-between; font: 10pt system-ui, sans-serif; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 3mm; margin-bottom: 10mm }
    h2 { font: 700 22pt system-ui, sans-serif; color: #2f5bd3; margin: 0 0 6mm }
    figure { margin: 8mm 0 }
    .muted { color: #666; font-style: italic }
  </style></head><body>
    <section class="page cover"><h1>${l.title}</h1><p>${l.subtitle}</p></section>
    ${pages}
  </body></html>`
}

/** A promo image: the icon and the name, on the brand gradient. */
function promoHtml(width, height) {
  const size = Math.round(height * 0.42)
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; gap: ${Math.round(height * 0.08)}px;
      background: linear-gradient(135deg, #1d3a8a, #2f5bd3 60%, #6f8ff0); color: #fff; font-family: system-ui, sans-serif }
    .icon svg { width: ${size}px; height: ${size}px; filter: drop-shadow(0 6px 18px rgba(0,0,0,.25)) }
    h1 { margin: 0; font-size: ${Math.round(height * 0.2)}px; font-weight: 800; letter-spacing: -.02em }
    p { margin: ${Math.round(height * 0.02)}px 0 0; font-size: ${Math.round(height * 0.075)}px; opacity: .9; max-width: ${Math.round(width * 0.5)}px }
  </style></head><body><div class="icon">${icon}</div><div><h1>pdfrs</h1><p>Edit PDFs in your browser. Files never leave your computer.</p></div></body></html>`
}

const out = mkdtempSync(join(tmpdir(), 'pdfrs-store-'))
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

  // Promo images and the store icon.
  mkdirSync(store, { recursive: true })
  for (const [name, width, height] of [
    ['promo-440x280', 440, 280],
    ['marquee-1400x560', 1400, 560],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } })
    await page.setContent(promoHtml(width, height))
    await page.screenshot({ path: join(store, `${name}.png`) })
    await page.close()
  }
  const iconPage = await browser.newPage({ viewport: { width: 128, height: 128 } })
  await iconPage.setContent(
    `<body style="margin:0;background:transparent"><div style="width:96px;height:96px;margin:16px">${icon.replace('<svg', '<svg width="96" height="96"')}</div></body>`,
  )
  await iconPage.screenshot({ path: join(store, 'icon-128.png'), omitBackground: true })
  await iconPage.close()

  for (const [lang, l] of Object.entries(LANGUAGES)) {
    const dir = join(store, 'screenshots', lang)
    mkdirSync(dir, { recursive: true })

    let sample = given
    if (!sample) {
      const printer = await browser.newPage()
      await printer.setContent(sampleHtml(lang))
      sample = join(out, l.file)
      writeFileSync(sample, await printer.pdf({ format: 'A4', printBackground: true }))
      await printer.close()
    }

    /** A fresh page in `theme`, with the sample open and its thumbnails drawn. */
    const open = async (theme) => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: theme })
      await page.addInitScript(
        ([lang, theme]) => {
          localStorage.setItem('pdfrs.locale', lang)
          localStorage.setItem('pdfrs.theme', theme)
        },
        [lang, theme],
      )
      await page.goto(home)
      const chooser = page.waitForEvent('filechooser')
      await page.getByRole('button', { name: l.open }).first().click()
      await (await chooser).setFiles(sample)
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
    const tool = (page, index) =>
      page.getByRole('navigation', { name: l.tools }).getByRole('button').nth(index).click()
    /** The tool panel scrolled down to its preview (the window itself stays put). */
    const showPreview = async (page) => {
      await page.locator('aside figure').last().evaluate((figure) => figure.scrollIntoView({ block: 'end' }))
      await page.evaluate(() => window.scrollTo(0, 0))
    }
    const shot = async (page, name) => {
      await page.waitForTimeout(700)
      await page.screenshot({ path: join(dir, `${name}.png`) })
    }

    // 1. Pages selected, signing.
    let page = await open('light')
    const cards = page.locator('main article')
    await cards.nth(1).click()
    await cards.nth(2).click({ modifiers: ['Shift'] })
    await tool(page, 0)
    await shot(page, '1-sign')
    await page.close()

    // 2. A watermark: on the thumbnails, and previewed in the panel.
    page = await open('light')
    await tool(page, 3)
    await page.getByRole('button', { name: l.applyWatermark }).click()
    await page.waitForTimeout(1500)
    await showPreview(page)
    await shot(page, '2-watermark')
    await page.close()

    // 3. Page numbers.
    page = await open('light')
    await tool(page, 4)
    // The cover is dark: the preview shows the first page with a number.
    await page.getByRole('checkbox', { name: /^(Salta|Skip)/ }).check()
    await showPreview(page)
    await shot(page, '3-page-numbers')
    await page.close()

    // 4. A page full size, dark.
    page = await open('dark')
    await page.locator('main article').nth(2).dblclick()
    await page.locator('dialog[open] img').first().waitFor()
    await shot(page, '4-viewer')
    await page.close()

    // 5. Password protection, dark.
    page = await open('dark')
    await tool(page, 11)
    await shot(page, '5-protect')
    await page.close()
  }
  console.log(`store images written to store/, with ${given ? basename(given) : 'the sample document'}`)
} finally {
  await browser.close()
  server.kill()
  rmSync(out, { recursive: true, force: true })
}
