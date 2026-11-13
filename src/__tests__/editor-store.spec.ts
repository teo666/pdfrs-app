import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The real package spins up Web Workers running wasm, which jsdom has no
// equivalent for. This fake keeps the parts of the PdfDocument contract the
// store relies on: pages in display order, pending rotations/deletions,
// undo/redo, and a baseline (`getBytes()`) that only a commit replaces.
/** The page options every JPEG was converted with, by addImage or image_to_pdf. */
const imageOptions: unknown[] = []

vi.mock('pdfrs-editor', () => {
  type Page = { id: number; pendingRotation: number; markedForDeletion: boolean }
  type Meta = {
    base: Record<string, string>
    pending: Record<string, string | null>
    /** Image draws waiting to be removed (lives here so undo snapshots carry it). */
    removedImages?: string[]
    /** Pages made from a photo → the page size they're on (same reason). */
    photos?: Record<number, string>
  }

  class FakeDocument {
    bytes: Uint8Array
    pageList: Page[]
    undoStack: { bytes: Uint8Array; pages: Page[]; annotations: unknown; meta: Meta }[] = []
    redoStack: { bytes: Uint8Array; pages: Page[]; annotations: unknown; meta: Meta }[] = []
    /** Properties: what the baseline holds, and the edits pending over it (null: remove). */
    meta: Meta = { base: { title: 'Relazione', author: 'Mario Rossi' }, pending: {} }
    pngs = new Map<string, Uint8Array>()
    /** Set on a password-protected document: the password, and the pages it hides. */
    lock: { password: string; pages: number } | null = null

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
        meta: structuredClone(this.meta),
      })
      this.redoStack = []
    }
    /** One image (key "5 0"), drawn on pages 1 and 2. */
    imageReport = {
      images: [
        {
          key: '5 0',
          width: 400,
          height: 300,
          format: 'jpeg',
          bytes: 2048,
          hasMask: false,
          inline: false,
        },
      ],
      placements: [1, 2].map((page) => ({
        id: `p${page}#0`,
        page,
        image: '5 0',
        corners: [
          [0.1, 0.1],
          [0.5, 0.1],
          [0.5, 0.4],
          [0.1, 0.4],
        ],
        x: 0.1,
        y: 0.1,
        width: 0.4,
        height: 0.3,
        sharedPages: [],
      })),
    }
    async getImages() {
      return structuredClone(this.imageReport)
    }
    pendingImageRemovals() {
      return new Set(this.meta.removedImages ?? [])
    }
    removeImages(ids: string[]) {
      const fresh = ids.filter((id) => !(this.meta.removedImages ?? []).includes(id))
      if (fresh.length === 0) return
      this.save()
      this.meta.removedImages = [...(this.meta.removedImages ?? []), ...fresh]
    }
    restoreImages(ids: string[]) {
      this.save()
      this.meta.removedImages = (this.meta.removedImages ?? []).filter((id) => !ids.includes(id))
    }
    async extractImage() {
      return { mime: 'image/jpeg', width: 400, height: 300, bytes: new Uint8Array([0xff, 0xd8]) }
    }
    async getMetadata() {
      const merged: Record<string, string> = { ...this.meta.base }
      for (const [key, value] of Object.entries(this.meta.pending)) {
        if (value === null) delete merged[key]
        else merged[key] = value
      }
      return merged
    }
    pendingMetadataFields() {
      return new Set(Object.keys(this.meta.pending))
    }
    async setMetadata(patch: Record<string, string | null>) {
      const current = await this.getMetadata()
      const changed = Object.entries(patch).filter(
        ([key, value]) => (current[key] ?? null) !== value,
      )
      if (changed.length === 0) return
      this.save()
      for (const [key, value] of changed) {
        if ((this.meta.base[key] ?? null) === value) delete this.meta.pending[key]
        else this.meta.pending[key] = value
      }
    }
    private page(id: number) {
      const page = this.pageList.find((p) => p.id === id)
      if (!page) throw new Error(`pagina ${id} inesistente`)
      return page
    }
    pages() {
      return structuredClone(this.pageList)
    }
    isLocked() {
      return this.lock !== null
    }
    getBytes() {
      return this.bytes
    }
    hasPendingChanges() {
      return (
        this.annotationList.length > 0 ||
        Object.keys(this.meta.pending).length > 0 ||
        (this.meta.removedImages ?? []).length > 0 ||
        this.pageList.some(
          (p, i) => p.pendingRotation !== 0 || p.markedForDeletion || p.id !== i + 1,
        )
      )
    }
    canUndo() {
      return this.undoStack.length > 0
    }
    history() {
      const total = this.undoStack.length + 1 + this.redoStack.length
      return Array.from({ length: total }, (_, index) => ({
        index,
        label: index === 0 ? 'Documento aperto' : `Passo ${index}`,
        current: index === this.undoStack.length,
      }))
    }
    goToHistoryIndex(index: number) {
      while (this.undoStack.length > index && this.undo()) {}
      while (this.undoStack.length < index && this.redo()) {}
      return true
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
    addTextAnnotation(a: { page: number; text: object; x: number; y: number; width: number }) {
      this.save()
      const id = this.nextAnnotation++
      this.annotationList = [
        ...this.annotationList,
        { ...a, asset: 0, id, group: null, linked: false } as (typeof this.annotationList)[number],
      ]
      return id
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
    photoPages() {
      return new Map(
        Object.entries(this.meta.photos ?? {}).map(([page, pageSize]) => [
          Number(page),
          { pageSize },
        ]),
      )
    }
    async insertImage(_jpeg: Uint8Array, options: { pageSize: string }, at?: number) {
      imageOptions.push(options)
      const [page] = await this.insertPages(new Uint8Array([1]), at)
      this.meta.photos = { ...this.meta.photos, [page!]: options.pageSize }
      return page!
    }
    async setPhotoPage(page: number, options: { pageSize: string }) {
      if (this.meta.photos?.[page] === options.pageSize) return page
      this.save()
      const replacement = Math.max(0, ...this.pageList.map((p) => p.id)) + 1
      this.pageList = this.pageList.map((p) => (p.id === page ? { ...p, id: replacement } : p))
      const { [page]: _old, ...others } = this.meta.photos ?? {}
      this.meta.photos = { ...others, [replacement]: options.pageSize }
      return replacement
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
        meta: this.meta,
      })
      ;({ bytes: this.bytes, pages: this.pageList, meta: this.meta } = prev)
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
        meta: this.meta,
      })
      ;({ bytes: this.bytes, pages: this.pageList, meta: this.meta } = next)
      this.annotationList = next.annotations as typeof this.annotationList
      return true
    }
    async commit() {
      this.save()
      const kept = this.pageList.filter((p) => !p.markedForDeletion)
      this.bytes = new Uint8Array([kept.length])
      this.meta = { base: await this.getMetadata(), pending: {} }
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
      // Byte 11 set: protected with the password "segreta" (see lockedPdfFile()).
      const locked = bytes[11] === 1
      const doc = new FakeDocument(bytes, locked ? 0 : (bytes[10] ?? 3))
      if (locked) doc.lock = { password: 'segreta', pages: bytes[10] ?? 3 }
      this.docs.set(id, doc)
      return id
    }
    async protectDocument(id: number, password: string) {
      const source = this.getDocument(id)
      const pages = source.pageList.filter((p) => !p.markedForDeletion).length
      const newId = this.nextId++
      const doc = new FakeDocument(new Uint8Array([200]), 0)
      doc.lock = { password, pages }
      this.docs.set(newId, doc)
      return newId
    }
    async unlockDocument(id: number, password: string) {
      const lock = this.getDocument(id).lock
      if (!lock || lock.password !== password) throw new WrongPasswordError()
      const newId = this.nextId++
      this.docs.set(newId, new FakeDocument(new Uint8Array([201]), lock.pages))
      return newId
    }
    async addImage(_bytes: Uint8Array, options?: { pageSize: string }) {
      imageOptions.push(options)
      const id = this.nextId++
      const doc = new FakeDocument(new Uint8Array([1]), 1)
      doc.meta.photos = { 1: options?.pageSize ?? 'native' }
      this.docs.set(id, doc)
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
      const merged = new FakeDocument(new Uint8Array([total]), total)
      // Like the real model: the sources' rendered pages carry over, the
      // very same PNG buffers.
      let position = 1
      ids.forEach((id, index) => {
        const source = this.getDocument(id)
        for (const page of shown[index]!) {
          const png = source.pngs.get(`${source.bytes[0]}:${page.id}`)
          if (png) merged.pngs.set(`${total}:${position}`, png)
          position += 1
        }
      })
      this.docs.set(newId, merged)
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

  // The text layout, simplified: half an em per character, 1.2 em per line.
  const layoutText = (text: string) => {
    const lines = text.split('\n')
    return {
      lines,
      lineWidths: lines.map((line: string) => line.length * 0.5),
      width: Math.max(...lines.map((line: string) => line.length * 0.5)) + 0.2,
      height: lines.length * 1.2,
    }
  }

  class WrongPasswordError extends Error {}

  return { PdfEditor, WrongPasswordError, layoutText }
})

