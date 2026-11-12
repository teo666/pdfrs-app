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
}

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

  const active = computed(() => documents.value.find((d) => d.id === activeId.value) ?? null)

  function stateOf(id: DocumentId): DocumentState | undefined {
    return documents.value.find((d) => d.id === id)
  }

  function report(err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
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
    }
  }

  async function openFiles(files: File[]) {
    loading.value += files.length
    for (const file of files) {
      try {
        const bytes = await readFile(file)
        const kind = detectKind(bytes)
        if (!kind) throw new Error(`${file.name}: non è un PDF né un'immagine JPEG`)
        const id = kind === 'pdf' ? await editor.addDocument(bytes) : await editor.addImage(bytes)
        const doc = editor.getDocument(id)
        internals.set(id, {
          doc,
          baseline: doc.getBytes(),
          urls: new Set(),
          requested: new Set(),
          inFlight: new Set(),
          flushScheduled: false,
        })
        documents.value.push({
          id,
          name: file.name,
          pages: [],
          canUndo: false,
          canRedo: false,
          hasPendingChanges: false,
          previews: {},
          busy: false,
        })
        sync(id)
        activeId.value ??= id
      } catch (err) {
        report(err)
      } finally {
        loading.value -= 1
      }
    }
  }

  function select(id: DocumentId) {
    if (stateOf(id)) activeId.value = id
  }

  function close(id: DocumentId) {
    const index = documents.value.findIndex((d) => d.id === id)
    if (index === -1) return
    internals.get(id)?.urls.forEach((url) => URL.revokeObjectURL(url))
    internals.delete(id)
    editor.removeDocument(id)
    documents.value.splice(index, 1)
    if (activeId.value === id) {
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
              let url = urlByPng.get(preview.png)
              if (!url) {
                url = URL.createObjectURL(
                  new Blob([preview.png as Uint8Array<ArrayBuffer>], { type: 'image/png' }),
                )
                urlByPng.set(preview.png, url)
              }
              inner.urls.add(url)
              state.previews[preview.id] = url
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

  function dismissError() {
    error.value = null
  }

  return {
    documents,
    activeId,
    active,
    loading: computed(() => loading.value > 0),
    error,
    openFiles,
    select,
    close,
    rotate,
    move,
    toggleDelete,
    undo,
    redo,
    commit,
    download,
    requestPreview,
    dismissError,
  }
})
