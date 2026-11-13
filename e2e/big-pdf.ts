import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// The "core" wasm build from the sibling pdfrs repo, the same one the app
// uses through pdfrs-editor. Run directly in Node here, only to build a big
// test document without committing a large fixture.
const pkg = new URL('../../pdfrs/pkg-npm/core/', import.meta.url)

/** A PDF of `copies` × 30 pages, by merging the 30-page fixture with itself. */
export async function bigPdf(copies: number): Promise<Buffer> {
  const wasm = await import(new URL('pdfrs.js', pkg).href)
  await wasm.default({ module_or_path: await readFile(fileURLToPath(new URL('pdfrs_bg.wasm', pkg))) })
  const source = await readFile(fileURLToPath(new URL('./fixtures/many_pages.pdf', import.meta.url)))
  const merged: Uint8Array = await wasm.merge_pdfs(
    Array.from({ length: copies }, () => new Uint8Array(source)),
  )
  return Buffer.from(merged)
}

/** The 10-page fixture with an outline: a few entries, one branch starting closed. */
export async function outlinedPdf(): Promise<Buffer> {
  const wasm = await import(new URL('pdfrs.js', pkg).href)
  await wasm.default({ module_or_path: await readFile(fileURLToPath(new URL('pdfrs_bg.wasm', pkg))) })
  const source = await readFile(fileURLToPath(new URL('./fixtures/ten_pages.pdf', import.meta.url)))
  const outlined: Uint8Array = await wasm.write_outline(new Uint8Array(source), [
    { title: 'Introduzione', level: 1, page: 1, open: true },
    { title: 'Capitolo 1', level: 1, page: 2, open: true },
    { title: 'Il dettaglio', level: 2, page: 3, open: true },
    { title: 'Capitolo 2', level: 1, page: 6, open: false },
    { title: 'Appendice nascosta', level: 2, page: 9, open: true },
  ])
  return Buffer.from(outlined)
}
