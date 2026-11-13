import { readFile } from 'node:fs/promises'
import { inflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

import { expect, test, type Locator, type Page } from '@playwright/test'

import { bigPdf, outlinedPdf } from './big-pdf'

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))

async function openFiles(page: Page, ...names: string[]) {
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Apri file' }).first().click()
  const chooser = await chooserPromise
  await chooser.setFiles(names.map(fixture))
}

const cards = (page: Page) => page.locator('main article')

async function pageIds(page: Page) {
  return cards(page).evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-page-id'))))
}

/** Waits until every card shows a thumbnail that has actually decoded. */
async function expectAllThumbnails(page: Page, count: number) {
  await expect(cards(page)).toHaveCount(count)
  await expect
    .poll(() =>
      cards(page).evaluateAll(
        (els) =>
          els.filter((el) => {
            const img = el.querySelector('img')
            return img?.complete && img.naturalWidth > 0
          }).length,
      ),
    )
    .toBe(count)
}

/** True when the element is entirely inside the window and smaller than its 100% width (595px). */
async function fitsInWindow(page: Page, element: Locator) {
  const box = (await element.boundingBox())!
  const viewport = page.viewportSize()!
  return box.y >= 0 && box.y + box.height <= viewport.height && box.width < 595
}

/** Draws a squiggle on the signature pad with the real mouse and uses it (the pad opens by itself while the library is empty). */
async function drawSignature(page: Page, viewer: Locator) {
  const pad = viewer.getByLabel('Area per disegnare la firma')
  const box = (await pad.boundingBox())!
  await page.mouse.move(box.x + 30, box.y + 90)
  await page.mouse.down()
  for (let i = 1; i <= 30; i++) {
    await page.mouse.move(box.x + 30 + i * 6, box.y + 90 - Math.sin(i / 3) * 30)
  }
  await page.mouse.up()
  await viewer.getByRole('button', { name: 'Usa questa firma' }).click()
}

/** The PDF's streams, decompressed where they're Flate-encoded (as text, latin1). */
function inflatedStreams(pdf: Buffer): string[] {
  const streams: string[] = []
  const raw = pdf.toString('latin1')
  const pattern = /stream\r?\n/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(raw))) {
    const start = match.index + match[0].length
    const end = raw.indexOf('endstream', start)
    if (end === -1) break
    const body = pdf.subarray(start, end)
    try {
      streams.push(inflateSync(body).toString('latin1'))
    } catch {
      streams.push(body.toString('latin1'))
    }
    pattern.lastIndex = end
  }
  return streams
}

/** Counts page objects in a PDF saved without object streams, as lopdf writes them. */
function countPdfPages(bytes: Buffer) {
  return bytes.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0
}

// Any uncaught error or console.error (a failed worker, a wasm panic...) fails the test.
let errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
})

test.afterEach(() => {
  expect(errors).toEqual([])
})

/** Waits for a document's bar in the sidebar to report every page rendered. */
async function expectRendered(page: Page, name: string, total: number, timeout = 20_000) {
  const bar = page.getByRole('progressbar', { name: `Anteprime di ${name}`, includeHidden: true })
  await expect(bar).toHaveAttribute('aria-valuemax', String(total))
  await expect(bar).toHaveAttribute('aria-valuenow', String(total), { timeout })
}

test('edits a PDF: rotate, delete, undo/redo, reorder, apply and download', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Trascina qui i tuoi PDF o JPEG')).toBeVisible()

  await openFiles(page, 'four_pages.pdf')
  await expect(page.getByRole('heading', { name: 'four_pages.pdf' })).toBeVisible()
  await expectAllThumbnails(page, 4)

  // Rotate page 1 clockwise.
  const first = cards(page).nth(0)
  await first.hover()
  await first.getByRole('button', { name: 'Ruota a destra' }).click()
  await expect(first.getByText('90°')).toBeVisible()
  await expect(page.getByText('modifiche non applicate')).toBeVisible()

  // Mark page 2 for deletion.
  const second = cards(page).nth(1)
  await second.hover()
  await second.getByRole('button', { name: 'Elimina pagina' }).click()
  await expect(second.getByText('Da eliminare')).toBeVisible()
  await expect(page.getByText('4 pagine · 1 da eliminare')).toBeVisible()

  // Undo and redo from the keyboard.
  await page.keyboard.press('ControlOrMeta+z')
  await expect(second.getByText('Da eliminare')).toBeHidden()
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expect(second.getByText('Da eliminare')).toBeVisible()

  // Drag page 4 onto the left half of page 1: it becomes the first page.
  await cards(page).nth(3).dragTo(cards(page).nth(0), { targetPosition: { x: 10, y: 60 } })
  await expect.poll(() => pageIds(page)).toEqual([4, 1, 2, 3])
  await expect(cards(page).nth(0).getByText('era 4')).toBeVisible()

  // Apply: page 2 goes away, the others are renumbered and re-rendered.
  await page.getByRole('button', { name: 'Applica modifiche' }).click()
  await expectAllThumbnails(page, 3)
  await expect(page.getByText('modifiche non applicate')).toBeHidden()
  await expect.poll(() => pageIds(page)).toEqual([1, 2, 3])

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('four_pages.pdf')
  const bytes = await readFile(await download.path())
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  expect(countPdfPages(bytes)).toBe(3)

  // Undoing the commit restores the four pages and their pending edits.
  await page.getByRole('button', { name: 'Annulla' }).click()
  await expectAllThumbnails(page, 4)
  await expect.poll(() => pageIds(page)).toEqual([4, 1, 2, 3])
})

test('opens several documents, including a JPEG, and switches between them', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'ten_pages.pdf', 'photo.jpg')

  const list = page.locator('aside li')
  await expect(list).toHaveCount(2)
  await expectAllThumbnails(page, 10)

  await list.filter({ hasText: 'photo.jpg' }).locator('button[aria-current]').click()
  await expect(page.getByRole('heading', { name: 'photo.jpg' })).toBeVisible()
  await expectAllThumbnails(page, 1)

  await page.getByRole('button', { name: 'Chiudi photo.jpg' }).click()
  await expect(list).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'ten_pages.pdf' })).toBeVisible()
})

test('reports a file it cannot open', async ({ page }) => {
  await page.goto('/')
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Apri file' }).first().click()
  const chooser = await chooserPromise
  await chooser.setFiles({ name: 'note.txt', mimeType: 'text/plain', buffer: Buffer.from('ciao') })

  await expect(page.getByRole('alert')).toContainText('note.txt')
  await expect(page.getByText('Trascina qui i tuoi PDF o JPEG')).toBeVisible()
})

test('dragging over a 900-page document touches nothing but the drop indicator', async ({
  page,
}) => {
  await page.goto('/')
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Apri file' }).first().click()
  const chooser = await chooserPromise
  await chooser.setFiles({ name: 'grande.pdf', mimeType: 'application/pdf', buffer: await bigPdf(30) })
  await expect(cards(page)).toHaveCount(900)
  // Let every thumbnail arrive first (they're rendered in the background
  // too): they change the cards on their own, and would muddle the check below.
  await expectRendered(page, 'grande.pdf', 900, 60_000)

  // `dragover` fires continuously during a drag: each one must stay O(1).
  // Synthetic events, because Playwright's dragTo only does a single drop.
  const mutations = await page.evaluate(async () => {
    const grid = document.querySelector('main article')!.parentElement!
    const all = [...grid.querySelectorAll<HTMLElement>(':scope > article')]
    const transfer = new DataTransfer()
    const over = (card: HTMLElement, side: 'before' | 'after') => {
      const rect = card.getBoundingClientRect()
      const x = side === 'before' ? rect.left + 5 : rect.right - 5
      card.dispatchEvent(
        new DragEvent('dragover', {
          dataTransfer: transfer,
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: rect.top + 10,
        }),
      )
    }
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

    all[5]!.dispatchEvent(new DragEvent('dragstart', { dataTransfer: transfer, bubbles: true }))
    await settle()

    const touched = new Set<string>()
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const el = record.target instanceof Element ? record.target : record.target.parentElement
        const card = el?.closest('article')
        touched.add(card ? `card ${card.dataset.pageId}` : el === grid ? 'grid' : 'indicator')
      }
    })
    observer.observe(grid, { subtree: true, childList: true, attributes: true, characterData: true })

    for (let i = 0; i < 20; i++) {
      over(all[i % 3]!, i % 2 ? 'before' : 'after')
      await settle()
    }
    for (let i = 0; i < 10; i++) {
      over(all[1]!, 'before') // pointer standing still
      await settle()
    }
    observer.disconnect()

    all[5]!.dispatchEvent(new DragEvent('dragend', { dataTransfer: transfer, bubbles: true }))
    return [...touched]
  })
  // The indicator appears inside the grid (a childList change on it) and moves.
  expect(mutations.filter((m) => m.startsWith('card'))).toEqual([])

  // Worst case for the reorder: the last page dropped in front of the first.
  await cards(page).nth(0).scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const all = [...document.querySelectorAll<HTMLElement>('main article')]
    const transfer = new DataTransfer()
    const first = all[0]!.getBoundingClientRect()
    const init = {
      dataTransfer: transfer,
      bubbles: true,
      cancelable: true,
      clientX: first.left + 5,
      clientY: first.top + 10,
    }
    all[899]!.dispatchEvent(new DragEvent('dragstart', { dataTransfer: transfer, bubbles: true }))
    all[0]!.dispatchEvent(new DragEvent('dragover', init))
    all[0]!.dispatchEvent(new DragEvent('drop', init))
  })
  await expect.poll(async () => (await pageIds(page)).slice(0, 3)).toEqual([900, 1, 2])
  await expect(cards(page).nth(1).locator('footer')).toContainText('2')
})

