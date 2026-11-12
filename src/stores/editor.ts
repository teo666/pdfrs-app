import { defineStore } from 'pinia'
import { computed, markRaw, ref, shallowRef, toRaw, watch } from 'vue'
import {
  PdfEditor,
  layoutText,
  type AnnotationId,
  type TextContent,
  type AssetId,
  type DocumentId,
  type ImageAsset,
  type PageAnnotation,
  type PageId,
  type PageInfo,
  type PdfDocument,
} from 'pdfrs-editor'
import {
  booklet_pdf,
  image_to_pdf,
  nup_pdf,
  type BookletOptions,
  type NUpOptions,
} from 'pdfrs-editor/operations'

import { detectKind, downloadBytes, pdfFileName, readFile } from '@/lib/files'

/** Card width range of the thumbnail-size slider, in CSS pixels. */
export const THUMB_SIZE = { min: 120, max: 360, default: 170 }

/**
 * Render scale of the thumbnails for a card width: bigger cards need sharper
 * pictures. In steps, so dragging the slider re-renders only when it crosses
 * one (and the model caches every scale: going back is instant). 0.4 makes
 * an A4 page ~240px wide.
 */
export function previewScaleFor(cardWidth: number): number {
  if (cardWidth <= 200) return 0.4
  if (cardWidth <= 280) return 0.6
  return 0.8
}

const THUMB_SIZE_KEY = 'pdfrs.thumbSize'

/** The last slider position, if this browser kept it (storage may be unavailable). */
function savedThumbSize(): number {
  try {
    const saved = Number(localStorage.getItem(THUMB_SIZE_KEY))
    if (saved >= THUMB_SIZE.min && saved <= THUMB_SIZE.max) return saved
  } catch {
    /* no storage: the default */
  }
  return THUMB_SIZE.default
}

export type ViewerZoom = 'actual' | 'fit'

/** The tools of the right-hand panel. */
export type ToolId = 'sign' | 'image' | 'text' | 'merge' | 'split' | 'nup' | 'booklet'

/** What an imposition tool makes: several pages per sheet, or a folded booklet. */
export type Imposition =
  | { kind: 'nup'; options: NUpOptions }
  | { kind: 'booklet'; options: BookletOptions }

/**
 * An image in the session's library, ready to be placed on pages: a
 * signature, or any other image (a logo, a stamp, a photo).
 */
export interface Signature {
  id: number
  kind: 'signature' | 'image'
  name: string
  /** PNG object URL, for showing it. */
  url: string
  /** Height / width. */
  aspect: number
  image: ImageAsset
}

/** A pending annotation as the UI draws it: the model's data plus the image to show. */
export interface AnnotationView extends PageAnnotation {
  /** The image to show; empty for text, which is drawn from `text`. */
  url: string
  /** Height / width at its natural proportions: the image's, or the laid out text's. */
  aspect: number
  kind: Signature['kind'] | 'text'
}

/** Something waiting to be placed on the page the viewer is opening. */
export type PendingPlacement =
  | { kind: 'library'; id: number }
  | { kind: 'text'; content: TextContent; sizePt: number }

/** The box of a placed signature: fractions of the page (see PageAnnotation). */
export type AnnotationBox = Pick<PageAnnotation, 'x' | 'y' | 'width' | 'rotation' | 'height'>

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
  /**
   * Pending annotations by page. Updated entry by entry, never replaced, so
   * a card reading its own page's entry is the only one to re-render.
   */
  annotations: Record<PageId, AnnotationView[]>
  /**
   * While the Dividi tool is open: the part (1-based) each page would go
   * into, 0 for a page left out. Empty otherwise. Updated entry by entry,
   * like `annotations`.
   */
  splitParts: Record<PageId, number>
}

/** How a click extends the selection: only this page, toggle it, or everything from the last clicked page to it. */
export type SelectMode = 'only' | 'toggle' | 'range'

export interface Notice {
  message: string
  action?: { label: string; run: () => void }
}

