import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The real package spins up Web Workers running wasm, which jsdom has no
// equivalent for. This fake keeps the parts of the PdfDocument contract the
// store relies on: pages in display order, pending rotations/deletions,
// undo/redo, and a baseline (`getBytes()`) that only a commit replaces.
vi.mock('pdfrs-editor', () => {
  type Page = { id: number; pendingRotation: number; markedForDeletion: boolean }

  class FakeDocument {
    bytes: Uint8Array
    pageList: Page[]
    undoStack: { bytes: Uint8Array; pages: Page[]; annotations: unknown }[] = []
    redoStack: { bytes: Uint8Array; pages: Page[]; annotations: unknown }[] = []
    pngs = new Map<string, Uint8Array>()

    constructor(bytes: Uint8Array, count: number) {
      this.bytes = bytes
      this.pageList = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        pendingRotation: 0,
        markedForDeletion: false,
      }))
    }
    private save() {
      this.undoStack.push({
        bytes: this.bytes,
        pages: structuredClone(this.pageList),
        annotations: this.annotationList,
      })
      this.redoStack = []
    }
    private page(id: number) {
      const page = this.pageList.find((p) => p.id === id)
      if (!page) throw new Error(`pagina ${id} inesistente`)
      return page
    }
    pages() {
      return structuredClone(this.pageList)
    }
    getBytes() {
      return this.bytes
    }
    hasPendingChanges() {
      return (
        this.annotationList.length > 0 ||
        this.pageList.some(
          (p, i) => p.pendingRotation !== 0 || p.markedForDeletion || p.id !== i + 1,
        )
      )
    }
    canUndo() {
      return this.undoStack.length > 0
    }
    canRedo() {
      return this.redoStack.length > 0
    }
    rotatePage(id: number, degrees: number) {
      this.save()
      const page = this.page(id)
      page.pendingRotation = (((page.pendingRotation + degrees) % 360) + 360) % 360
    }
    deletePage(id: number) {
      this.save()
      this.page(id).markedForDeletion = true
    }
    restorePage(id: number) {
      this.save()
      this.page(id).markedForDeletion = false
    }
    movePage(id: number, toIndex: number) {
      this.save()
      const page = this.page(id)
      this.pageList.splice(this.pageList.indexOf(page), 1)
      this.pageList.splice(toIndex, 0, page)
    }
    // Group edits: one undo step each, like the real model.
    rotatePages(ids: number[], degrees: number) {
      this.save()
      for (const id of ids) {
        const page = this.page(id)
        page.pendingRotation = (((page.pendingRotation + degrees) % 360) + 360) % 360
      }
    }
    deletePages(ids: number[]) {
      this.save()
      for (const id of ids) this.page(id).markedForDeletion = true
    }
    restorePages(ids: number[]) {
      this.save()
      for (const id of ids) this.page(id).markedForDeletion = false
    }
    movePages(ids: number[], toIndex: number) {
      this.save()
      const moving = new Set(ids)
      const block = this.pageList.filter((p) => moving.has(p.id))
      const rest = this.pageList.filter((p) => !moving.has(p.id))
      this.pageList = [...rest.slice(0, toIndex), ...block, ...rest.slice(toIndex)]
    }
    // Annotations, kept simple: pending, undoable through the same snapshots.
    assets = new Map<number, unknown>()
    annotationList: {
      id: number
      page: number
      asset: number
      x: number
      y: number
      width: number
      group: number | null
      linked: boolean
    }[] = []
    nextAnnotation = 1
    addAsset(asset: unknown) {
      const id = this.assets.size + 1
      this.assets.set(id, asset)
      return id
    }
    annotations() {
      return structuredClone(this.annotationList)
    }
    addAnnotation(a: { page: number; asset: number; x: number; y: number; width: number }) {
      this.save()
      const id = this.nextAnnotation++
      this.annotationList = [...this.annotationList, { ...a, id, group: null, linked: false }]
      return id
    }
    applyAnnotationToAllPages(id: number) {
      this.save()
      const source = this.annotationList.find((a) => a.id === id)!
      const linked = { ...source, group: 1, linked: true }
      const copies = this.pageList
        .filter((p) => p.id !== source.page)
        .map((p) => ({ ...linked, id: this.nextAnnotation++, page: p.id }))
      this.annotationList = [
        ...this.annotationList.map((a) => (a.id === id ? linked : a)),
        ...copies,
      ]
    }
    detachAnnotation(id: number) {
      this.save()
      this.annotationList = this.annotationList.map((a) =>
        a.id === id ? { ...a, linked: false } : a,
      )
    }
    updateAnnotation(id: number, patch: object) {
      this.save()
      this.annotationList = this.annotationList.map((a) => (a.id === id ? { ...a, ...patch } : a))
    }
    removeAnnotation(id: number) {
      this.save()
      this.annotationList = this.annotationList.filter((a) => a.id !== id)
    }
    async insertPages(bytes: Uint8Array, at?: number) {
      this.save()
      const added = bytes[10] ?? bytes[0] ?? 1
      const first = Math.max(0, ...this.pageList.map((p) => p.id)) + 1
      const pages = Array.from({ length: added }, (_, i) => ({
        id: first + i,
        pendingRotation: 0,
        markedForDeletion: false,
      }))
      this.pageList.splice(at ?? this.pageList.length, 0, ...pages)
      this.bytes = new Uint8Array([this.pageList.length])
      return pages.map((p) => p.id)
    }
    undo() {
      const prev = this.undoStack.pop()
      if (!prev) return false
      this.redoStack.push({
        bytes: this.bytes,
        pages: this.pageList,
        annotations: this.annotationList,
      })
      ;({ bytes: this.bytes, pages: this.pageList } = prev)
      this.annotationList = prev.annotations as typeof this.annotationList
      return true
    }
    redo() {
      const next = this.redoStack.pop()
      if (!next) return false
      this.undoStack.push({
        bytes: this.bytes,
        pages: this.pageList,
        annotations: this.annotationList,
      })
      ;({ bytes: this.bytes, pages: this.pageList } = next)
      this.annotationList = next.annotations as typeof this.annotationList
      return true
    }
    async commit() {
      this.save()
      const kept = this.pageList.filter((p) => !p.markedForDeletion)
      this.bytes = new Uint8Array([kept.length])
      this.pageList = kept.map((_, i) => ({
        id: i + 1,
        pendingRotation: 0,
        markedForDeletion: false,
      }))
    }
    async exportBytes() {
      return new Uint8Array([this.pageList.filter((p) => !p.markedForDeletion).length])
    }
    async exportPages(ids: number[]) {
      return new Uint8Array([ids.length])
    }
    async getPreviews(
      _scale: number,
      options: { range: { start: number; end: number }; onPreview?: (p: unknown) => void },
    ) {
      for (const page of this.pageList.slice(options.range.start - 1, options.range.end)) {
        const key = `${this.bytes[0]}:${page.id}`
        if (!this.pngs.has(key)) this.pngs.set(key, new Uint8Array([page.id]))
        options.onPreview?.({ ...page, png: this.pngs.get(key) })
      }
      return []
    }
  }

  class PdfEditor {
    docs = new Map<number, FakeDocument>()
    nextId = 1
    async addDocument(bytes: Uint8Array) {
      const id = this.nextId++
      this.docs.set(id, new FakeDocument(bytes, bytes[10] ?? 3))
      return id
    }
    async addImage() {
      const id = this.nextId++
      this.docs.set(id, new FakeDocument(new Uint8Array([1]), 1))
      return id
    }
    getDocument(id: number) {
      const doc = this.docs.get(id)
      if (!doc) throw new Error(`nessun documento con id ${id}`)
      return doc
    }
    async mergeDocuments(ids: number[]) {
      const shown = ids.map((id) =>
        this.getDocument(id)
          .pages()
          .filter((p) => !p.markedForDeletion),
      )
      const newId = this.nextId++
      const total = shown.reduce((sum, pages) => sum + pages.length, 0)
      this.docs.set(newId, new FakeDocument(new Uint8Array([total]), total))
      return newId
    }
    async transferPages(from: number, pages: number[], to: number, options: { move?: boolean }) {
      const inserted = await this.getDocument(to).insertPages(new Uint8Array([pages.length]))
      if (options.move) this.getDocument(from).deletePages(pages)
      return inserted
    }
    async extractPages(id: number, pages: number[]) {
      this.getDocument(id)
      const newId = this.nextId++
      this.docs.set(newId, new FakeDocument(new Uint8Array([pages.length]), pages.length))
      return newId
    }
    removeDocument(id: number) {
      this.docs.delete(id)
    }
  }

  return { PdfEditor }
})

