import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

import { bigPdf } from './big-pdf'

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
  // Let the thumbnails of the cards on screen arrive first: they change
  // those cards on their own, and would muddle the check below.
  let thumbnails = -1
  await expect
    .poll(
      async () => {
        const before = thumbnails
        thumbnails = await page.locator('main article img').count()
        return thumbnails > 0 && thumbnails === before
      },
      { intervals: [300] },
    )
    .toBe(true)

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

  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()
  // Editing shortcuts are back once the viewer is closed.
  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(() => pageIds(page)).toEqual([1, 2, 3, 4])
})