/** Pages per sheet of an N-up layout (2 when unspecified, the engine's default). */
export function perSheet(layout: NUpOptions['layout']): number {
  if (layout === undefined) return 2
  return typeof layout === 'number' ? layout : layout.rows * layout.cols
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
  /** Pages whose render failed at the current scale: the background pass skips them. */
  failed: Set<PageId>
  flushScheduled: boolean
  /** Where a shift-click range starts: the last page clicked. */
  anchor: PageId | null
  /** Each library signature is registered with the document once, as an asset. */
  assetBySignature: Map<number, AssetId>
  signatureByAsset: Map<AssetId, Signature>
}

export const useEditorStore = defineStore('editor', () => {
  const editor = new PdfEditor()
  const internals = new Map<DocumentId, DocumentInternals>()
  // The same cached PNG buffer comes back from the model every time its page
  // is asked for again (e.g. after undoing a commit), so it maps to one URL.
  const urlByPng = new WeakMap<Uint8Array, string>()
  // And back: a revoked URL must not be handed out again for its PNG.
  const pngByUrl = new Map<string, Uint8Array>()

  const documents = ref<DocumentState[]>([])
  const activeId = ref<DocumentId | null>(null)
  const loading = ref(0)
  const error = ref<string | null>(null)
  const notice = ref<Notice | null>(null)
  let noticeTimer: ReturnType<typeof setTimeout> | undefined

  const active = computed(() => documents.value.find((d) => d.id === activeId.value) ?? null)

  /** The session's signatures and images. Not persisted anywhere: they're personal data. */
  const library = shallowRef<Signature[]>([])
  const signatures = computed(() => library.value.filter((item) => item.kind === 'signature'))
  const images = computed(() => library.value.filter((item) => item.kind === 'image'))
  let nextSignatureId = 1

  /** Pages are being dragged out of the grid (the sidebar shows where they can go). */
  const draggingPages = ref(false)

  /** Documents picked for a merge, in the order they were picked: that's the merge order. */
  const mergePicks = ref<DocumentId[]>([])

  /** Card width chosen with the header's slider, in CSS pixels. */
  const thumbSize = ref(savedThumbSize())
  const previewScale = computed(() => previewScaleFor(thumbSize.value))
  watch(thumbSize, (size) => {
    try {
      localStorage.setItem(THUMB_SIZE_KEY, String(size))
    } catch {
      /* not kept: fine */
    }
  })
  // A new scale: the thumbnails on show are thrown away, and the cards on
  // screen ask again (renders at the old scale stay cached in the model).
  watch(previewScale, () => {
    for (const state of documents.value) {
      const inner = internals.get(state.id)
      if (inner) dropPreviews(state, inner)
    }
  })

  /** The tool open in the right-hand panel, if any. */
  const activeTool = ref<ToolId | null>(null)

  /**
   * A signature waiting to be placed: set by the Firma tool, which opens
   * the viewer on the page; the viewer places it as soon as the page shows.
   */
  const pendingPlacement = ref<PendingPlacement | null>(null)

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
      pngByUrl.set(url, png)
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
    syncAnnotations(state, inner)
    if (doc.getBytes() !== inner.baseline) {
      inner.baseline = doc.getBytes()
      dropPreviews(state, inner)
      // Page ids are renumbered by a commit: the old selection means nothing.
      state.selection.clear()
      inner.anchor = null
    }
    // New pages (opened, inserted, moved in) have no thumbnail yet.
    scheduleBackground()
  }

  /**
   * Throws away the thumbnails on show (new baseline, or new scale). The
   * cards on screen notice their picture is gone and ask again - except
   * those whose picture was still on its way: theirs was missing before and
   * after, so they'd never ask. Those are asked for here.
   */
  function dropPreviews(state: DocumentState, inner: DocumentInternals) {
    const waiting = [...inner.requested, ...inner.inFlight]
    inner.requested.clear()
    inner.inFlight.clear()
    inner.failed.clear()
    state.previews = {}
    for (const page of waiting) requestPreview(state.id, page)
    scheduleBackground()
  }

  function syncAnnotations(state: DocumentState, inner: DocumentInternals) {
    const byPage = new Map<PageId, AnnotationView[]>()
    for (const annotation of inner.doc.annotations()) {
      let view: AnnotationView
      if (annotation.text) {
        const layout = layoutText(annotation.text.text, annotation.text)
        view = { ...annotation, url: '', aspect: layout.height / layout.width, kind: 'text' }
      } else {
        const signature =
          annotation.asset === null ? undefined : inner.signatureByAsset.get(annotation.asset)
        view = {
          ...annotation,
          url: signature?.url ?? '',
          aspect: signature?.aspect ?? 1,
          kind: signature?.kind ?? 'signature',
        }
      }
      byPage.set(annotation.page, [...(byPage.get(annotation.page) ?? []), view])
    }
    const current = state.annotations
    for (const key of Object.keys(current)) {
      if (!byPage.has(Number(key))) delete current[Number(key)]
    }
    for (const [page, views] of byPage) {
      if (JSON.stringify(current[page]) !== JSON.stringify(views)) current[page] = views
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
      failed: new Set(),
      flushScheduled: false,
      anchor: null,
      assetBySignature: new Map(),
      signatureByAsset: new Map(),
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
      annotations: {},
      splitParts: {},
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

  /**
   * Renames a document in the app: the name it's listed under and the file
   * name it's downloaded as (".pdf" is added there if missing). Blank names
   * are ignored.
   */
  function rename(id: DocumentId, name: string) {
    const state = stateOf(id)
    const trimmed = name.trim()
    if (state && trimmed) state.name = trimmed
  }

  function select(id: DocumentId) {
    if (!stateOf(id) || id === activeId.value) return
    activeId.value = id
    viewerPageId.value = null
  }

  function close(id: DocumentId) {
    const index = documents.value.findIndex((d) => d.id === id)
    if (index === -1) return
    // A merge or a copy of pages hands the same cached PNGs - so the same
    // URLs - to another document: only those nobody else shows go.
    const urls = internals.get(id)?.urls ?? new Set<string>()
    internals.delete(id)
    const kept = new Set([...internals.values()].flatMap((inner) => [...inner.urls]))
    for (const url of urls) {
      if (kept.has(url)) continue
      URL.revokeObjectURL(url)
      const png = pngByUrl.get(url)
      if (png) urlByPng.delete(png)
      pngByUrl.delete(url)
    }
    editor.removeDocument(id)
    documents.value.splice(index, 1)
    mergePicks.value = mergePicks.value.filter((pick) => pick !== id)
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

  // --- Signatures ------------------------------------------------------------

  function addToLibrary(kind: Signature['kind'], image: ImageAsset, url: string, name: string) {
    const item: Signature = markRaw({
      id: nextSignatureId++,
      kind,
      name,
      url,
      aspect: image.height / image.width,
      image,
    })
    library.value = [...library.value, item]
    return item
  }

  const addSignature = (image: ImageAsset, url: string, name: string) =>
    addToLibrary('signature', image, url, name)
  const addImage = (image: ImageAsset, url: string, name: string) =>
    addToLibrary('image', image, url, name)

  /** Takes a signature or image out of the library; copies already placed on pages stay. */
  function removeSignature(id: number) {
    library.value = library.value.filter((item) => item.id !== id)
  }

  /** Places a library signature on a page of the active document; returns the new annotation's id. */
  function placeSignature(
    page: PageId,
    signatureId: number,
    box: Pick<AnnotationBox, 'x' | 'y' | 'width'> & { rotation?: number; height?: number | null },
  ): AnnotationId | null {
    const signature = library.value.find((s) => s.id === signatureId)
    const state = active.value
    const inner = state ? internals.get(state.id) : undefined
    if (!signature || !inner) return null
    let id: AnnotationId | null = null
    edit((doc) => {
      let asset = inner.assetBySignature.get(signature.id)
      if (asset === undefined) {
        asset = doc.addAsset(signature.image, signature.kind === 'image' ? 'immagine' : 'firma')
        inner.assetBySignature.set(signature.id, asset)
        inner.signatureByAsset.set(asset, signature)
      }
      id = doc.addAnnotation({ page, asset, ...box })
    })
    return id
  }

  const updateAnnotation = (id: AnnotationId, box: Partial<AnnotationBox>) =>
    edit((doc) => doc.updateAnnotation(id, box))
  const removeAnnotation = (id: AnnotationId) => edit((doc) => doc.removeAnnotation(id))

  /**
   * "Uguale su tutte le pagine": on, the signature is copied to every page
   * and the copies are edited together; off on one page, that copy is
   * edited on its own there while the others stay linked.
   */
  function setOnAllPages(id: AnnotationId, on: boolean) {
    edit((doc) => (on ? doc.applyAnnotationToAllPages(id) : doc.detachAnnotation(id)))
  }

  /** How many linked copies a group has in the active document. */
  function linkedCopies(group: number | null): number {
    if (group === null || !active.value) return 0
    return Object.values(active.value.annotations)
      .flat()
      .filter((a) => a.group === group && a.linked).length
  }

  // --- Between documents ----------------------------------------------------

  /** Opens a tool in the panel, or closes the panel if that tool is already open. */
  function toggleTool(tool: ToolId) {
    activeTool.value = activeTool.value === tool ? null : tool
    // Merging starts from every open document, in the sidebar's order.
    if (activeTool.value === 'merge' && mergePicks.value.length === 0) {
      mergePicks.value = documents.value.map((d) => d.id)
    }
  }

  /** Moves a picked document to another place in the merge order. */
  function moveMergePick(id: DocumentId, toIndex: number) {
    const rest = mergePicks.value.filter((pick) => pick !== id)
    if (rest.length === mergePicks.value.length) return
    const at = Math.max(0, Math.min(toIndex, rest.length))
    mergePicks.value = [...rest.slice(0, at), id, ...rest.slice(at)]
  }

  /**
   * Starts placing a library signature: opens the viewer on the first
   * selected page (or the first page), where it's put and can be dragged.
   */
  function placeSignatureFromPanel(signatureId: number) {
    const state = active.value
    if (!state || state.pages.length === 0) return
    const target = state.pages.find((p) => state.selection.has(p.id)) ?? state.pages[0]!
    pendingPlacement.value = { kind: 'library', id: signatureId }
    viewerPageId.value = target.id
  }

  /** Like placeSignatureFromPanel, for text: `sizePt` is the font size it should come out at. */
  function placeTextFromPanel(content: TextContent, sizePt: number) {
    const state = active.value
    if (!state || state.pages.length === 0) return
    const target = state.pages.find((p) => state.selection.has(p.id)) ?? state.pages[0]!
    pendingPlacement.value = { kind: 'text', content: { ...content }, sizePt }
    viewerPageId.value = target.id
  }

  function takePendingPlacement(): PendingPlacement | null {
    const placement = pendingPlacement.value
    pendingPlacement.value = null
    return placement
  }

  /** Places text on a page of the active document; returns the new annotation's id. */
  function placeText(
    page: PageId,
    content: TextContent,
    box: Pick<AnnotationBox, 'x' | 'y' | 'width'>,
  ): AnnotationId | null {
    let id: AnnotationId | null = null
    edit((doc) => {
      id = doc.addTextAnnotation({ page, text: content, ...box })
    })
    return id
  }

  /** Changes a text annotation's text or style (and its box, so the font size can stay the same). */
  const updateText = (id: AnnotationId, content: TextContent, box: Partial<AnnotationBox> = {}) =>
    edit((doc) => doc.updateAnnotation(id, { ...box, text: { ...content } }))

  function toggleMergePick(id: DocumentId) {
    mergePicks.value = mergePicks.value.includes(id)
      ? mergePicks.value.filter((pick) => pick !== id)
      : [...mergePicks.value, id]
  }

  function clearMergePicks() {
    mergePicks.value = []
  }

  /** Merges the picked documents, in pick order and as they look now, into a new one, and opens it. */
  async function mergePicked() {
    const ids = mergePicks.value.filter((id) => stateOf(id))
    if (ids.length < 2) return
    const states = ids.map((id) => stateOf(id)!)
    if (states.some((state) => state.busy)) return
    states.forEach((state) => (state.busy = true))
    loading.value += 1
    try {
      const mergedId = await editor.mergeDocuments(ids, { applyPending: true })
      register(mergedId, `Unione di ${ids.length} documenti.pdf`)
      mergePicks.value = []
      if (activeTool.value === 'merge') activeTool.value = null
      select(mergedId)
      notify(`Uniti ${ids.length} documenti: gli originali restano aperti`)
    } catch (err) {
      report(err)
    } finally {
      loading.value -= 1
      states.forEach((state) => (state.busy = false))
    }
  }

  /**
   * Adds the pages of PDF/JPEG files to the active document: after the last
   * selected page if there's a selection, otherwise at the end.
   */
  const insertFiles = (files: File[]) =>
    runBusy(async (doc, state) => {
      const selected = selectedPages()
      let at =
        selected.length > 0
          ? state.pages.findIndex((p) => p.id === selected[selected.length - 1]) + 1
          : state.pages.length
      let added = 0
      for (const file of files) {
        const bytes = await readFile(file)
        const kind = detectKind(bytes)
        if (!kind) throw new Error(`${file.name}: non è un PDF né un'immagine JPEG`)
        const pdf = kind === 'pdf' ? bytes : await image_to_pdf(bytes)
        const ids = await doc.insertPages(pdf, at)
        at += ids.length
        added += ids.length
      }
      if (added > 0) notify(added === 1 ? 'Inserita 1 pagina' : `Inserite ${added} pagine`)
    })

  /**
   * Moves (or, with `copy`, copies) pages of the active document to the end
   * of another one. Moving marks them for deletion here - undoable like any
   * edit - and the other document gets them as one undoable step.
   */
  async function transferPages(pages: PageId[], targetId: DocumentId, copy = false) {
    const source = active.value
    const target = stateOf(targetId)
    if (!source || !target || source.id === targetId || pages.length === 0) return
    if (source.busy || target.busy) return
    source.busy = target.busy = true
    try {
      await editor.transferPages(source.id, pages, targetId, { move: !copy })
      if (!copy) clearSelection()
      const what =
        pages.length === 1
          ? `${copy ? 'Copiata' : 'Spostata'} 1 pagina`
          : `${copy ? 'Copiate' : 'Spostate'} ${pages.length} pagine`
      notify(`${what} in «${target.name}»`, {
        label: 'Apri',
        run: () => select(targetId),
      })
    } catch (err) {
      report(err)
    } finally {
      source.busy = target.busy = false
      sync(source.id)
      sync(targetId)
    }
  }

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

  /**
   * Lays out the selected pages - or the whole document, as it looks now -
   * several to a sheet or as a booklet, into a new document, which is
   * opened (the original stays as it is).
   */
  const impose = (imposition: Imposition) =>
    runBusy(async (doc, state) => {
      const pages = selectedPages()
      const source = pages.length > 0 ? await doc.exportPages(pages) : await doc.exportBytes()
      const result =
        imposition.kind === 'nup'
          ? await nup_pdf(source, imposition.options)
          : await booklet_pdf(source, imposition.options)
      const id = await editor.addDocument(result)
      const base = state.name.replace(/\.(pdf|jpe?g)$/i, '')
      const suffix =
        imposition.kind === 'nup' ? `${perSheet(imposition.options.layout)} per foglio` : 'libretto'
      const name = `${base} (${suffix}).pdf`
      register(id, name)
      activeTool.value = null
      select(id)
      notify(`Creato «${name}»: l’originale resta com’era`, {
        label: 'Torna all’originale',
        run: () => select(state.id),
      })
    })

  /**
   * Shows on the cards how the active document would be cut: each page gets
   * its part's number, pages in no part (or marked for deletion) 0. `null`
   * clears it, on every document.
   */
  function previewSplit(parts: { start: number; end: number }[] | null) {
    for (const doc of documents.value) {
      if (parts && doc.id === activeId.value) continue
      for (const key of Object.keys(doc.splitParts)) delete doc.splitParts[Number(key)]
    }
    const state = active.value
    if (!parts || !state) return
    const next = new Map<PageId, number>(state.pages.map((p) => [p.id, 0]))
    parts.forEach(({ start, end }, index) => {
      for (const page of state.pages.slice(start - 1, end)) {
        // A page in two typed ranges shows the first one.
        if (!page.markedForDeletion && next.get(page.id) === 0) next.set(page.id, index + 1)
      }
    })
    for (const key of Object.keys(state.splitParts)) {
      if (!next.has(Number(key))) delete state.splitParts[Number(key)]
    }
    for (const [page, part] of next) {
      if (state.splitParts[page] !== part) state.splitParts[page] = part
    }
  }

  /**
   * Cuts the active document into parts, each a new document with those
   * pages as they look now (order, rotations, signatures); pages marked for
   * deletion are left out. `parts` are 1-based ranges of grid positions. The
   * first part is opened; the original stays as it is.
   */
  const split = (parts: { start: number; end: number }[]) =>
    runBusy(async (_doc, state) => {
      const pageParts = parts
        .map(({ start, end }) =>
          state.pages
            .slice(start - 1, end)
            .filter((p) => !p.markedForDeletion)
            .map((p) => p.id),
        )
        .filter((ids) => ids.length > 0)
      if (pageParts.length === 0) return
      const base = state.name.replace(/\.(pdf|jpe?g)$/i, '')
      const ids: DocumentId[] = []
      for (const [index, pages] of pageParts.entries()) {
        const id = await editor.extractPages(state.id, pages)
        register(id, `${base} (parte ${index + 1} di ${pageParts.length}).pdf`)
        ids.push(id)
      }
      activeTool.value = null
      select(ids[0]!)
      notify(
        ids.length === 1
          ? 'Creato 1 documento'
          : `Creati ${ids.length} documenti: l’originale resta com’era`,
        { label: 'Torna all’originale', run: () => select(state.id) },
      )
    })

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
    const inner = internals.get(id)
    if (!inner || inner.requested.size === 0) return
    const pages = [...inner.requested]
    inner.requested.clear()
    foreground += 1
    try {
      await renderPreviews(id, pages)
    } finally {
      foreground -= 1
    }
  }

  // --- Background rendering ----------------------------------------------
  //
  // Cards only ask for their thumbnail when they scroll into view. In the
  // gaps, the rest of the pages are rendered too - the active document's
  // first, then the others' - so scrolling finds them ready and the sidebar
  // can show each document's progress. All of it runs on the workers; the
  // main thread only hands out the work.
  //
  // The worker pool takes jobs first come, first served, so this goes a few
  // pages at a time and only when nothing on screen is waiting: a card that
  // scrolls into view waits for one small chunk at most, never for the
  // whole document.

  /** Pages per background chunk: about one per worker of the pool. */
  const BACKGROUND_CHUNK = 8
  /** Renders for the cards on screen being collected or under way. */
  let foreground = 0
  let backgroundScheduled = false
  let backgroundRunning = false

  /** Runs `task` once the browser has a moment (or soon, where it can't say). */
  function whenIdle(task: () => void) {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(task, { timeout: 500 })
    else setTimeout(task, 50)
  }

  /** Makes sure a background pass will run: after any change that leaves pages without a thumbnail. */
  function scheduleBackground() {
    if (backgroundScheduled || backgroundRunning) return
    backgroundScheduled = true
    whenIdle(() => {
      backgroundScheduled = false
      void renderInBackground()
    })
  }

  /** The next pages to render behind the scenes: the active document's first. */
  function nextBackgroundChunk(): { id: DocumentId; pages: PageId[] } | null {
    const ordered = [...documents.value].sort(
      (a, b) => Number(b.id === activeId.value) - Number(a.id === activeId.value),
    )
    for (const state of ordered) {
      const inner = internals.get(state.id)
      if (!inner) continue
      const pages: PageId[] = []
      for (const page of state.pages) {
        if (
          !state.previews[page.id] &&
          !inner.inFlight.has(page.id) &&
          !inner.requested.has(page.id) &&
          !inner.failed.has(page.id)
        ) {
          pages.push(page.id)
          if (pages.length === BACKGROUND_CHUNK) break
        }
      }
      if (pages.length) return { id: state.id, pages }
    }
    return null
  }

  async function renderInBackground() {
    // Nothing changes under a drag: picked up again when it ends (see the watch below).
    if (backgroundRunning || draggingPages.value) return
    // The cards on screen go first: try again once they're done.
    const waiting = [...internals.values()].some((inner) => inner.requested.size > 0)
    if (foreground > 0 || waiting) return scheduleBackground()
    const chunk = nextBackgroundChunk()
    if (!chunk) return
    backgroundRunning = true
    try {
      await renderPreviews(chunk.id, chunk.pages)
    } finally {
      backgroundRunning = false
    }
    scheduleBackground()
  }

  watch(draggingPages, (dragging) => {
    if (!dragging) scheduleBackground()
  })

  /**
   * Thumbnails rendered so far for a document, at the current size, against
   * its page count. Starts again from nothing when the size changes (the
   * thumbnails are rendered anew, at the new resolution) or a commit
   * replaces the pages.
   */
  function renderProgress(id: DocumentId): { done: number; total: number } {
    const state = stateOf(id)
    if (!state) return { done: 0, total: 0 }
    const done = state.pages.reduce((sum, page) => sum + (state.previews[page.id] ? 1 : 0), 0)
    return { done, total: state.pages.length }
  }

  /** Renders `pages` of a document at the current scale, in range batches. */
  async function renderPreviews(id: DocumentId, pages: PageId[]) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner) return

    const order = inner.doc.pages().map((p) => p.id)
    const positions = pages
      .map((page) => order.indexOf(page) + 1)
      .filter((position) => position > 0)
      .sort((a, b) => a - b)

    const batches: { start: number; end: number }[] = []
    for (const position of positions) {
      const last = batches[batches.length - 1]
      if (last && position - last.end <= MAX_BATCH_GAP) last.end = position
      else batches.push({ start: position, end: position })
    }

    const baseline = inner.baseline
    const scale = previewScale.value
    // A commit or undo may replace the baseline while a batch renders, or
    // the slider change the scale: its pictures are then out of date.
    const current = () => inner.baseline === baseline && previewScale.value === scale
    await Promise.all(
      batches.map(async (range) => {
        const pages = order.slice(range.start - 1, range.end)
        pages.forEach((page) => inner.inFlight.add(page))
        try {
          await inner.doc.getPreviews(scale, {
            range,
            onPreview: (preview) => {
              if (!current() || !internals.has(id)) return
              state.previews[preview.id] = urlFor(inner, preview.png)
            },
          })
        } catch (err) {
          if (current()) {
            report(err)
            // Not tried again behind the scenes (a card on screen still may).
            for (const page of pages) if (!state.previews[page]) inner.failed.add(page)
          }
        } finally {
          if (current()) pages.forEach((page) => inner.inFlight.delete(page))
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
    library,
    signatures,
    images,
    addSignature,
    addImage,
    removeSignature,
    placeSignature,
    updateAnnotation,
    removeAnnotation,
    setOnAllPages,
    linkedCopies,
    draggingPages,
    mergePicks,
    activeTool,
    toggleTool,
    thumbSize,
    previewScale,
    moveMergePick,
    pendingPlacement,
    placeSignatureFromPanel,
    placeTextFromPanel,
    takePendingPlacement,
    placeText,
    updateText,
    toggleMergePick,
    clearMergePicks,
    mergePicked,
    insertFiles,
    transferPages,
    openFiles,
    select,
    rename,
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
    impose,
    split,
    previewSplit,
    undo,
    redo,
    commit,
    download,
    requestPreview,
    renderProgress,
    viewerPageId,
    viewerZoom,
    openViewer,
    closeViewer,
    stepViewer,
    renderPage,
    dismissError,
  }
})
