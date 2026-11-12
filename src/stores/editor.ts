import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import {
  PdfEditor,
  type DocumentId,
  type PageId,
  type PageInfo,
  type PdfDocument,
} from 'pdfrs-editor'

import { detectKind, downloadBytes, pdfFileName, readFile } from '@/lib/files'

/** Thumbnail render scale: ~240px wide for an A4 page, sharp enough on a 2x screen at card size. */
export const PREVIEW_SCALE = 0.4

export type ViewerZoom = 'actual' | 'fit'

/** Visible pages further apart than this get separate render batches instead of one range covering everything in between. */
const MAX_BATCH_GAP = 4

/**
 * What the UI shows of one open document. A plain reactive mirror of the
 * `PdfDocument`, which itself isn't reactive: every action that changes the
 * model calls `sync()` afterwards to copy the new state over.
 */
export interface DocumentState {
  id: DocumentId
  name: string
  /** In display order, including pages marked for deletion. */
  pages: PageInfo[]
  canUndo: boolean
  canRedo: boolean
  hasPendingChanges: boolean
  /** Object URLs of the rendered thumbnails for the current baseline, by page id. */
  previews: Record<PageId, string>
  /** A commit/export is running: page actions are disabled meanwhile. */
  busy: boolean
  /**
   * Selected pages. A reactive Set: a card asking `has(its id)` only
   * re-renders when its own entry changes, not on every selection change.
   */
  selection: Set<PageId>
}

/** How a click extends the selection: only this page, toggle it, or everything from the last clicked page to it. */
export type SelectMode = 'only' | 'toggle' | 'range'

export interface Notice {
  message: string
  action?: { label: string; run: () => void }
}

/** How long an informational notice stays up. */
const NOTICE_MS = 6000

/** Bookkeeping that the UI never reads, kept out of the reactive state. */
interface DocumentInternals {
  doc: PdfDocument
  /**
   * The baseline the `previews` were rendered from. Previews only depend on
   * it (pending rotations/deletions are shown with CSS), so they're thrown
   * away exactly when it changes: commit, or undo/redo across a commit.
   */
  baseline: Uint8Array
  /** Every object URL created for this document, revoked when it's closed. */
  urls: Set<string>
  requested: Set<PageId>
  inFlight: Set<PageId>
  flushScheduled: boolean
  /** Where a shift-click range starts: the last page clicked. */
  anchor: PageId | null
}