test('opens a page full size and walks through the pages in their current order', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)

  // Reorder first (page 4 in front), so the arrows must follow the new order.
  await cards(page).nth(3).dragTo(cards(page).nth(0), { targetPosition: { x: 10, y: 60 } })
  await expect.poll(() => pageIds(page)).toEqual([4, 1, 2, 3])

  await cards(page).nth(0).getByRole('button', { name: /a grandezza reale/ }).click()
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  await expect(viewer).toBeVisible()
  await expect(viewer.locator('header')).toContainText('Pagina 1 di 4')
  await expect(viewer.locator('header')).toContainText('era 4')
  // 100%: one PDF point per CSS pixel (the fixture is A4, 595 x 842 pt).
  const image = viewer.locator('img[data-full="true"]')
  await expect(image).toHaveCSS('width', '595px')
  await expect(image).toHaveCSS('height', '842px')

  await page.keyboard.press('ArrowRight')
  await expect(viewer.locator('header')).toContainText('Pagina 2 di 4')
  await expect(viewer.locator('header')).toContainText('era 1')
  await page.keyboard.press('End')
  await expect(viewer.locator('header')).toContainText('Pagina 4 di 4')
  await page.keyboard.press('ArrowRight') // already the last one: stays
  await expect(viewer.locator('header')).toContainText('Pagina 4 di 4')
  await page.keyboard.press('ArrowLeft')
  await expect(viewer.locator('header')).toContainText('Pagina 3 di 4')

  // Fit: the whole page inside the window, then back to 100%.
  const fits = () => fitsInWindow(page, image)
  await page.keyboard.press('0')
  await expect(viewer.getByRole('button', { name: 'Adatta' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(fits).toBe(true)
  await page.keyboard.press('1')
  await expect(image).toHaveCSS('width', '595px')
  await viewer.getByRole('button', { name: 'Adatta' }).click()
  await expect.poll(fits).toBe(true)

  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()

  // The zoom choice is kept for the next opening, and a page rotated a
  // quarter turn is fitted by its rotated (landscape) size.
  const third = cards(page).nth(2)
  await third.hover()
  await third.getByRole('button', { name: 'Ruota a destra' }).click()
  await third.getByRole('button', { name: /a grandezza reale/ }).click()
  await expect(viewer.getByRole('button', { name: 'Adatta' })).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(async () => {
      const box = (await image.boundingBox())!
      return box.width > box.height && box.width <= page.viewportSize()!.width
    })
    .toBe(true)
  await page.keyboard.press('Escape')
  await page.keyboard.press('ControlOrMeta+z') // undo the rotation
  // Editing shortcuts are back once the viewer is closed.
  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => pageIds(page)).toEqual([1, 2, 3, 4])
})

test('selects pages, acts on them together, drags them as a block and extracts them', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'ten_pages.pdf')
  await expectAllThumbnails(page, 10)
  const thumb = (index: number) => cards(page).nth(index).getByRole('checkbox', { name: /Seleziona/ })
  const selectedIds = () =>
    cards(page).evaluateAll((els) =>
      els
        .filter((el) => el.querySelector('[role=checkbox]')?.getAttribute('aria-checked') === 'true')
        .map((el) => Number(el.getAttribute('data-page-id'))),
    )
  const bar = page.getByRole('toolbar', { name: 'Azioni sulle pagine selezionate' })

  // A click on a thumbnail selects (it doesn't open the viewer: that's the
  // magnifier), shift+click selects a range, another click toggles.
  await thumb(1).click()
  await thumb(4).click({ modifiers: ['Shift'] })
  await expect(bar).toContainText('4 pagine selezionate')
  await thumb(2).click()
  await expect.poll(selectedIds).toEqual([2, 4, 5])
  await expect(page.getByRole('dialog')).toBeHidden()

  // One rotation for all of them, undone in one step.
  await bar.getByRole('button', { name: 'Ruota a destra le pagine selezionate' }).click()
  for (const index of [1, 3, 4]) await expect(cards(page).nth(index).getByText('90°')).toBeVisible()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.getByText('90°')).toHaveCount(0)

  // Delete key marks them, pressing it again restores them.
  await page.keyboard.press('Delete')
  await expect(page.getByText('Da eliminare', { exact: true })).toHaveCount(3)
  await expect(bar.getByRole('button', { name: 'Ripristina' })).toBeVisible()
  await page.keyboard.press('Delete')
  await expect(page.getByText('Da eliminare', { exact: true })).toHaveCount(0)

  // Dragging one selected page moves the whole selection after page 8.
  await cards(page).nth(3).dragTo(cards(page).nth(7), { targetPosition: { x: 150, y: 60 } })
  await expect.poll(() => pageIds(page)).toEqual([1, 3, 6, 7, 8, 2, 4, 5, 9, 10])

  // Extract: a new document with those pages, in their current order.
  await bar.getByRole('button', { name: 'Estrai in un nuovo documento' }).click()
  const notice = page.getByRole('status').filter({ hasText: 'ten_pages (estratto).pdf' })
  await expect(notice).toContainText('3 pagine')
  await expect(page.locator('aside li')).toHaveCount(2)
  await notice.getByRole('button', { name: 'Apri' }).click()
  await expect(page.getByRole('heading', { name: 'ten_pages (estratto).pdf' })).toBeVisible()
  await expectAllThumbnails(page, 3)

  // Back on the source: Escape clears the selection, Cmd/Ctrl+A selects all.
  await page.locator('aside li').filter({ hasText: /^ten_pages\.pdf/ }).locator('button[aria-current]').click()
  await expect(bar).toContainText('3 pagine selezionate')
  await page.keyboard.press('Escape')
  await expect(bar).toBeHidden()
  await page.keyboard.press('ControlOrMeta+a')
  await expect(bar).toContainText('10 pagine selezionate')
})

test('moves pages to another document, inserts a file and merges documents', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'ten_pages.pdf', 'four_pages.pdf')
  await expectAllThumbnails(page, 10)
  const docs = page.locator('aside li')
  const doc = (name: string) => docs.filter({ hasText: name })

  // Select pages 2-3 and drag them onto the other document in the sidebar.
  const thumb = (index: number) => cards(page).nth(index).getByRole('checkbox', { name: /Seleziona/ })
  await thumb(1).click()
  await thumb(2).click({ modifiers: ['Shift'] })
  await cards(page).nth(1).dragTo(doc('four_pages.pdf'))
  const notice = page.getByRole('status').filter({ hasText: 'four_pages.pdf' })
  await expect(notice).toContainText('Spostate 2 pagine')
  await expect(page.getByText('Da eliminare', { exact: true })).toHaveCount(2)

  await notice.getByRole('button', { name: 'Apri' }).click()
  await expect(page.getByRole('heading', { name: 'four_pages.pdf' })).toBeVisible()
  await expectAllThumbnails(page, 6)

  // Insert a whole file at the end.
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Inserisci pagine' }).click()
  await (await chooserPromise).setFiles(fixture('two_pages.pdf'))
  await expectAllThumbnails(page, 8)
  await page.keyboard.press('ControlOrMeta+z') // one undo step removes the inserted file
  await expectAllThumbnails(page, 6)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await expectAllThumbnails(page, 8)

  // Merge from the tools panel: every open document is listed, in the
  // sidebar's order (ten_pages, four_pages); four_pages goes first.
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Unisci' }).click()
  const panel = page.getByRole('complementary', { name: 'Unisci documenti' })
  await panel.getByRole('button', { name: 'Sposta su four_pages.pdf' }).click()
  await expect(panel.locator('[data-merge-id]').first()).toContainText('four_pages.pdf')
  await panel.getByRole('button', { name: 'Unisci 2 documenti (16 pagine)' }).click()
  await expect(page.getByRole('heading', { name: 'Unione di 2 documenti.pdf' })).toBeVisible()
  await expect(cards(page)).toHaveCount(16)
  await expect(panel).toBeHidden()
  await expect(docs).toHaveCount(3)
})

