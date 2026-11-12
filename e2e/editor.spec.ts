import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { expect, test, type Page } from '@playwright/test'

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

  await list.filter({ hasText: 'photo.jpg' }).locator('button.item').click()
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