export const useEditorStore = defineStore('editor', () => {
  const editor = new PdfEditor()
  const internals = new Map<DocumentId, DocumentInternals>()
  // The same cached PNG buffer comes back from the model every time its page
  // is asked for again (e.g. after undoing a commit), so it maps to one URL.
  const urlByPng = new WeakMap<Uint8Array, string>()

  const documents = ref<DocumentState[]>([])
  const activeId = ref<DocumentId | null>(null)
  const loading = ref(0)
  const error = ref<string | null>(null)
  const notice = ref<Notice | null>(null)
  let noticeTimer: ReturnType<typeof setTimeout> | undefined

  const active = computed(() => documents.value.find((d) => d.id === activeId.value) ?? null)

  /** The page open in the full-size viewer, always one of the active document's. */
  const viewerPageId = ref<PageId | null>(null)
  /** "actual" is 100% (one PDF point per CSS pixel); "fit" scales the page to the window. Kept across openings. */
  const viewerZoom = ref<ViewerZoom>('actual')

  /** One object URL per PNG buffer, remembered so the document can revoke it when closed. */
  function urlFor(inner: DocumentInternals, png: Uint8Array): string {
    let url = urlByPng.get(png)
    if (!url) {
      url = URL.createObjectURL(new Blob([png as Uint8Array<ArrayBuffer>], { type: 'image/png' }))
      urlByPng.set(png, url)
    }
    inner.urls.add(url)
    return url
  }

  function stateOf(id: DocumentId): DocumentState | undefined {
    return documents.value.find((d) => d.id === id)
  }

  function report(err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  }

  function notify(message: string, action?: Notice['action']) {
    notice.value = { message, action }
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => (notice.value = null), NOTICE_MS)
  }

  function dismissNotice() {
    clearTimeout(noticeTimer)
    notice.value = null
  }

  function sync(id: DocumentId) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner) return
    const { doc } = inner
    // Pages that didn't change keep their previous object: the cards compare
    // props by identity, so a single move or rotation re-renders only the
    // cards it actually affects, not all of them.
    const previous = new Map(toRaw(state.pages).map((page) => [page.id, page]))
    state.pages = doc.pages().map((page) => {
      const old = previous.get(page.id)
      return old &&
        old.pendingRotation === page.pendingRotation &&
        old.markedForDeletion === page.markedForDeletion
        ? old
        : page
    })
    state.canUndo = doc.canUndo()
    state.canRedo = doc.canRedo()
    state.hasPendingChanges = doc.hasPendingChanges()
    if (doc.getBytes() !== inner.baseline) {
      inner.baseline = doc.getBytes()
      inner.requested.clear()
      inner.inFlight.clear()
      state.previews = {}
      // Page ids are renumbered by a commit: the old selection means nothing.
      state.selection.clear()
      inner.anchor = null
    }
  }

  /** Starts tracking a document the editor just created. */
  function register(id: DocumentId, name: string) {
    const doc = editor.getDocument(id)
    internals.set(id, {
      doc,
      baseline: doc.getBytes(),
      urls: new Set(),
      requested: new Set(),
      inFlight: new Set(),
      flushScheduled: false,
      anchor: null,
    })
    documents.value.push({
      id,
      name,
      pages: [],
      canUndo: false,
      canRedo: false,
      hasPendingChanges: false,
      previews: {},
      busy: false,
      selection: new Set(),
    })
    sync(id)
  }

  async function openFiles(files: File[]) {
    loading.value += files.length
    for (const file of files) {
      try {
        const bytes = await readFile(file)
        const kind = detectKind(bytes)
        if (!kind) throw new Error(`${file.name}: non è un PDF né un'immagine JPEG`)
        const id = kind === 'pdf' ? await editor.addDocument(bytes) : await editor.addImage(bytes)
        register(id, file.name)
        activeId.value ??= id
      } catch (err) {
        report(err)
      } finally {
        loading.value -= 1
      }
    }
  }

  function select(id: DocumentId) {
    if (!stateOf(id) || id === activeId.value) return
    activeId.value = id
    viewerPageId.value = null
  }

  function close(id: DocumentId) {
    const index = documents.value.findIndex((d) => d.id === id)
    if (index === -1) return
    internals.get(id)?.urls.forEach((url) => URL.revokeObjectURL(url))
    internals.delete(id)
    editor.removeDocument(id)
    documents.value.splice(index, 1)
    if (activeId.value === id) {
      viewerPageId.value = null
      const next = documents.value[Math.min(index, documents.value.length - 1)]
      activeId.value = next?.id ?? null
    }
  }

  /** Runs a synchronous model edit on the active document, then mirrors the result. */
  function edit(fn: (doc: PdfDocument) => void) {
    const id = activeId.value
    const inner = id === null ? undefined : internals.get(id)
    if (id === null || !inner || stateOf(id)?.busy) return
    try {
      fn(inner.doc)
    } catch (err) {
      report(err)
    }
    sync(id)
  }

  const rotate = (page: PageId, degrees: number) => edit((doc) => doc.rotatePage(page, degrees))
  const move = (page: PageId, toIndex: number) => edit((doc) => doc.movePage(page, toIndex))
  /** Moves pages as one block; `toIndex` counts the other pages only (see `PdfDocument.movePages`). */
  const movePages = (pages: PageId[], toIndex: number) =>
    edit((doc) => doc.movePages(pages, toIndex))
  const undo = () => edit((doc) => doc.undo())
  const redo = () => edit((doc) => doc.redo())

  function toggleDelete(page: PageId) {
    edit((doc) => {
      const info = doc.pages().find((p) => p.id === page)
      if (info?.markedForDeletion) doc.restorePage(page)
      else doc.deletePage(page)
    })
  }

  /** Runs an async whole-document operation on the active document, with the busy flag set meanwhile. */
  async function runBusy(fn: (doc: PdfDocument, state: DocumentState) => Promise<void>) {
    const state = active.value
    const inner = state ? internals.get(state.id) : undefined
    if (!state || !inner || state.busy) return
    state.busy = true
    try {
      await fn(inner.doc, state)
    } catch (err) {
      report(err)
    } finally {
      state.busy = false
      sync(state.id)
    }
  }

  const commit = () => runBusy((doc) => doc.commit())

  // --- Selection ----------------------------------------------------------

  /** The selected pages of the active document, in display order. */
  function selectedPages(): PageId[] {
    const state = active.value
    if (!state) return []
    return state.pages.filter((p) => state.selection.has(p.id)).map((p) => p.id)
  }

  function selectPage(page: PageId, mode: SelectMode) {
    const state = active.value
    const inner = state ? internals.get(state.id) : undefined
    if (!state || !inner) return
    const { selection } = state
    if (mode === 'range' && inner.anchor !== null) {
      const ids = state.pages.map((p) => p.id)
      const from = ids.indexOf(inner.anchor)
      const to = ids.indexOf(page)
      if (from !== -1 && to !== -1) {
        selection.clear()
        for (const id of ids.slice(Math.min(from, to), Math.max(from, to) + 1)) selection.add(id)
        return // the anchor stays put, so the range can be adjusted
      }
    }
    if (mode === 'toggle') {
      if (selection.has(page)) selection.delete(page)
      else selection.add(page)
    } else {
      selection.clear()
      selection.add(page)
    }
    inner.anchor = page
  }

  function selectAll() {
    const state = active.value
    if (!state) return
    for (const page of state.pages) state.selection.add(page.id)
  }

  function clearSelection() {
    const state = active.value
    if (!state) return
    state.selection.clear()
    const inner = internals.get(state.id)
    if (inner) inner.anchor = null
  }

  const rotateSelected = (degrees: number) =>
    edit((doc) => doc.rotatePages(selectedPages(), degrees))

  /** Marks the selected pages for deletion, or restores them if they all are already. */
  function toggleDeleteSelected() {
    const pages = selectedPages()
    const allMarked = active.value?.pages
      .filter((p) => pages.includes(p.id))
      .every((p) => p.markedForDeletion)
    edit((doc) => (allMarked ? doc.restorePages(pages) : doc.deletePages(pages)))
  }

  /** Copies the selected pages, as they look now, into a new document. */
  const extractSelected = () =>
    runBusy(async (_doc, state) => {
      const pages = selectedPages()
      if (pages.length === 0) return
      const id = await editor.extractPages(state.id, pages)
      const name = `${state.name.replace(/\.(pdf|jpe?g)$/i, '')} (estratto).pdf`
      register(id, name)
      const count = pages.length === 1 ? '1 pagina' : `${pages.length} pagine`
      notify(`${count} in «${name}»`, { label: 'Apri', run: () => select(id) })
    })

  const download = () =>
    runBusy(async (doc, state) => {
      downloadBytes(await doc.exportBytes(), pdfFileName(state.name))
    })

  /**
   * Asks for a page's thumbnail. Called by each card as it scrolls into
   * view; requests are collected for a frame and rendered in batches, so a
   * screenful of cards becomes a few `getPreviews` range calls (which spread
   * the work over the worker pool) instead of one call per card.
   */
  function requestPreview(id: DocumentId, page: PageId) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner || state.previews[page] || inner.inFlight.has(page)) return
    inner.requested.add(page)
    if (inner.flushScheduled) return
    inner.flushScheduled = true
    requestAnimationFrame(() => {
      inner.flushScheduled = false
      void flushPreviews(id)
    })
  }

  async function flushPreviews(id: DocumentId) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner || inner.requested.size === 0) return

    const order = inner.doc.pages().map((p) => p.id)
    const positions = [...inner.requested]
      .map((page) => order.indexOf(page) + 1)
      .filter((position) => position > 0)
      .sort((a, b) => a - b)
    inner.requested.clear()

    const batches: { start: number; end: number }[] = []
    for (const position of positions) {
      const last = batches[batches.length - 1]
      if (last && position - last.end <= MAX_BATCH_GAP) last.end = position
      else batches.push({ start: position, end: position })
    }

    const baseline = inner.baseline
    await Promise.all(
      batches.map(async (range) => {
        const pages = order.slice(range.start - 1, range.end)
        pages.forEach((page) => inner.inFlight.add(page))
        try {
          await inner.doc.getPreviews(PREVIEW_SCALE, {
            range,
            onPreview: (preview) => {
              // A commit or undo may have replaced the baseline while this
              // batch was rendering: its pictures would be of the old pages.
              if (inner.baseline !== baseline || !internals.has(id)) return
              state.previews[preview.id] = urlFor(inner, preview.png)
            },
          })
        } catch (err) {
          if (inner.baseline === baseline) report(err)
        } finally {
          if (inner.baseline === baseline) pages.forEach((page) => inner.inFlight.delete(page))
        }
      }),
    )
  }

  function openViewer(page: PageId) {
    if (active.value?.pages.some((p) => p.id === page)) viewerPageId.value = page
  }

  function closeViewer() {
    viewerPageId.value = null
  }

  /** Moves the viewer by `delta` pages in the current display order; stays put at either end. */
  function stepViewer(delta: number) {
    const pages = active.value?.pages
    if (!pages || viewerPageId.value === null) return
    const index = pages.findIndex((p) => p.id === viewerPageId.value)
    const next = pages[Math.max(0, Math.min(pages.length - 1, index + delta))]
    if (next) viewerPageId.value = next.id
  }

  /**
   * Renders one page of the active document at `scale` and returns an
   * object URL for it. The model caches renders by (page, scale), so going
   * back to a page already seen in the viewer is instant.
   */
  async function renderPage(page: PageId, scale: number): Promise<string> {
    const state = active.value
    const inner = state ? internals.get(state.id) : undefined
    if (!inner) throw new Error('nessun documento attivo')
    const preview = await inner.doc.getPreview(page, scale)
    return urlFor(inner, preview.png)
  }

  function dismissError() {
    error.value = null
  }

  return {
    documents,
    activeId,
    active,
    loading: computed(() => loading.value > 0),
    error,
    notice,
    dismissNotice,
    openFiles,
    select,
    close,
    rotate,
    move,
    movePages,
    toggleDelete,
    selectPage,
    selectAll,
    clearSelection,
    rotateSelected,
    toggleDeleteSelected,
    extractSelected,
    undo,
    redo,
    commit,
    download,
    requestPreview,
    viewerPageId,
    viewerZoom,
    openViewer,
    closeViewer,
    stepViewer,
    renderPage,
    dismissError,
  }
})