test('draws a signature, places and moves it on a page, then writes it into the PDF', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)

  await cards(page).nth(0).getByRole('button', { name: /a grandezza reale/ }).click()
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  await expect(viewer.locator('img[data-full="true"]')).toBeVisible()
  await viewer.getByRole('button', { name: 'Firma', exact: true }).click()

  await drawSignature(page, viewer)

  // Placed in the middle of the page and selected.
  const stamp = viewer.locator('[data-annotation]')
  await expect(stamp).toHaveCount(1)
  await expect(stamp).toHaveAttribute('aria-pressed', 'true')
  await expect(viewer.getByRole('button', { name: 'Metti «Firma 1» sulla pagina' })).toBeVisible()

  // Drag it down-left: one move, one undo step.
  const before = (await stamp.boundingBox())!
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + before.width / 2 - 80, before.y + before.height / 2 + 60, {
    steps: 8,
  })
  await page.mouse.up()
  const after = (await stamp.boundingBox())!
  expect(after.x).toBeLessThan(before.x - 60)
  expect(after.y).toBeGreaterThan(before.y + 40)

  // Turn it with the knob above it: a quarter turn clockwise snaps to 90°.
  const knob = viewer.getByRole('slider', { name: 'Ruota' })
  const frame = (await stamp.boundingBox())!
  const centre = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }
  const start = (await knob.boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + 6)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) {
    const angle = (i / 10) * (Math.PI / 2) - 0.04 // ends at 88°: snapped to 90°
    await page.mouse.move(centre.x + Math.sin(angle) * 90, centre.y - Math.cos(angle) * 90)
  }
  await page.mouse.up()
  await expect(knob).toHaveAttribute('aria-valuenow', '90')
  await expect(cards(page).nth(0).locator('[data-stamp]')).toHaveCSS('transform', /matrix\(0, 1, -1, 0/)

  // Esc first deselects, then closes; the card shows the pending signature.
  await page.keyboard.press('Escape')
  await expect(stamp).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
  await expect(cards(page).nth(0).locator('[data-stamp]')).toHaveCount(1)
  await expect(page.getByText('modifiche non applicate')).toBeVisible()

  // Applying writes it into the page: no overlay anymore, an image in the file.
  await page.getByRole('button', { name: 'Applica modifiche' }).click()
  await expect(page.getByText('modifiche non applicate')).toBeHidden()
  await expect(cards(page).nth(0).locator('[data-stamp]')).toHaveCount(0)
  await expectAllThumbnails(page, 4)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica' }).click()
  const pdf = (await readFile(await (await downloadPromise).path())).toString('latin1')
  expect(pdf).toMatch(/\/Subtype\s*\/Image/)
  expect(pdf).toMatch(/\/SMask/) // transparent around the ink
})

test('puts a signature on every page and moves just one copy on its own', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)
  await cards(page).nth(0).getByRole('button', { name: /a grandezza reale/ }).click()
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  await expect(viewer.locator('img[data-full="true"]')).toBeVisible()
  await viewer.getByRole('button', { name: 'Firma', exact: true }).click()
  await drawSignature(page, viewer)

  const bar = viewer.getByRole('group', { name: 'Firma selezionata' })
  const onAll = bar.getByRole('checkbox', { name: /Uguale su tutte le pagine/ })
  await onAll.check()
  await expect(bar).toContainText('(4)')
  const stampLeft = (index: number) =>
    cards(page).nth(index).locator('[data-stamp]').evaluate((el) => (el as HTMLElement).style.left)
  for (const index of [0, 1, 2, 3]) {
    await expect(cards(page).nth(index).locator('[data-stamp]')).toHaveCount(1)
  }
  const together = await stampLeft(2)

  // On page 2 the signature would cover something: unlink just that copy and move it.
  await page.keyboard.press('ArrowRight')
  await expect(viewer.locator('header')).toContainText('Pagina 2 di 4')
  const stamp = viewer.locator('[data-annotation]')
  await stamp.click()
  await onAll.uncheck()
  await expect(bar).toContainText('Modificata solo su questa pagina')
  const box = (await stamp.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 100, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()

  await expect.poll(() => stampLeft(1)).not.toBe(together) // page 2 moved...
  expect(await stampLeft(2)).toBe(together) // ...page 3 didn't
  expect(await stampLeft(0)).toBe(together)

  // Removing a linked copy takes the linked ones away, not page 2's.
  await page.keyboard.press('ArrowLeft')
  await stamp.click()
  await expect(bar.getByRole('button', { name: 'Rimuovi da 3 pagine' })).toBeVisible()
  await bar.getByRole('button', { name: 'Rimuovi da 3 pagine' }).click()
  await expect(page.locator('main [data-stamp]')).toHaveCount(1)
  await expect(cards(page).nth(1).locator('[data-stamp]')).toHaveCount(1)
})

test('a click selects the page, the magnifier or a double-click opens it', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  const thumb = cards(page).nth(1).getByRole('checkbox', { name: /Seleziona/ })

  await thumb.click()
  await expect(thumb).toHaveAttribute('aria-checked', 'true')
  await expect(viewer).toBeHidden()
  await thumb.click()
  await expect(thumb).toHaveAttribute('aria-checked', 'false')

  await cards(page).nth(1).getByRole('button', { name: /a grandezza reale/ }).click()
  await expect(viewer.locator('header')).toContainText('Pagina 2 di 4')
  await page.keyboard.press('Escape')

  // A double-click opens it too, and leaves the selection as it was.
  await thumb.dblclick()
  await expect(viewer.locator('header')).toContainText('Pagina 2 di 4')
  await page.keyboard.press('Escape')
  await expect(thumb).toHaveAttribute('aria-checked', 'false')

  // From the keyboard: Space selects, Enter opens.
  await thumb.focus()
  await page.keyboard.press('Space')
  await expect(thumb).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Enter')
  await expect(viewer).toBeVisible()
})

test('renames a document from the sidebar or from its title', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  const item = page.locator('aside li').first()

  // Sidebar: the pen, then type over the name (the extension isn't selected).
  await item.hover()
  await item.getByRole('button', { name: 'Rinomina four_pages.pdf' }).click()
  const field = page.getByRole('textbox', { name: 'Nuovo nome per four_pages.pdf' })
  await expect(field).toBeFocused()
  await page.keyboard.type('contratto')
  await page.keyboard.press('Enter')
  await expect(item).toContainText('contratto.pdf')
  await expect(page.getByRole('heading', { name: 'contratto.pdf' })).toBeVisible()

  // Title: double-click; Esc gives up without touching the page selection.
  await cards(page).nth(0).getByRole('checkbox', { name: /Seleziona/ }).click()
  await page.getByRole('heading', { name: 'contratto.pdf' }).dblclick()
  await page.keyboard.type('da buttare')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'contratto.pdf' })).toBeVisible()
  await expect(page.getByRole('toolbar', { name: 'Azioni sulle pagine selezionate' })).toBeVisible()

  // Leaving the field saves too, and the download takes the new name.
  await page.getByRole('heading', { name: 'contratto.pdf' }).hover()
  await page.locator('main').getByRole('button', { name: 'Rinomina contratto.pdf' }).click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Contratto firmato')
  await page.getByRole('button', { name: 'Inserisci pagine' }).focus()
  await expect(page.getByRole('heading', { name: 'Contratto firmato' })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica' }).click()
  expect((await downloadPromise).suggestedFilename()).toBe('Contratto firmato.pdf')
})

