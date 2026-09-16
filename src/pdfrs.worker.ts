import init, { page_count, render_page_preview } from 'pdfrs.js/full'

const ready = init()

self.onmessage = async (event) => {
  const { id, type, bytes, page, scale } = event.data
  try {
    await ready

    if (type === 'pageCount') {
      self.postMessage({ id, result: await page_count(bytes) })
      return
    }

    if (type === 'renderPage') {
      const png = await render_page_preview(bytes, page, scale)
      // trasferibile: il buffer è appena stato allocato da wasm-bindgen per
      // questa chiamata, quindi non serve a nessun altro nel worker.
      self.postMessage({ id, result: png }, [png.buffer])
      return
    }

    throw new Error(`Task sconosciuto: ${type}`)
  } catch (err) {
    self.postMessage({ id, error: String((err as Error)?.message ?? err) })
  }
}