vi.mock('pdfrs-editor/operations', () => ({
  // A JPEG becomes a one-page PDF.
  image_to_pdf: async () => new Uint8Array([1]),
  // Imposition: the fake document's page count lives in byte 10, see pdfFile().
  nup_pdf: async (bytes: Uint8Array, options: { layout: number }) => {
    const out = new Uint8Array(16)
    out[10] = Math.ceil((bytes[0] ?? 0) / options.layout)
    return out
  },
  booklet_pdf: async (bytes: Uint8Array) => {
    const out = new Uint8Array(16)
    out[10] = Math.ceil((bytes[0] ?? 0) / 4) * 2
    return out
  },
}))

import { useEditorStore } from '@/stores/editor'

/** A file the store will take for a PDF; byte 10 tells the fake how many pages it has. */
function pdfFile(name: string, pages: number) {
  const bytes = new Uint8Array(16)
  bytes.set(new TextEncoder().encode('%PDF-1.7\n'))
  bytes[10] = pages
  return new File([bytes], name, { type: 'application/pdf' })
}

/** Lets the frame-batched preview requests run. */
async function flushPreviews() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

let urlCount = 0
const revoked: string[] = []

beforeEach(() => {
  setActivePinia(createPinia())
  urlCount = 0
  revoked.length = 0
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: () => `blob:fake-${++urlCount}`,
    revokeObjectURL: (url: string) => revoked.push(url),
  })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('editor store', () => {
  it('opens files and selects the first one', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3), pdfFile('b.pdf', 5)])

    expect(store.documents.map((d) => [d.name, d.pages.length])).toEqual([
      ['a.pdf', 3],
      ['b.pdf', 5],
    ])
    expect(store.active?.name).toBe('a.pdf')
    expect(store.loading).toBe(false)
  })

  it('rejects files that are neither PDF nor JPEG, without blocking the others', async () => {
    const store = useEditorStore()
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'img.png')
    await store.openFiles([png, pdfFile('ok.pdf', 2)])

    expect(store.error).toContain('img.png')
    expect(store.documents.map((d) => d.name)).toEqual(['ok.pdf'])
  })

  it('mirrors page edits and undo/redo from the model', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3)])

    store.rotate(2, 90)
    store.toggleDelete(3)
    store.move(1, 2)
    const doc = store.active!
    expect(doc.pages.map((p) => p.id)).toEqual([2, 3, 1])
    expect(doc.pages[0]).toMatchObject({ id: 2, pendingRotation: 90 })
    expect(doc.pages[1]).toMatchObject({ id: 3, markedForDeletion: true })
    expect(doc.hasPendingChanges).toBe(true)
    expect(doc.canUndo).toBe(true)

    store.toggleDelete(3)
    expect(doc.pages[1]?.markedForDeletion).toBe(false)

    store.undo()
    store.undo()
    store.undo()
    store.undo()
    expect(doc.pages.map((p) => p.id)).toEqual([1, 2, 3])
    expect(doc.hasPendingChanges).toBe(false)
    expect(doc.canRedo).toBe(true)

    store.redo()
    expect(doc.pages[1]?.pendingRotation).toBe(90)
  })

  it('renders requested previews and throws them away when a commit changes the baseline', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3)])
    const doc = store.active!

    store.requestPreview(doc.id, 1)
    store.requestPreview(doc.id, 2)
    await flushPreviews()
    expect(Object.keys(doc.previews)).toEqual(['1', '2'])

    // A pending edit doesn't touch the baseline: thumbnails stay.
    store.toggleDelete(2)
    expect(Object.keys(doc.previews)).toEqual(['1', '2'])

    await store.commit()
    expect(doc.pages).toHaveLength(2)
    expect(doc.previews).toEqual({})

    // Undoing the commit brings the old baseline back, whose PNGs the model
    // still has cached: they map to the very same URLs as before.
    const before = urlCount
    store.undo()
    store.requestPreview(doc.id, 1)
    await flushPreviews()
    expect(doc.previews[1]).toBe('blob:fake-1')
    expect(urlCount).toBe(before)
  })

  it('closes a document, revoking its URLs and moving the selection', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 1), pdfFile('b.pdf', 1)])
    const [a, b] = store.documents.map((d) => d.id)

    store.requestPreview(a!, 1)
    await flushPreviews()
    store.close(a!)

    expect(revoked).toEqual(['blob:fake-1'])
    expect(store.documents.map((d) => d.name)).toEqual(['b.pdf'])
    expect(store.activeId).toBe(b)

    store.close(b!)
    expect(store.active).toBeNull()
  })

  it('walks the viewer through the display order and closes it when the document goes away', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3), pdfFile('b.pdf', 2)])
    store.move(3, 0) // display order: 3, 1, 2

    store.openViewer(3)
    expect(store.viewerPageId).toBe(3)
    store.stepViewer(1)
    expect(store.viewerPageId).toBe(1)
    store.stepViewer(Infinity)
    expect(store.viewerPageId).toBe(2)
    store.stepViewer(1) // already last: stays
    expect(store.viewerPageId).toBe(2)
    store.stepViewer(-Infinity)
    expect(store.viewerPageId).toBe(3)

    store.openViewer(42) // not a page of this document
    expect(store.viewerPageId).toBe(3)

    store.select(store.documents[1]!.id)
    expect(store.viewerPageId).toBeNull()

    store.openViewer(1)
    store.close(store.activeId!)
    expect(store.viewerPageId).toBeNull()
  })

  it('selects with click modes: only, toggle and range from the last clicked page', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 6)])
    const doc = store.active!
    const selected = () => [...doc.selection].sort((a, b) => a - b)

    store.selectPage(2, 'only')
    store.selectPage(5, 'range')
    expect(selected()).toEqual([2, 3, 4, 5])
    store.selectPage(3, 'range') // the anchor stays on 2: the range shrinks
    expect(selected()).toEqual([2, 3])
    store.selectPage(6, 'toggle')
    store.selectPage(2, 'toggle')
    expect(selected()).toEqual([3, 6])

    // A range follows the display order, not the page numbers.
    store.move(6, 0) // order: 6, 1, 2, 3, 4, 5
    store.selectPage(6, 'only')
    store.selectPage(2, 'range')
    expect(selected()).toEqual([1, 2, 6])

    store.selectAll()
    expect(doc.selection.size).toBe(6)
    store.clearSelection()
    expect(doc.selection.size).toBe(0)
  })

  it('applies group actions to the selection and clears it when a commit renumbers pages', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 4)])
    const doc = store.active!

    store.selectPage(1, 'only')
    store.selectPage(3, 'toggle')
    store.rotateSelected(90)
    expect(doc.pages.map((p) => p.pendingRotation)).toEqual([90, 0, 90, 0])

    store.toggleDeleteSelected()
    expect(doc.pages.map((p) => p.markedForDeletion)).toEqual([true, false, true, false])
    store.toggleDeleteSelected() // all selected already marked: restores them
    expect(doc.pages.every((p) => !p.markedForDeletion)).toBe(true)

    store.movePages([1, 3], 2)
    expect(doc.pages.map((p) => p.id)).toEqual([2, 4, 1, 3])

    // One undo step per group action.
    store.undo()
    expect(doc.pages.map((p) => p.id)).toEqual([1, 2, 3, 4])

    await store.commit()
    expect(doc.selection.size).toBe(0)
  })

  it('extracts the selection into a new document and offers to open it', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('relazione.pdf', 5)])
    const source = store.active!
    store.selectPage(2, 'only')
    store.selectPage(4, 'range')

    await store.extractSelected()

    expect(store.documents.map((d) => [d.name, d.pages.length])).toEqual([
      ['relazione.pdf', 5],
      ['relazione (estratto).pdf', 3],
    ])
    expect(store.active).toBe(source) // stays on the source...
    expect(store.notice?.message).toBe('3 pagine in «relazione (estratto).pdf»')
    store.notice?.action?.run() // ...until "Apri"
    expect(store.active?.name).toBe('relazione (estratto).pdf')
  })

  it('merges the picked documents in pick order, as they look now, and opens the result', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3), pdfFile('b.pdf', 2), pdfFile('c.pdf', 4)])
    const [a, b, c] = store.documents.map((d) => d.id)
    store.toggleDelete(1) // a: one page marked for deletion

    store.toggleMergePick(c!)
    store.toggleMergePick(a!)
    store.toggleMergePick(b!)
    store.toggleMergePick(b!) // unpicked again
    expect(store.mergePicks).toEqual([c, a])

    await store.mergePicked()

    const merged = store.active!
    expect(merged.name).toBe('Unione di 2 documenti.pdf')
    expect(merged.pages).toHaveLength(4 + 2) // a without its deleted page
    expect(store.mergePicks).toEqual([])
    expect(store.documents).toHaveLength(4)
  })

  it('moves or copies pages to another document', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 4), pdfFile('b.pdf', 2)])
    const [, b] = store.documents
    store.selectPage(2, 'only')
    store.selectPage(3, 'range')

    await store.transferPages([2, 3], b!.id)
    expect(b!.pages).toHaveLength(4)
    expect(store.active!.pages.filter((p) => p.markedForDeletion).map((p) => p.id)).toEqual([2, 3])
    expect(store.active!.selection.size).toBe(0)
    expect(store.notice?.message).toBe('Spostate 2 pagine in «b.pdf»')

    await store.transferPages([1], b!.id, true)
    expect(b!.pages).toHaveLength(5)
    expect(store.active!.pages[0]?.markedForDeletion).toBe(false)
    expect(store.notice?.message).toBe('Copiata 1 pagina in «b.pdf»')
    store.notice?.action?.run()
    expect(store.active).toStrictEqual(b)
  })

  it('inserts file pages after the selection, or at the end', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3)])
    const doc = store.active!

    await store.insertFiles([pdfFile('due.pdf', 2)])
    expect(doc.pages.map((p) => p.id)).toEqual([1, 2, 3, 4, 5])

    store.selectPage(1, 'only')
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'foto.jpg')
    await store.insertFiles([jpeg])
    expect(doc.pages.map((p) => p.id)).toEqual([1, 6, 2, 3, 4, 5])
    expect(store.notice?.message).toBe('Inserita 1 pagina')
  })

  it('places library signatures as pending annotations, shown per page', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3)])
    const doc = store.active!
    const image = { pixels: new Uint8Array(4 * 4 * 2), width: 4, height: 2 }
    const signature = store.addSignature(image, 'blob:firma', 'Firma 1')
    expect(store.signatures).toHaveLength(1)

    const id = store.placeSignature(2, signature.id, { x: 0.1, y: 0.2, width: 0.3 })!
    store.placeSignature(2, signature.id, { x: 0.5, y: 0.6, width: 0.2 })
    expect(doc.annotations[2]).toHaveLength(2)
    expect(doc.annotations[2]![0]).toMatchObject({ x: 0.1, url: 'blob:firma', aspect: 0.5 })
    expect(doc.annotations[1]).toBeUndefined()
    expect(doc.hasPendingChanges).toBe(true)

    // Updating one page's entry leaves the record itself in place (cards
    // read their own entry from it).
    const record = doc.annotations
    store.updateAnnotation(id, { x: 0.15 })
    expect(doc.annotations).toBe(record)
    expect(doc.annotations[2]![0]!.x).toBe(0.15)

    store.removeAnnotation(id)
    expect(doc.annotations[2]).toHaveLength(1)
    store.undo()
    store.undo()
    expect(doc.annotations[2]![0]!.x).toBe(0.1)

    // Out of the library, but still on the page.
    store.removeSignature(signature.id)
    expect(store.signatures).toHaveLength(0)
    expect(doc.annotations[2]).toHaveLength(2)
  })

  it('puts a signature on all pages and unlinks one copy', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3)])
    const doc = store.active!
    const signature = store.addSignature(
      { pixels: new Uint8Array(4 * 4 * 2), width: 4, height: 2 },
      'blob:firma',
      'Firma 1',
    )
    const id = store.placeSignature(1, signature.id, { x: 0.1, y: 0.2, width: 0.3 })!
    expect(store.linkedCopies(null)).toBe(0)

    store.setOnAllPages(id, true)
    expect(Object.keys(doc.annotations)).toEqual(['1', '2', '3'])
    expect(store.linkedCopies(1)).toBe(3)

    const copy = doc.annotations[2]![0]!
    store.setOnAllPages(copy.id, false)
    expect(doc.annotations[2]![0]!.linked).toBe(false)
    expect(store.linkedCopies(1)).toBe(2)
  })

  it('renames a document, ignoring blank names', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 1)])
    const doc = store.active!
    store.rename(doc.id, '  Contratto firmato.pdf ')
    expect(doc.name).toBe('Contratto firmato.pdf')
    store.rename(doc.id, '   ')
    expect(doc.name).toBe('Contratto firmato.pdf')
  })

  it('opens tools: the merge tool starts from every open document, in order', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 1), pdfFile('b.pdf', 1), pdfFile('c.pdf', 1)])
    const [a, b, c] = store.documents.map((d) => d.id)

    store.toggleTool('merge')
    expect(store.activeTool).toBe('merge')
    expect(store.mergePicks).toEqual([a, b, c])
    store.moveMergePick(c!, 0)
    store.moveMergePick(a!, 99)
    expect(store.mergePicks).toEqual([c, b, a])

    await store.mergePicked()
    expect(store.activeTool).toBeNull() // done: the panel closes
    store.toggleTool('sign')
    store.toggleTool('sign')
    expect(store.activeTool).toBeNull()
  })

  it('places a signature from the panel on the first selected page, via the viewer', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 4)])
    const signature = store.addSignature(
      { pixels: new Uint8Array(4 * 4 * 2), width: 4, height: 2 },
      'blob:firma',
      'Firma 1',
    )
    store.placeSignatureFromPanel(signature.id)
    expect(store.viewerPageId).toBe(1)
    expect(store.takePendingSignature()).toBe(signature.id)
    expect(store.takePendingSignature()).toBeNull()

    store.closeViewer()
    store.selectPage(3, 'only')
    store.placeSignatureFromPanel(signature.id)
    expect(store.viewerPageId).toBe(3)
  })

  it('imposes the selection, or the whole document, into a new opened document', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('relazione.pdf', 10)])
    const source = store.active!
    store.activeTool = 'nup'

    await store.impose({ kind: 'nup', options: { layout: 4 } })
    expect(store.active?.name).toBe('relazione (4 per foglio).pdf')
    expect(store.active?.pages).toHaveLength(3) // 10 pages, 4 per sheet
    expect(store.activeTool).toBeNull()
    store.notice?.action?.run() // "Torna all'originale"
    expect(store.active).toStrictEqual(source)

    store.selectPage(1, 'only')
    store.selectPage(5, 'range')
    await store.impose({ kind: 'booklet', options: {} })
    expect(store.active?.name).toBe('relazione (libretto).pdf')
    expect(store.active?.pages).toHaveLength(4) // 5 pages: 2 sheets, front and back
    expect(source.pages).toHaveLength(10)
  })

  it('keeps signatures and images in one library, told apart by kind', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 2)])
    const pixels = { pixels: new Uint8Array(4 * 4 * 2), width: 4, height: 2 }
    const signature = store.addSignature(pixels, 'blob:firma', 'Firma 1')
    const logo = store.addImage(pixels, 'blob:logo', 'logo')
    expect(store.signatures.map((s) => s.name)).toEqual(['Firma 1'])
    expect(store.images.map((s) => s.name)).toEqual(['logo'])

    store.placeSignature(1, logo.id, { x: 0.1, y: 0.1, width: 0.4 })
    store.placeSignature(2, signature.id, { x: 0.5, y: 0.8, width: 0.3 })
    expect(store.active!.annotations[1]![0]).toMatchObject({ kind: 'image', url: 'blob:logo' })
    expect(store.active!.annotations[2]![0]).toMatchObject({ kind: 'signature' })

    store.removeSignature(logo.id)
    expect(store.images).toHaveLength(0)
    expect(store.signatures).toHaveLength(1)
  })
})