test('merge panel: drag to reorder, take out and add back documents', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf', 'two_pages.pdf', 'ten_pages.pdf')
  await expect(page.locator('aside li')).toHaveCount(3)
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Unisci' }).click()
  const panel = page.getByRole('complementary', { name: 'Unisci documenti' })
  const order = () => panel.locator('[data-merge-id]').allInnerTexts()
  const rows = panel.locator('[data-merge-id]')
  await expect(rows).toHaveCount(3)

  // ten_pages dragged above four_pages.
  await rows.nth(2).dragTo(rows.nth(0), { targetPosition: { x: 40, y: 4 } })
  await expect.poll(async () => (await order()).map((t) => t.split('\n')[1])).toEqual([
    'ten_pages.pdf',
    'four_pages.pdf',
    'two_pages.pdf',
  ])

  await panel.getByRole('button', { name: 'Togli two_pages.pdf dall’unione' }).click()
  await expect(rows).toHaveCount(2)
  await expect(panel.getByRole('button', { name: 'Unisci 2 documenti (14 pagine)' })).toBeVisible()
  await panel.getByRole('button', { name: 'Aggiungi two_pages.pdf all’unione' }).click()
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(2)).toContainText('two_pages.pdf') // back at the end
})

test('sign tool: draw a signature in the panel and it lands on the selected page', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)
  await cards(page).nth(2).getByRole('checkbox', { name: /Seleziona/ }).click()

  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Firma' }).click()
  const panel = page.getByRole('complementary', { name: 'Firma' })
  await panel.getByRole('button', { name: 'Disegna una firma' }).click()
  await drawSignature(page, panel)

  // The viewer opens on the selected page, with the signature placed and selected.
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  await expect(viewer.locator('header')).toContainText('Pagina 3 di 4')
  await expect(viewer.locator('[data-annotation]')).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect(cards(page).nth(2).locator('[data-stamp]')).toHaveCount(1)

  // The library keeps it: one click puts it on the page shown in the tile.
  await expect(panel).toContainText('1 firma su 1 pagina')
  await panel.getByRole('button', { name: 'Metti «Firma 1» sulla pagina 3' }).click()
  await expect(viewer.locator('[data-annotation]')).toHaveCount(2)
})

test('N-up and booklet tools make new documents from the selection or the whole document', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'ten_pages.pdf')
  await expectAllThumbnails(page, 10)
  const tools = page.getByRole('navigation', { name: 'Strumenti' })

  // N-up on three selected pages, two per sheet: two sheets.
  await cards(page).nth(0).getByRole('checkbox', { name: /Seleziona/ }).click()
  await cards(page).nth(2).getByRole('checkbox', { name: /Seleziona/ }).click({ modifiers: ['Shift'] })
  await tools.getByRole('button', { name: 'N per foglio' }).click()
  const nup = page.getByRole('complementary', { name: 'Più pagine per foglio' })
  await expect(nup).toContainText('Si applica alle 3 pagine selezionate')
  await expect(nup.locator('[data-sheet] > *')).toHaveCount(2)
  await nup.getByRole('radio', { name: '4' }).click()
  await expect(nup.locator('[data-sheet] > *')).toHaveCount(4)
  await expect(nup).toContainText('2 × 2, foglio verticale')
  await nup.getByRole('radio', { name: '2' }).click()
  await nup.getByRole('button', { name: 'Crea documento (2 fogli)' }).click()
  await expect(page.getByRole('heading', { name: 'ten_pages (2 per foglio).pdf' })).toBeVisible()
  await expectAllThumbnails(page, 2)
  await expect(nup).toBeHidden()

  // Booklet of the whole original: 10 pages padded to 12, 3 sheets, 6 faces.
  await page.getByRole('status').getByRole('button', { name: 'Torna all’originale' }).click()
  await page.keyboard.press('Escape') // clear the selection: the whole document
  await tools.getByRole('button', { name: 'Libretto' }).click()
  const booklet = page.getByRole('complementary', { name: 'Libretto' })
  await expect(booklet).toContainText('3 fogli da piegare · 2 pagine bianche aggiunte')
  await booklet.getByRole('button', { name: 'Crea libretto' }).click()
  await expect(page.getByRole('heading', { name: 'ten_pages (libretto).pdf' })).toBeVisible()
  await expectAllThumbnails(page, 6)
  await expect(page.locator('aside li')).toHaveCount(3)
})

test('image tool: upload a picture and place it on the selected page', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)
  await cards(page).nth(1).getByRole('checkbox', { name: /Seleziona/ }).click()

  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Immagine' }).click()
  const panel = page.getByRole('complementary', { name: 'Immagine' })
  const chooserPromise = page.waitForEvent('filechooser')
  await panel.getByRole('button', { name: 'Carica un’immagine' }).click()
  await (await chooserPromise).setFiles(fixture('photo.jpg'))

  // Placed on the selected page, selected, kept as it is (not a signature).
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  await expect(viewer.locator('header')).toContainText('Pagina 2 di 4')
  const placed = viewer.getByRole('button', { name: 'Immagine sulla pagina (selezionata)' })
  await expect(placed).toBeVisible()
  await expect(viewer.getByRole('group', { name: 'Immagine selezionata' })).toBeVisible()
  await expect(panel).not.toContainText('sfondo bianco')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await expect(panel).toContainText('1 immagine su 1 pagina')
  await expect(panel.getByRole('button', { name: 'Metti «photo» sulla pagina 2' })).toBeVisible()
  await expect(cards(page).nth(1).locator('[data-stamp]')).toHaveCount(1)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica' }).click()
  const pdf = (await readFile(await (await downloadPromise).path())).toString('latin1')
  expect(pdf).toMatch(/\/Subtype\s*\/Image/)
})

test('split tool: from the selection, every N pages, or typed ranges', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'ten_pages.pdf')
  await expectAllThumbnails(page, 10)

  // Page 3 marked for deletion; pages 4 and 8 start new parts.
  await cards(page).nth(2).hover()
  await cards(page).nth(2).getByRole('button', { name: 'Elimina pagina' }).click()
  await cards(page).nth(3).getByRole('checkbox', { name: /Seleziona/ }).click()
  await cards(page).nth(7).getByRole('checkbox', { name: /Seleziona/ }).click()

  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Dividi' }).click()
  const panel = page.getByRole('complementary', { name: 'Dividi documento' })
  await panel.getByRole('radio', { name: 'Selezione' }).click()
  const parts = panel.getByRole('region', { name: 'Parti' })
  await expect(parts.locator('li')).toHaveText([
    /Parte 1: pagine 1–3\s*2 pagine/,
    /Parte 2: pagine 4–7\s*4 pagine/,
    /Parte 3: pagine 8–10\s*3 pagine/,
  ])
  await expect(panel).toContainText('Le pagine segnate da eliminare vengono lasciate fuori')
  // The cards show the cut: each page its part, the deleted one left out.
  const partsOnCards = () => cards(page).evaluateAll((els) => els.map((el) => el.getAttribute('data-part')))
  await expect.poll(partsOnCards).toEqual(['1', '1', '0', '2', '2', '2', '2', '3', '3', '3'])
  await expect(cards(page).nth(4)).toContainText('Parte 2')
  await expect(cards(page).nth(2)).toContainText('esclusa')

  // Typed ranges are checked as they're written.
  await panel.getByRole('radio', { name: 'Intervalli' }).click()
  await panel.getByRole('textbox', { name: 'Intervalli di pagine' }).fill('1-2, 9-12')
  await expect(panel.getByRole('alert')).toContainText('da 1 a 10')
  await expect.poll(partsOnCards).toEqual(Array(10).fill(null)) // nothing valid to show
  await expect(panel.getByRole('button', { name: 'Indica come dividere' })).toBeDisabled()

  // Every 4 pages: 3 parts, the first one without the deleted page.
  await panel.getByRole('radio', { name: 'Ogni N' }).click()
  await panel.getByRole('spinbutton', { name: 'Pagine per parte' }).fill('4')
  await panel.getByRole('button', { name: 'Dividi in 3 documenti' }).click()
  await expect(page.getByRole('heading', { name: 'ten_pages (parte 1 di 3).pdf' })).toBeVisible()
  // Panel closed: no colours on any document.
  await expect(page.locator('main article[data-part]')).toHaveCount(0)
  await page.locator('aside li').filter({ hasText: /^ten_pages\.pdf/ }).locator('button[aria-current]').click()
  await expect(page.locator('main article[data-part]')).toHaveCount(0)
  await page.locator('aside li').nth(1).locator('button[aria-current]').click()
  await expectAllThumbnails(page, 3)
  await expect(page.locator('aside li')).toHaveCount(4)
  await expect(page.locator('aside li').nth(3)).toContainText('2') // pages 9-10
})