vi.mock('pdfrs-editor/operations', () => ({
  // A JPEG becomes a one-page PDF.
  image_to_pdf: async (_bytes: Uint8Array, options?: unknown) => {
    imageOptions.push(options)
    return new Uint8Array([1])
  },
  is_password_protected: async (bytes: Uint8Array) => bytes[11] === 1,
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

import { useEditorStore, type DocumentState } from '@/stores/editor'

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

/** Like pdfFile(), protected with the password "segreta". */
function lockedPdfFile(name: string, pages: number) {
  const bytes = new Uint8Array(16)
  bytes.set(new TextEncoder().encode('%PDF-1.7\n'))
  bytes[10] = pages
  bytes[11] = 1
  return new File([bytes], name, { type: 'application/pdf' })
}

let urlCount = 0
const idleCallbacks: (() => void)[] = []

/** Gives the background renderer `times` idle moments, letting each chunk finish. */
async function runIdle(times = 1) {
  for (let i = 0; i < times && idleCallbacks.length; i++) {
    idleCallbacks.splice(0).forEach((cb) => cb())
    await flushPreviews()
  }
}
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
  // Background rendering stays off unless a test runs the idle callbacks.
  idleCallbacks.length = 0
  vi.stubGlobal('requestIdleCallback', (cb: () => void) => idleCallbacks.push(cb))
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
    expect(store.takePendingPlacement()).toEqual({ kind: 'library', id: signature.id })
    expect(store.takePendingPlacement()).toBeNull()

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

  it('splits into parts by grid position, leaving out pages marked for deletion', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('atti.pdf', 6)])
    const source = store.active!
    store.toggleDelete(2)

    await store.split([
      { start: 1, end: 3 },
      { start: 4, end: 6 },
      { start: 2, end: 2 }, // only a deleted page: no part
    ])

    expect(store.documents.map((d) => [d.name, d.pages.length])).toEqual([
      ['atti.pdf', 6],
      ['atti (parte 1 di 2).pdf', 2],
      ['atti (parte 2 di 2).pdf', 3],
    ])
    expect(store.active?.name).toBe('atti (parte 1 di 2).pdf')
    store.notice?.action?.run()
    expect(store.active).toStrictEqual(source)
  })

  it('places text as a text annotation, with its proportions from the layout', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 2)])
    const content = {
      text: 'Ciao\nmondo',
      font: 'helvetica' as const,
      bold: false,
      italic: false,
      color: '#1c2026',
      align: 'left' as const,
    }
    store.selectPage(2, 'only')
    store.placeTextFromPanel(content, 14)
    expect(store.viewerPageId).toBe(2)
    expect(store.takePendingPlacement()).toEqual({ kind: 'text', content, sizePt: 14 })

    store.placeText(2, content, { x: 0.1, y: 0.1, width: 0.3 })
    const view = store.active!.annotations[2]![0]!
    expect(view.kind).toBe('text')
    expect(view.url).toBe('')
    // Two lines of 5 and 5 characters: 2.7 em wide, 2.4 em tall.
    expect(view.aspect).toBeCloseTo(2.4 / 2.7)
  })

  it('renders every page behind the scenes, the active document first, and again at a new size', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 20), pdfFile('b.pdf', 3)])
    const [a, b] = store.documents.map((d) => d.id) as [number, number]
    store.select(b)
    expect(store.renderProgress(a)).toEqual({ done: 0, total: 20 })

    // A chunk at a time, the active document's first.
    await runIdle()
    expect(store.renderProgress(b)).toEqual({ done: 3, total: 3 })
    expect(store.renderProgress(a).done).toBe(0)
    await runIdle()
    expect(store.renderProgress(a).done).toBe(8)
    await runIdle(10)
    expect(store.renderProgress(a)).toEqual({ done: 20, total: 20 })
    expect(idleCallbacks).toHaveLength(0)

    // A size in another resolution tier: everything is rendered again.
    store.thumbSize = 320
    await nextTick()
    expect(store.renderProgress(a).done).toBe(0)
    expect(store.renderProgress(b).done).toBe(0)
    await runIdle(10)
    expect(store.renderProgress(a).done).toBe(20)
    expect(store.renderProgress(b).done).toBe(3)
  })

  it('lets the cards on screen go before the background chunks', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 20)])
    const doc = store.active!

    store.requestPreview(doc.id, 15)
    // The card's request is waiting for its frame: the background pass steps aside.
    idleCallbacks.splice(0).forEach((cb) => cb())
    expect(store.renderProgress(doc.id).done).toBe(0)
    await flushPreviews()
    expect(Object.keys(doc.previews)).toEqual(['15'])

    // Then picks up the rest, skipping what's already there.
    await runIdle(10)
    expect(store.renderProgress(doc.id)).toEqual({ done: 20, total: 20 })
  })

  it("closing a merge's source keeps the thumbnails the merged document shares with it", async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 2), pdfFile('b.pdf', 2)])
    const [a, b] = store.documents.map((d) => d.id) as [number, number]
    for (const id of [a, b]) {
      store.requestPreview(id, 1)
      store.requestPreview(id, 2)
    }
    await flushPreviews()
    const fromA = Object.values(store.documents[0]!.previews)

    store.toggleMergePick(a)
    store.toggleMergePick(b)
    await store.mergePicked()
    const merged = store.active!
    for (const page of [1, 2, 3, 4]) store.requestPreview(merged.id, page)
    await flushPreviews()
    expect(Object.values(merged.previews).slice(0, 2)).toEqual(fromA)

    store.close(a)
    expect(revoked).toEqual([])
    // Gone for good once no open document shows them.
    store.close(merged.id)
    expect(revoked.sort()).toEqual([...fromA].sort())
  })

  it('protects a copy of a document, listed locked beside the original', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('contratto.pdf', 4)])
    const original = store.active!
    store.toggleDelete(2)

    await store.protect('segreta')

    const copy = store.active!
    expect(copy.name).toBe('contratto (protetto).pdf')
    expect(copy.locked).toBe(true)
    expect(copy.pages).toEqual([])
    expect(store.documents.map((d) => d.name)).toEqual([
      'contratto.pdf',
      'contratto (protetto).pdf',
    ])
    expect(original.locked).toBe(false)
    expect(original.hasPendingChanges).toBe(true)
    expect(store.notice?.message).toContain('protetto da password')

    // Unlocking it gives back the document as it was protected.
    expect(await store.unlock('sbagliata')).toBe(false)
    expect(store.documents).toHaveLength(2)
    expect(await store.unlock('segreta')).toBe(true)
    expect(store.active?.name).toBe('contratto (sbloccato).pdf')
    expect(store.active?.locked).toBe(false)
    expect(store.active?.pages).toHaveLength(3)
  })

  it('opens a protected PDF locked, and keeps pages and merges away from it', async () => {
    const store = useEditorStore()
    await store.openFiles([lockedPdfFile('segreto.pdf', 5), pdfFile('a.pdf', 3)])
    const [locked, a] = store.documents as [DocumentState, DocumentState]
    expect(locked.locked).toBe(true)
    expect(store.renderProgress(locked.id)).toEqual({ done: 0, total: 0 })

    // Not offered for a merge, and pages can't be moved into it.
    store.toggleTool('merge')
    expect(store.mergePicks).toEqual([a.id])
    store.toggleMergePick(locked.id)
    expect(store.mergePicks).toEqual([a.id])
    store.toggleTool('merge')
    store.select(a.id)
    await store.transferPages([1], locked.id)
    expect(a.pages.some((p) => p.markedForDeletion)).toBe(false)

    // Nor can a protected file's pages be inserted.
    await store.insertFiles([lockedPdfFile('altro.pdf', 2)])
    expect(store.error).toContain('protetto da password')
    expect(a.pages).toHaveLength(3)

    store.select(locked.id)
    expect(await store.unlock('segreta')).toBe(true)
    expect(store.active?.name).toBe('segreto (sbloccato).pdf')
    expect(store.active?.pages).toHaveLength(5)
  })

  it('edits the properties as pending changes: undoable, applied with the rest', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('relazione.pdf', 2)])
    const doc = store.active!
    // Not read until asked for.
    expect(doc.metadata).toBeNull()
    await store.loadMetadata(doc.id)
    expect(doc.metadata).toEqual({ title: 'Relazione', author: 'Mario Rossi' })

    await store.setMetadata({ title: 'Relazione finale', author: null })
    expect(doc.metadata).toEqual({ title: 'Relazione finale' })
    expect(doc.pendingMetadata.sort()).toEqual(['author', 'title'])
    expect(doc.hasPendingChanges).toBe(true)

    // The same value again is no edit at all.
    await store.setMetadata({ title: 'Relazione finale' })
    store.undo()
    await flushPreviews()
    expect(doc.metadata).toEqual({ title: 'Relazione', author: 'Mario Rossi' })
    expect(doc.pendingMetadata).toEqual([])
    expect(doc.hasPendingChanges).toBe(false)

    store.redo()
    await store.commit()
    await flushPreviews()
    expect(doc.metadata).toEqual({ title: 'Relazione finale' })
    expect(doc.pendingMetadata).toEqual([])
  })

  it('lists the images in the document and removes them as pending changes', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('foto.pdf', 3)])
    const doc = store.active!
    // Not looked for until asked.
    expect(doc.images).toBeNull()
    await store.loadImages(doc.id)
    expect(doc.images).toHaveLength(1)
    const [image] = doc.images!
    expect(image).toMatchObject({
      key: '5 0',
      pages: [1, 2],
      placements: ['p1#0', 'p2#0'],
      removed: false,
    })
    expect(doc.imagePlacements[1]).toHaveLength(1)
    expect(doc.imagePlacements[3]).toBeUndefined()

    // From one page only: the image itself is still there, on page 2.
    store.removeImages(['p1#0'])
    await flushPreviews()
    expect(doc.imagePlacements[1]![0]!.removed).toBe(true)
    expect(doc.imagePlacements[2]![0]!.removed).toBe(false)
    expect(doc.images![0]!.removed).toBe(false)
    expect(doc.hasPendingChanges).toBe(true)

    store.undo()
    await flushPreviews()
    expect(doc.imagePlacements[1]![0]!.removed).toBe(false)
    expect(doc.hasPendingChanges).toBe(false)

    // From every page, then put back.
    store.removeImages(image!.placements)
    await flushPreviews()
    expect(doc.images![0]!.removed).toBe(true)
    store.restoreImages(image!.placements)
    await flushPreviews()
    expect(doc.images![0]!.removed).toBe(false)

    // Opened from the list: the viewer on its first page, the image to select.
    store.focusImage('5 0')
    expect(store.viewerPageId).toBe(1)
    expect(store.focusedImage).toBe('5 0')
  })

  it('mirrors the history and goes to any step of it in one go', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 3)])
    const doc = store.active!
    expect(doc.history).toEqual([{ index: 0, label: 'Documento aperto', current: true }])

    store.rotate(1, 90)
    store.toggleDelete(2)
    store.move(3, 0)
    expect(doc.history.map((step) => step.current)).toEqual([false, false, false, true])

    // Back to just after the rotation: the deletion and the move are undone, still redoable.
    store.goToHistory(1)
    expect(doc.history.find((step) => step.current)?.index).toBe(1)
    expect(doc.pages.map((p) => [p.id, p.pendingRotation, p.markedForDeletion])).toEqual([
      [1, 90, false],
      [2, 0, false],
      [3, 0, false],
    ])
    expect(doc.canRedo).toBe(true)

    // And forward again, all the way.
    store.goToHistory(3)
    expect(doc.pages.map((p) => p.id)).toEqual([3, 1, 2])
    expect(doc.canRedo).toBe(false)
  })

  it('puts photos on the remembered page: A4 with a margin by default, or their own size', async () => {
    localStorage.removeItem('pdfrs.imagePage')
    imageOptions.length = 0
    const store = useEditorStore()
    const jpeg = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'foto.jpg')
    expect(store.imagePage).toBe('a4')

    await store.openFiles([jpeg()])
    expect(imageOptions[imageOptions.length - 1]).toEqual({
      pageSize: 'a4',
      orientation: 'auto',
      margin: 28.35,
    })

    store.imagePage = 'native'
    await nextTick()
    await store.insertFiles([jpeg()])
    expect(imageOptions[imageOptions.length - 1]).toEqual({ pageSize: 'native' })
    // Remembered for the next visit.
    expect(localStorage.getItem('pdfrs.imagePage')).toBe('native')
    setActivePinia(createPinia())
    expect(useEditorStore().imagePage).toBe('native')
    localStorage.removeItem('pdfrs.imagePage')
  })

  it('puts a photo page on another page, and the viewer and the selection follow it', async () => {
    const store = useEditorStore()
    await store.openFiles([pdfFile('a.pdf', 2)])
    const doc = store.active!
    await store.insertFiles([new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'foto.jpg')])
    const photo = doc.pages[doc.pages.length - 1]!.id
    expect(doc.photoPages).toEqual({ [photo]: 'a4' })

    store.selectPage(photo, 'only')
    store.openViewer(photo)
    await store.setPhotoPage(photo, 'letter')

    const replacement = doc.pages[doc.pages.length - 1]!.id
    expect(replacement).not.toBe(photo)
    expect(doc.photoPages).toEqual({ [replacement]: 'letter' })
    expect(store.viewerPageId).toBe(replacement)
    expect([...doc.selection]).toEqual([replacement])

    store.undo()
    expect(doc.photoPages).toEqual({ [photo]: 'a4' })
  })
})
