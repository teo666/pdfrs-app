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
    undoStack: { bytes: Uint8Array; pages: Page[] }[] = []
    redoStack: { bytes: Uint8Array; pages: Page[] }[] = []
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
      this.undoStack.push({ bytes: this.bytes, pages: structuredClone(this.pageList) })
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
      return this.pageList.some(
        (p, i) => p.pendingRotation !== 0 || p.markedForDeletion || p.id !== i + 1,
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
    undo() {
      const prev = this.undoStack.pop()
      if (!prev) return false
      this.redoStack.push({ bytes: this.bytes, pages: this.pageList })
      ;({ bytes: this.bytes, pages: this.pageList } = prev)
      return true
    }
    redo() {
      const next = this.redoStack.pop()
      if (!next) return false
      this.undoStack.push({ bytes: this.bytes, pages: this.pageList })
      ;({ bytes: this.bytes, pages: this.pageList } = next)
      return true
    }
    async commit() {
      this.save()
      const kept = this.pageList.filter((p) => !p.markedForDeletion)
      this.bytes = new Uint8Array([kept.length])
      this.pageList = kept.map((_, i) => ({ id: i + 1, pendingRotation: 0, markedForDeletion: false }))
    }
    async exportBytes() {
      return this.bytes
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
    removeDocument(id: number) {
      this.docs.delete(id)
    }
  }

  return { PdfEditor }
})

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
})