test('image library tiles keep a large portrait photo inside, without widening the panel', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Immagine' }).click()
  const panel = page.getByRole('complementary', { name: 'Immagine' })

  // A 1200 x 1600 "photo", much bigger than its tile, with a long name.
  const png = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(1200, 1600)
    const context = canvas.getContext('2d')!
    context.fillStyle = '#1f8f5a'
    context.fillRect(0, 0, 1200, 1600)
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  })
  const chooserPromise = page.waitForEvent('filechooser')
  await panel.getByRole('button', { name: 'Carica un’immagine' }).click()
  await (await chooserPromise).setFiles({
    name: 'photo_2026-11-09_scheda_elettronica_con_un_nome_lungo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png),
  })
  await page.getByRole('dialog', { name: 'Anteprima pagina' }).waitFor()
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  const tile = panel.locator('li').first()
  const picture = (await tile.locator('img').boundingBox())!
  const frame = (await tile.locator('img').locator('..').boundingBox())!
  expect(picture.y).toBeGreaterThanOrEqual(frame.y - 0.5)
  expect(picture.y + picture.height).toBeLessThanOrEqual(frame.y + frame.height + 0.5)
  expect(picture.x + picture.width).toBeLessThanOrEqual(frame.x + frame.width + 0.5)

  const overflow = await panel.evaluate((el) => {
    const body = el.querySelector<HTMLElement>('.overflow-y-auto')!
    return body.scrollWidth - body.clientWidth
  })
  expect(overflow).toBe(0)
})

test('stretches a placed image from its side handles, and puts its proportions back', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Immagine' }).click()
  const chooserPromise = page.waitForEvent('filechooser')
  await page
    .getByRole('complementary', { name: 'Immagine' })
    .getByRole('button', { name: 'Carica un’immagine' })
    .click()
  await (await chooserPromise).setFiles(fixture('photo.jpg'))
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  await viewer.getByRole('button', { name: 'Adatta' }).click()
  const placed = viewer.locator('[data-annotation]')
  await expect(placed).toHaveAttribute('aria-pressed', 'true')

  const drag = async (handle: Locator, dx: number, dy: number) => {
    const box = (await handle.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 6 })
    await page.mouse.up()
  }
  const size = async () => {
    const box = (await placed.boundingBox())!
    return { width: Math.round(box.width), height: Math.round(box.height) }
  }

  const natural = await size()
  await drag(viewer.getByRole('slider', { name: 'Allunga o accorcia' }), 0, 40)
  const taller = await size()
  expect(taller.width).toBe(natural.width)
  expect(taller.height).toBeGreaterThan(natural.height + 30)

  await drag(viewer.getByRole('slider', { name: 'Allarga o stringi' }), -50, 0)
  const narrower = await size()
  expect(narrower.height).toBe(taller.height)
  expect(narrower.width).toBeLessThan(taller.width - 40)

  // Turned a quarter: the "right" side now points down on screen. Stretching
  // it must keep the opposite side - now the top - where it is.
  const knob = viewer.getByRole('slider', { name: 'Ruota' })
  const frame = (await placed.boundingBox())!
  const centre = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }
  const knobBox = (await knob.boundingBox())!
  await page.mouse.move(knobBox.x + knobBox.width / 2, knobBox.y + 6)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) {
    const angle = (i / 10) * (Math.PI / 2)
    await page.mouse.move(centre.x + Math.sin(angle) * 120, centre.y - Math.cos(angle) * 120)
  }
  await page.mouse.up()
  await expect(knob).toHaveAttribute('aria-valuenow', '90')
  const turned = (await placed.boundingBox())!
  await drag(viewer.getByRole('slider', { name: 'Allarga o stringi' }), 0, 50)
  const stretched = (await placed.boundingBox())!
  expect(Math.abs(stretched.y - turned.y)).toBeLessThan(2) // top side stayed
  expect(Math.abs(stretched.x - turned.x)).toBeLessThan(2)
  expect(stretched.height).toBeGreaterThan(turned.height + 40)
  expect(Math.abs(stretched.width - turned.width)).toBeLessThan(2)
  await page.keyboard.press('ControlOrMeta+z')
  await page.keyboard.press('ControlOrMeta+z') // back upright, as before the turn

  // Shift: from the centre - both sides move, the centre stays.
  const beforeShift = (await placed.boundingBox())!
  await page.keyboard.down('Shift')
  await drag(viewer.getByRole('slider', { name: 'Allarga o stringi' }), 30, 0)
  await page.keyboard.up('Shift')
  const fromCentre = (await placed.boundingBox())!
  expect(fromCentre.width).toBeGreaterThan(beforeShift.width + 50) // 30 on each side
  expect(
    Math.abs(fromCentre.x + fromCentre.width / 2 - (beforeShift.x + beforeShift.width / 2)),
  ).toBeLessThan(2)
  await page.keyboard.press('ControlOrMeta+z')

  // Back to the image's own proportions: the height follows the width again.
  await viewer.getByRole('button', { name: 'Proporzioni originali' }).click()
  const restored = await size()
  expect(restored.width).toBe(narrower.width)
  expect(Math.abs(restored.height / restored.width - natural.height / natural.width)).toBeLessThan(0.02)
  await expect(viewer.getByRole('button', { name: 'Proporzioni originali' })).toBeHidden()
})

test('the header slider sets the thumbnail size, with sharper renders for big cards', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'ten_pages.pdf')
  await expectAllThumbnails(page, 10)
  const slider = page.getByRole('slider', { name: 'Dimensione delle anteprime' })
  const cardWidth = async () => Math.round((await cards(page).first().boundingBox())!.width)
  const renderWidth = () =>
    cards(page).first().locator('img').first().evaluate((img) => (img as HTMLImageElement).naturalWidth)

  const before = { card: await cardWidth(), render: await renderWidth() }
  await slider.fill('340')
  await expect.poll(cardWidth).toBeGreaterThan(before.card + 100)
  await expect.poll(renderWidth).toBeGreaterThan(before.render * 1.5) // re-rendered sharper

  // Switching back and forth while renders are on their way: every card
  // still ends up with its thumbnail.
  for (const value of ['120', '300', '150', '360', '170']) await slider.fill(value)
  await expectAllThumbnails(page, 10)

  // Remembered for the next visit.
  await page.reload()
  await expect(slider).toHaveValue('170')
})

test('a bar under each document fills as its pages render, and starts over at a new size', async ({
  page,
}) => {
  await page.goto('/')
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Apri file' }).first().click()
  await (await chooserPromise).setFiles([
    { name: 'lungo.pdf', mimeType: 'application/pdf', buffer: await bigPdf(4) },
    {
      name: 'ten_pages.pdf',
      mimeType: 'application/pdf',
      buffer: await readFile(fixture('ten_pages.pdf')),
    },
  ])
  // Both documents render, not just the one on show; the bars then fade out.
  await expectRendered(page, 'lungo.pdf', 120)
  await expectRendered(page, 'ten_pages.pdf', 10)
  const bar = page.getByRole('progressbar', { name: 'Anteprime di lungo.pdf', includeHidden: true })
  await expect(bar).toHaveCSS('opacity', '0')
  // Every page has its thumbnail, even far down the grid.
  await cards(page).last().scrollIntoViewIfNeeded()
  await expect(cards(page).last().locator('img').first()).toBeVisible()

  // Bigger cards want sharper thumbnails: rendered all over again.
  await page.getByRole('slider', { name: 'Dimensione delle anteprime' }).fill('340')
  await expect.poll(() => bar.getAttribute('aria-valuenow')).not.toBe('120')
  await expectRendered(page, 'lungo.pdf', 120)
})

test('text tool: real text placed, edited with a double-click, written into the PDF as text', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Testo' }).click()
  const panel = page.getByRole('complementary', { name: 'Testo' })
  await panel.getByRole('textbox', { name: 'Testo' }).fill('Approvato\nMario Rossi')
  await panel.getByRole('button', { name: 'Grassetto' }).click()
  await panel.getByRole('radio', { name: 'Times' }).click()
  await expect(panel.getByRole('figure', { name: 'Anteprima del testo' })).toContainText('Approvato')

  // Characters the standard fonts lack are flagged.
  await panel.getByRole('textbox', { name: 'Testo' }).fill('Approvato ✓\nMario Rossi')
  await expect(panel.getByRole('status')).toContainText('«?»')
  await panel.getByRole('textbox', { name: 'Testo' }).fill('Approvato\nMario Rossi')
  await expect(panel.getByRole('status')).toBeHidden()

  await panel.getByRole('button', { name: 'Metti su pagina 1' }).click()
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  const placed = viewer.getByRole('button', { name: 'Testo sulla pagina (selezionato)' })
  await expect(placed).toBeVisible()
  await expect(placed).toContainText('Mario Rossi')
  const width = (await placed.boundingBox())!.width

  // Double-click: edit; the box grows with the text, the size stays.
  await placed.dblclick()
  const editor = viewer.getByRole('complementary', { name: 'Modifica testo' })
  await editor.getByRole('textbox', { name: 'Testo' }).fill('Approvato e firmato\nMario Rossi')
  await editor.getByRole('button', { name: 'Applica' }).click()
  await expect(editor).toBeHidden()
  await expect(placed).toContainText('firmato')
  expect((await placed.boundingBox())!.width).toBeGreaterThan(width * 1.3)

  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect(cards(page).nth(0).locator('[data-stamp]')).toContainText('firmato')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica' }).click()
  const pdf = (await readFile(await (await downloadPromise).path())).toString('latin1')
  expect(pdf).toMatch(/\/BaseFont\s*\/Times-Bold/) // a standard font...
  expect(pdf).not.toMatch(/FontFile/) // ...not embedded
  // The text itself, as text: shown (Tj) in a content stream, once inflated.
  const hex = Buffer.from('Approvato e firmato', 'latin1').toString('hex')
  const contents = inflatedStreams(await readFile(await (await downloadPromise).path()))
  expect(contents.some((stream) => stream.toLowerCase().includes(hex) && stream.includes('Tj'))).toBe(true)
})

test('colour pickers: any colour for text, and for the signature ink (even after drawing)', async ({
  page,
}) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  const tools = page.getByRole('navigation', { name: 'Strumenti' })

  // Text: a colour of one's own, shown as its code and used in the preview.
  await tools.getByRole('button', { name: 'Testo' }).click()
  const text = page.getByRole('complementary', { name: 'Testo' })
  await text.getByRole('textbox', { name: 'Testo' }).fill('Colorato')
  await text.getByLabel('Scegli un altro colore').fill('#ff8800')
  await expect(text.getByRole('radiogroup', { name: 'Colore' })).toContainText('#ff8800')
  await expect(text.getByRole('figure', { name: 'Anteprima del testo' }).locator('text')).toHaveAttribute(
    'fill',
    '#ff8800',
  )
  await text.getByRole('radio', { name: 'Blu' }).click()
  await expect(text.getByRole('radio', { name: 'Blu' })).toHaveAttribute('aria-checked', 'true')

  // Signature: draw, then change the ink - the drawing changes colour too.
  await tools.getByRole('button', { name: 'Firma' }).click()
  const sign = page.getByRole('complementary', { name: 'Firma' })
  await sign.getByRole('button', { name: 'Disegna una firma' }).click()
  const pad = sign.getByLabel('Area per disegnare la firma')
  const box = (await pad.boundingBox())!
  await page.mouse.move(box.x + 30, box.y + 90)
  await page.mouse.down()
  for (let i = 1; i <= 20; i++) await page.mouse.move(box.x + 30 + i * 8, box.y + 90 - (i % 2) * 20)
  await page.mouse.up()
  await sign.getByLabel('Scegli un altro colore').fill('#7a1fa2')
  const inked = await pad.evaluate((canvas) => {
    const { data } = (canvas as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 400, 300)
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] === 255) return [data[i], data[i + 1], data[i + 2]]
    return null
  })
  expect(inked).toEqual([0x7a, 0x1f, 0xa2])
})

test('protects a copy with a password, opens a protected PDF and unlocks it', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'ten_pages.pdf')
  await expectAllThumbnails(page, 10)
  const sidebar = page.getByRole('complementary').filter({ hasText: 'Documenti' })

  // Typed twice: a typo is caught before it locks the copy for good.
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Proteggi' }).click()
  const panel = page.getByRole('complementary', { name: 'Proteggi con password' })
  const create = panel.getByRole('button', { name: 'Crea copia protetta' })
  await panel.getByLabel('Password', { exact: true }).fill('segreta')
  await panel.getByLabel('Ripeti la password').fill('segretx')
  await expect(panel.getByRole('alert')).toHaveText('Le due password non coincidono.')
  await expect(create).toBeDisabled()
  await panel.getByLabel('Ripeti la password').fill('segreta')
  await create.click()

  // The copy: listed with a lock, no pages, downloadable as it is - encrypted.
  const locked = page.getByRole('region', { name: 'ten_pages (protetto).pdf, protetto da password' })
  await expect(locked).toBeVisible()
  await expect(sidebar.getByRole('img', { name: 'Protetto da password' })).toHaveCount(1)
  const downloadPromise = page.waitForEvent('download')
  await locked.getByRole('button', { name: 'Scarica protetto' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('ten_pages (protetto).pdf')
  const encrypted = await readFile(await download.path())
  expect(encrypted.toString('latin1')).toMatch(/\/Encrypt\s/)

  // Opened from disk, a protected PDF comes in locked too.
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Apri file' }).first().click()
  await (await chooserPromise).setFiles({
    name: 'riservato.pdf',
    mimeType: 'application/pdf',
    buffer: encrypted,
  })
  // Listed with its lock, in the name the list reads out.
  await sidebar.getByRole('button', { name: 'Protetto da password riservato.pdf' }).click()
  const opened = page.getByRole('region', { name: 'riservato.pdf, protetto da password' })
  const field = opened.getByLabel('Password del documento')
  await expect(field).toBeFocused()

  await field.fill('sbagliata')
  await field.press('Enter')
  await expect(opened.getByRole('alert')).toHaveText('Password errata: riprova.')

  await field.fill('segreta')
  await opened.getByRole('button', { name: 'Sblocca' }).click()
  await expect(page.getByRole('heading', { name: 'riservato (sbloccato).pdf' })).toBeVisible()
  await expectAllThumbnails(page, 10)
  await expect(sidebar.getByRole('img', { name: 'Protetto da password' })).toHaveCount(2)
})

test('edits the document properties, written into the PDF with the download', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Proprietà' }).click()
  const panel = page.getByRole('complementary', { name: 'Proprietà del documento' })
  const title = panel.getByLabel('Titolo')
  await expect(title).toBeVisible()

  // Saved on leaving the field, or on Enter; marked until applied.
  await title.fill('Relazione 2026')
  await title.press('Enter')
  await expect(panel.getByText('Titolo · modificato')).toBeVisible()
  await panel.getByLabel('Autore').fill('Ufficio tecnico')
  await panel.getByLabel('Autore').blur()
  await panel.getByLabel('Creato il').fill('2024-07-01T09:05')
  await panel.getByLabel('Creato il').blur()
  await expect(page.getByText('modifiche non applicate')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica', exact: true }).click()
  const pdf = (await readFile(await (await downloadPromise).path())).toString('latin1')
  expect(pdf).toMatch(/\/Title\s*\(Relazione 2026\)/)
  expect(pdf).toMatch(/\/Author\s*\(Ufficio tecnico\)/)
  expect(pdf).toMatch(/\/CreationDate\s*\(D:20240701090500[+-]\d\d'\d\d'\)/)

  // Undone like any other edit; all of them cleared in one go.
  await page.getByRole('button', { name: 'Annulla' }).click()
  await expect(panel.getByLabel('Creato il')).toHaveValue('')
  await panel.getByRole('button', { name: 'Togli tutte le proprietà' }).click()
  await expect(title).toHaveValue('')
  await expect(panel.getByLabel('Autore')).toHaveValue('')
  await expect(panel.getByRole('button', { name: 'Togli tutte le proprietà' })).toBeDisabled()
})

test('images already in the PDF: listed, downloaded, removed from the viewer, undone', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'photo.jpg')
  await expectAllThumbnails(page, 1)
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Immagini' }).click()
  const panel = page.getByRole('complementary', { name: 'Immagini del documento' })
  await expect(panel.getByTestId('images-summary')).toContainText('1 immagine')
  await expect(panel).toContainText('400 × 300 px')
  await expect(panel).toContainText('JPEG')

  // Downloaded as it's stored in the PDF: the very JPEG that was opened.
  const imagePromise = page.waitForEvent('download')
  await panel.getByRole('button', { name: 'Scarica l’immagine di pagina 1' }).click()
  const image = await imagePromise
  expect(image.suggestedFilename()).toBe('photo - immagine 1.jpg')
  expect(await readFile(await image.path())).toEqual(await readFile(fixture('photo.jpg')))

  // Opened from the list: the viewer shows it selected, and takes it away.
  await panel.getByRole('button', { name: /400 × 300 px/ }).click()
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  const bar = viewer.getByRole('group', { name: 'Immagine del documento selezionata' })
  await expect(bar).toContainText('pagina 1')
  await bar.getByRole('button', { name: 'Rimuovi da questa pagina' }).click()
  await expect(bar).toContainText('Da rimuovere')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()

  // Struck through on the thumbnail, pending until applied.
  await expect(cards(page).first().locator('[data-image-layer="card"] .hatch-removed')).toHaveCount(1)
  await expect(page.getByText('modifiche non applicate')).toBeVisible()
  const pdfPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica', exact: true }).click()
  const pdf = (await readFile(await (await pdfPromise).path())).toString('latin1')
  expect(pdf).not.toMatch(/\/Subtype\s*\/Image/)

  // Undone like any other edit.
  await page.getByRole('button', { name: 'Annulla' }).click()
  await expect(cards(page).first().locator('.hatch-removed')).toHaveCount(0)
  await expect(panel.getByTestId('images-summary')).not.toContainText('da rimuovere')
})

/** A picture made by the page itself (canvas), as file bytes: `kind` PNG or JPEG. */
async function canvasPicture(page: Page, width: number, height: number, kind: 'png' | 'grainy-jpeg') {
  const bytes = await page.evaluate(
    async ([width, height, kind]) => {
      const canvas = new OffscreenCanvas(width, height)
      const context = canvas.getContext('2d')!
      if (kind === 'png') {
        context.fillStyle = '#0000ff'
        context.fillRect(0, 0, width, height)
        return Array.from(new Uint8Array(await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer()))
      }
      const pixels = context.createImageData(width, height)
      for (let i = 0; i < pixels.data.length; i += 4) {
        const grain = Math.floor(Math.random() * 48)
        pixels.data.set([150 + grain, 90 + grain / 2, 60, 255], i)
      }
      context.putImageData(pixels, 0, 0)
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 })
      return Array.from(new Uint8Array(await blob.arrayBuffer()))
    },
    [width, height, kind] as const,
  )
  return Buffer.from(bytes)
}

test('images already in the PDF: one replaced by another picture, undone', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'photo.jpg')
  await expectAllThumbnails(page, 1)
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Immagini' }).click()
  const panel = page.getByRole('complementary', { name: 'Immagini del documento' })
  await expect(panel).toContainText('400 × 300 px')

  // A square in place of the 4:3 photo: fitted inside its box, the sides transparent.
  const square = await canvasPicture(page, 90, 90, 'png')
  const chooserPromise = page.waitForEvent('filechooser')
  await panel.getByRole('button', { name: 'Sostituisci l’immagine di pagina 1' }).click()
  await (await chooserPromise).setFiles({ name: 'quadrato.png', mimeType: 'image/png', buffer: square })
  await expect(page.getByText('Immagine sostituita')).toBeVisible()
  await expect(panel).toContainText('120 × 90 px')
  await expectAllThumbnails(page, 1)

  // In the file at once (no "Applica modifiche"): with its soft mask.
  const pdfPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica', exact: true }).click()
  const pdf = (await readFile(await (await pdfPromise).path())).toString('latin1')
  expect(pdf).toMatch(/\/SMask/)

  // A step of the history like the others, and undone.
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Cronologia' }).click()
  await expect(page.getByRole('complementary', { name: 'Cronologia delle modifiche' })).toContainText(
    'Sostituisci immagine (pagina 1)',
  )
  await page.getByRole('button', { name: 'Annulla' }).click()
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Immagini' }).click()
  await expect(panel).toContainText('400 × 300 px')
})

test('images already in the PDF: a lighter copy with them recompressed', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  const heavy = await canvasPicture(page, 2000, 1500, 'grainy-jpeg')
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Apri file' }).first().click()
  await (await chooserPromise).setFiles({ name: 'grande.jpg', mimeType: 'image/jpeg', buffer: heavy })
  await expectAllThumbnails(page, 1)

  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Immagini' }).click()
  const panel = page.getByRole('complementary', { name: 'Immagini del documento' })
  await panel.getByRole('radio', { name: /File piccolo/ }).check()
  await panel.getByRole('button', { name: 'Comprimi le immagini' }).click()

  // A new document, opened; the original left as it was.
  await expect(page.getByText(/Creato «grande \(compresso\)\.pdf»: da .* a .* \(−\d+%\)/)).toBeVisible({
    timeout: 30_000,
  })
  const list = page.getByRole('complementary').filter({ hasText: 'Documenti' }).first()
  await expect(list).toContainText('grande.jpg')
  await expect(list).toContainText('grande (compresso).pdf')
  await expectAllThumbnails(page, 1)
})

test('history panel: every step listed, a click goes back or forward to it', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'four_pages.pdf')
  await expectAllThumbnails(page, 4)
  const first = cards(page).nth(0)
  await first.hover()
  await first.getByRole('button', { name: 'Ruota a destra' }).click()
  const second = cards(page).nth(1)
  await second.hover()
  await second.getByRole('button', { name: 'Elimina pagina' }).click()

  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Cronologia' }).click()
  const history = page.getByRole('list', { name: 'Cronologia delle modifiche' })
  // Newest on top, the current step marked.
  await expect(history.getByRole('button')).toHaveText([
    'Elimina pagina 2',
    'Ruota pagina 1 di +90°',
    'Documento aperto',
  ])
  await expect(history.locator('[aria-current="step"]')).toHaveText('Elimina pagina 2')

  // Straight back to the start: both edits undone, still listed.
  await history.getByRole('button', { name: 'Documento aperto' }).click()
  await expect(page.getByText('modifiche non applicate')).toBeHidden()
  await expect(first.getByText('90°')).toBeHidden()
  await expect(history.locator('[aria-current="step"]')).toHaveText('Documento aperto')
  await expect(history.getByText('annullato')).toHaveCount(2)

  // And forward to the last step in one click.
  await history.getByRole('button', { name: /Elimina pagina 2/ }).click()
  await expect(second.getByText('Da eliminare')).toBeVisible()
  await expect(first.getByText('90°')).toBeVisible()

  // A new edit drops what was undone.
  await history.getByRole('button', { name: 'Documento aperto' }).click()
  await first.hover()
  await first.getByRole('button', { name: 'Ruota a sinistra' }).click()
  await expect(history.getByRole('button')).toHaveText(['Ruota pagina 1 di -90°', 'Documento aperto'])
})

test('each photo is put on its own page, A4 by default, changed in the viewer', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'photo.jpg')
  await expectAllThumbnails(page, 1)
  const download = async () => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Scarica', exact: true }).click()
    return (await readFile(await (await downloadPromise).path())).toString('latin1')
  }
  // A 400 x 300 photo: a landscape A4 (842 x 595 pt) by default, the photo centred within 1 cm.
  expect(await download()).toMatch(/\/MediaBox\s*\[\s*0(?:\.0+)?\s+0(?:\.0+)?\s+841\.89\d*\s+595\.28\d*\s*\]/)

  // In the viewer: put on a page of its own size, made the default for the next photos.
  await cards(page).first().getByRole('checkbox', { name: /Seleziona pagina/ }).dblclick()
  const viewer = page.getByRole('dialog', { name: 'Anteprima pagina' })
  const photo = viewer.getByRole('group', { name: 'Pagina della foto' })
  await expect(photo.getByRole('button', { name: 'A4' })).toHaveAttribute('aria-pressed', 'true')
  await expect(photo).toContainText('predefinita per le prossime foto')
  await photo.getByRole('button', { name: 'Dimensione reale' }).click()
  await expect(photo.getByRole('button', { name: 'Dimensione reale' })).toHaveAttribute('aria-pressed', 'true')
  // A page of the photo's own size has no margin to choose.
  await expect(photo.getByRole('group', { name: 'Margine' })).toBeHidden()
  // Still the same page, not one moved from elsewhere.
  await expect(viewer.locator('header')).not.toContainText('era')
  await photo.getByRole('button', { name: 'Usa per le prossime foto' }).click()
  await expect(photo).toContainText('predefinita per le prossime foto')
  await page.keyboard.press('Escape')
  expect(await download()).toMatch(/\/MediaBox\s*\[\s*0(?:\.0+)?\s+0(?:\.0+)?\s+400(?:\.0+)?\s+300(?:\.0+)?\s*\]/)

  // The next photo, after a reload, gets the new default; undo takes the change back.
  await page.reload()
  await openFiles(page, 'photo.jpg')
  await expectAllThumbnails(page, 1)
  expect(await download()).toMatch(/\/MediaBox\s*\[\s*0(?:\.0+)?\s+0(?:\.0+)?\s+400(?:\.0+)?\s+300(?:\.0+)?\s*\]/)
  await cards(page).first().getByRole('checkbox', { name: /Seleziona pagina/ }).dblclick()
  await photo.getByRole('button', { name: 'A4' }).click()
  await expect(photo).toContainText('Usa per le prossime foto')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Annulla' }).click()
  expect(await download()).toMatch(/\/MediaBox\s*\[\s*0(?:\.0+)?\s+0(?:\.0+)?\s+400(?:\.0+)?\s+300(?:\.0+)?\s*\]/)
})

test('the margin around a photo is chosen per photo, and can become the default', async ({ page }) => {
  await page.goto('/')
  await openFiles(page, 'photo.jpg')
  await expectAllThumbnails(page, 1)
  /** Height of the photo as drawn on the page, in points (from its `cm`). */
  const drawnHeight = async () => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Scarica', exact: true }).click()
    const pdf = await readFile(await (await downloadPromise).path())
    const content = inflatedStreams(pdf).find((stream) => /\/Im0\s+Do/.test(stream))!
    const [, , height] = /([\d.]+)\s+0(?:\.0+)?\s+0(?:\.0+)?\s+([\d.]+)\s+[\d.]+\s+[\d.]+\s+cm/.exec(content)!
    return Number(height)
  }
  // Landscape A4 (595.28 pt tall), 1 cm (28.35 pt) above and below by default.
  expect(await drawnHeight()).toBeCloseTo(595.28 - 2 * 28.35, 0)

  await cards(page).first().getByRole('checkbox', { name: /Seleziona pagina/ }).dblclick()
  const photo = page.getByRole('group', { name: 'Pagina della foto' })
  const margin = photo.getByRole('group', { name: 'Margine' })
  await expect(margin.getByRole('button', { name: '1 cm' })).toHaveAttribute('aria-pressed', 'true')
  await margin.getByRole('button', { name: 'Nessuno' }).click()
  await expect(margin.getByRole('button', { name: 'Nessuno' })).toHaveAttribute('aria-pressed', 'true')
  await photo.getByRole('button', { name: 'Usa per le prossime foto' }).click()
  await expect(photo).toContainText('predefinita per le prossime foto')
  await page.keyboard.press('Escape')
  // Edge to edge, top to bottom.
  expect(await drawnHeight()).toBeCloseTo(595.28, 0)

  // The next photo gets no margin either.
  await page.reload()
  await openFiles(page, 'photo.jpg')
  await expectAllThumbnails(page, 1)
  expect(await drawnHeight()).toBeCloseTo(595.28, 0)
  await page.evaluate(() => localStorage.clear())
})

test('outline: shown as a tree, an entry goes to its page, kept through edits and merges', async ({ page }) => {
  await page.goto('/')
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Apri file' }).first().click()
  await (await chooserPromise).setFiles({ name: 'manuale.pdf', mimeType: 'application/pdf', buffer: await outlinedPdf() })
  await expectAllThumbnails(page, 10)

  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Indice' }).click()
  const tree = page.getByRole('tree', { name: 'Indice del documento' })
  // "Capitolo 2" starts closed, as the PDF has it: its child doesn't show.
  await expect(tree.getByRole('treeitem')).toHaveText([
    /Introduzione\s*p\. 1/,
    /Capitolo 1\s*p\. 2/,
    /Il dettaglio\s*p\. 3/,
    /Capitolo 2\s*p\. 6/,
  ])
  await tree.getByRole('button', { name: 'Apri Capitolo 2' }).click()
  await expect(tree.getByRole('treeitem').last()).toHaveText(/Appendice nascosta\s*p\. 9/)

  // An entry brings its page into view, selected.
  await tree.getByRole('button', { name: /Appendice nascosta/ }).click()
  const ninth = cards(page).nth(8)
  await expect(ninth.getByRole('checkbox', { name: /Seleziona pagina/ })).toHaveAttribute('aria-checked', 'true')
  await expect(ninth).toBeInViewport()

  // Shift picks every page from the last entry clicked to this one, as on the cards.
  await tree.getByRole('button', { name: /^Capitolo 1/ }).click()
  await tree.getByRole('button', { name: /^Capitolo 2/ }).click({ modifiers: ['Shift'] })
  await expect(page.getByText('5 pagine selezionate')).toBeVisible()
  await page.getByRole('button', { name: 'Deseleziona' }).click()

  // Page 3 marked for deletion: its entry says so; once applied, it's gone from the file.
  const third = cards(page).nth(2)
  await third.scrollIntoViewIfNeeded()
  await third.hover()
  await third.getByRole('button', { name: 'Elimina pagina' }).click()
  await expect(tree.getByRole('treeitem').nth(2)).toHaveText(/Il dettaglio\s*da eliminare/)
  await page.getByRole('button', { name: 'Applica modifiche' }).click()
  // Read again from the applied file: "Capitolo 2" closed as written, one page earlier.
  await expect(tree.getByRole('treeitem')).toHaveText([
    /Introduzione\s*p\. 1/,
    /Capitolo 1\s*p\. 2/,
    /Capitolo 2\s*p\. 5/,
  ])
  await tree.getByRole('button', { name: 'Apri Capitolo 2' }).click()
  await expect(tree.getByRole('treeitem').last()).toHaveText(/Appendice nascosta\s*p\. 8/)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica', exact: true }).click()
  const pdf = (await readFile(await (await downloadPromise).path())).toString('latin1')
  expect(pdf).toContain('/Outlines')
  expect(pdf).toMatch(/\/Title\s*\(Capitolo 1\)/)
  expect(pdf).not.toContain('Il dettaglio')

  // Merged with another document: one branch per document, named after it.
  await openFiles(page, 'four_pages.pdf')
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Unisci' }).click()
  await page.getByRole('complementary', { name: 'Unisci documenti' }).getByRole('button', { name: /^Unisci/ }).click()
  await expect(page.getByRole('heading', { name: 'Unione di 2 documenti.pdf' })).toBeVisible()
  await page.getByRole('navigation', { name: 'Strumenti' }).getByRole('button', { name: 'Indice' }).click()
  await expect(tree.getByRole('treeitem').first()).toHaveText(/manuale\s*p\. 1/)
  await expect(tree.getByRole('treeitem', { name: /four_pages/ })).toHaveText(/four_pages\s*p\. 10/)
})


test('theme: follows the system until chosen, then stays as chosen', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const html = page.locator('html')
  const themes = page.getByRole('radiogroup', { name: 'Tema' })
  await expect(themes.getByRole('radio', { name: /automatico/ })).toHaveAttribute('aria-checked', 'true')
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(html).toHaveAttribute('data-theme', 'light')

  // Chosen: dark whatever the system says, and still so after a reload.
  await themes.getByRole('radio', { name: 'Tema scuro' }).click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 22, 26)')
  await themes.getByRole('radio', { name: /automatico/ }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
})

test('language: the switcher changes every text, and the choice is kept', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', 'it')
  await expect(page.getByRole('button', { name: 'Apri file' }).first()).toBeVisible()

  await page.getByRole('combobox', { name: 'Lingua' }).selectOption('en')
  await expect(html).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: 'Open files' }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Apri file' })).toHaveCount(0)

  // Remembered over the browser's language, and texts the store makes follow too.
  await page.reload()
  await expect(html).toHaveAttribute('lang', 'en')
  const chooserPromise = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Open files' }).first().click()
  await (await chooserPromise).setFiles(fixture('four_pages.pdf'))
  await expect(page.getByText('4 pages')).toBeVisible()

  for (const [code, open] of [
    ['de', 'Dateien öffnen'],
    ['es', 'Abrir archivos'],
    ['fr', 'Ouvrir des fichiers'],
  ]) {
    await page.getByRole('combobox').first().selectOption(code!)
    await expect(html).toHaveAttribute('lang', code!)
    await expect(page.getByRole('button', { name: open! }).first()).toBeVisible()
  }
  await page.getByRole('combobox').first().selectOption('it')
})
