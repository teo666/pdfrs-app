import { defineStore } from 'pinia'
import { computed, markRaw, ref, shallowRef, toRaw, watch } from 'vue'
import {
  PdfEditor,
  WrongPasswordError,
  layoutText,
  type AnnotationId,
  type TextContent,
  type AssetId,
  type CompressionLevel,
  type DocumentId,
  type HistoryEntry,
  type ImageAsset,
  type MetadataField,
  type MetadataPatch,
  type OutlineEntry,
  type PageAnnotation,
  type PdfMetadata,
  type PdfPermissions,
  type ProtectOptions,
  type WatermarkOptions,
  type PageId,
  type PageInfo,
  type PdfImageInfo,
  type PdfImagePlacement,
  type PdfDocument,
} from 'pdfrs-editor'
import {
  booklet_pdf,
  is_password_protected,
  nup_pdf,
  type BookletOptions,
  type NUpOptions,
} from 'pdfrs-editor/operations'

import { t } from '@/i18n'
import { describeError } from '@/lib/errors'
import { detectKind, downloadBytes, pdfFileName, readFile } from '@/lib/files'
import { formatBytes } from '@/lib/format'
import { replacementBytes } from '@/lib/images'

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

/** The page a JPEG becomes when opened or inserted: A4 or Letter (photo centred), or the photo's own size. */
export type ImagePage = 'a4' | 'letter' | 'native'
const IMAGE_PAGES: ImagePage[] = ['a4', 'letter', 'native']
const IMAGE_PAGE_KEY = 'pdfrs.imagePage'

/** A photo page: the page it's on, and the white around the photo (only on A4/Letter). */
export interface PhotoPage {
  page: ImagePage
  /** In millimetres: one of `PHOTO_MARGINS_MM`. */
  marginMm: number
}
/** The margins offered around a photo on an A4/Letter page, in millimetres. */
export const PHOTO_MARGINS_MM = [0, 5, 10, 20]
const IMAGE_MARGIN_KEY = 'pdfrs.imageMargin'
/** PDF points per millimetre. */
const POINTS_PER_MM = 72 / 25.4

/** The last choice of margin for photos, if this browser kept it; 1 cm otherwise. */
function savedImageMargin(): number {
  try {
    const saved = Number(localStorage.getItem(IMAGE_MARGIN_KEY) ?? NaN)
    if (PHOTO_MARGINS_MM.includes(saved)) return saved
  } catch {
    /* no storage: the default */
  }
  return 10
}

/** The last choice of page for photos, if this browser kept it; A4 otherwise. */
function savedImagePage(): ImagePage {
  try {
    const saved = localStorage.getItem(IMAGE_PAGE_KEY) as ImagePage | null
    if (saved && IMAGE_PAGES.includes(saved)) return saved
  } catch {
    /* no storage: the default */
  }
  return 'a4'
}

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
export type ToolId =
  | 'sign'
  | 'image'
  | 'text'
  | 'merge'
  | 'split'
  | 'nup'
  | 'booklet'
  | 'protect'
  | 'properties'
  | 'images'
  | 'history'
  | 'outline'
  | 'watermark'

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
  /**
   * Protected by a password: no pages to show or edit until a copy is
   * unlocked with it (`unlock`); can still be downloaded as it is.
   */
  locked: boolean
  /**
   * The document's properties (title, author...) as they'll be written:
   * null until something asks for them (`loadMetadata`), since reading them
   * costs a pass over the file. Then kept current with every edit.
   */
  metadata: PdfMetadata | null
  /** Fields edited and not yet applied. */
  pendingMetadata: MetadataField[]
  /**
   * The images already in the document, with the pages each is drawn on:
   * null until something asks (`loadImages`), since finding them costs a
   * pass over the file. Then kept current with every edit.
   */
  images: ImageItem[] | null
  /**
   * Where images are drawn, by page (empty until `loadImages`). Updated
   * entry by entry, like `annotations`, so a card reads only its own page.
   */
  imagePlacements: Record<PageId, PlacementView[]>
  /** Every step that can be undone or redone, oldest first, the current one marked. */
  history: HistoryEntry[]
  /**
   * The pages made from a photo, with the page each is on: those can be
   * put on another (`setPhotoPage`). Updated entry by entry.
   */
  photoPages: Record<PageId, PhotoPage>
  /**
   * The document's outline (bookmarks), entries pointing at page ids: null
   * until something asks (`loadOutline`), then kept current.
   */
  outline: OutlineEntry[] | null
  /**
   * The restrictions of the file as it was opened (or, for an unlocked
   * copy, of the locked original): undefined until something asks
   * (`loadPermissions`), null when it had none (not encrypted).
   */
  permissions: PdfPermissions | null | undefined
}

/** An image of the document, with where it's drawn. */
export interface ImageItem extends PdfImageInfo {
  /** Pages it's drawn on, in page order. */
  pages: PageId[]
  /** Its placement ids. */
  placements: string[]
  /** Every one of its draws is waiting to be removed. */
  removed: boolean
}

/** One place an image is drawn, and whether it's waiting to be removed. */
export interface PlacementView extends PdfImagePlacement {
  removed: boolean
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
  /** Thumbnails of the document's images, by image key; dropped with the baseline. */
  thumbnails: Map<string, Promise<string>>
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

  /**
   * The page a JPEG gets when opened or inserted (see `ImagePage`), and the
   * margin around it: the defaults, remembered. Each photo page can then be
   * put on another page or margin (`setPhotoPage`), and that choice made
   * the new default.
   */
  const imagePage = ref<ImagePage>(savedImagePage())
  const imageMargin = ref(savedImageMargin())
  watch([imagePage, imageMargin], ([page, margin]) => {
    try {
      localStorage.setItem(IMAGE_PAGE_KEY, page)
      localStorage.setItem(IMAGE_MARGIN_KEY, String(margin))
    } catch {
      /* not kept: fine */
    }
  })
  const imagePageOptions = (page: ImagePage = imagePage.value, marginMm = imageMargin.value) =>
    page === 'native'
      ? { pageSize: 'native' as const }
      : { pageSize: page, orientation: 'auto' as const, margin: marginMm * POINTS_PER_MM }

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
    error.value = describeError(err)
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
        old.markedForDeletion === page.markedForDeletion &&
        old.originalNumber === page.originalNumber
        ? old
        : page
    })
    state.canUndo = doc.canUndo()
    state.canRedo = doc.canRedo()
    state.history = doc.history()
    state.hasPendingChanges = doc.hasPendingChanges()
    syncAnnotations(state, inner)
    syncPhotoPages(state, inner)
    if (doc.getBytes() !== inner.baseline) {
      inner.baseline = doc.getBytes()
      dropPreviews(state, inner)
      // Page ids are renumbered by a commit: the old selection means nothing.
      state.selection.clear()
      inner.anchor = null
      // An image key names an object of this baseline: another one, another image.
      inner.thumbnails.clear()
    }
    // New pages (opened, inserted, moved in) have no thumbnail yet.
    scheduleBackground()
    // An undo, a redo or a commit may change them too.
    if (state.metadata !== null) void refreshMetadata(state.id)
    if (state.images !== null) void refreshImages(state.id)
    if (state.outline !== null) void refreshOutline(state.id)
  }

  // --- Outline ------------------------------------------------------------------

  async function refreshOutline(id: DocumentId) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner || state.locked) return
    try {
      const outline = await inner.doc.getOutline()
      if (JSON.stringify(outline) !== JSON.stringify(state.outline)) state.outline = outline
    } catch (err) {
      report(err)
    }
  }

  /** Makes the restrictions of a document's file available (`permissions`), reading them the first time. */
  async function loadPermissions(id: DocumentId) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner || state.permissions !== undefined) return
    try {
      state.permissions = await inner.doc.getOriginalPermissions()
    } catch (err) {
      report(err)
    }
  }

  /** Makes a document's outline available (`outline`), reading it the first time. */
  async function loadOutline(id: DocumentId) {
    if (stateOf(id)?.outline === null) await refreshOutline(id)
  }

  /** A page the grid should bring into view (and it's selected): set by `revealPage`, cleared by the grid. */
  const revealedPage = ref<PageId | null>(null)

  /**
   * Selects a page of the active document and has the grid scroll to it.
   * `mode` as for a click on a card: only it, toggled (⌘/Ctrl), or the
   * range from the last page picked (Shift).
   */
  function revealPage(page: PageId, mode: SelectMode = 'only') {
    if (!active.value?.pages.some((p) => p.id === page)) return
    selectPage(page, mode)
    revealedPage.value = page
  }

  function syncPhotoPages(state: DocumentState, inner: DocumentInternals) {
    const photos = inner.doc.photoPages()
    const current = state.photoPages
    for (const key of Object.keys(current)) {
      if (!photos.has(Number(key))) delete current[Number(key)]
    }
    for (const [page, options] of photos) {
      const view: PhotoPage = {
        page: (options.pageSize ?? 'native') as ImagePage,
        marginMm: Math.round((options.margin ?? 0) / POINTS_PER_MM),
      }
      const old = current[page]
      if (old?.page !== view.page || old.marginMm !== view.marginMm) current[page] = view
    }
  }

  /**
   * Puts a photo page of the active document on another page (A4, Letter,
   * the photo's own size) or margin - whatever `change` says, the rest as
   * it is: made again from its JPEG, in the same place, with its pending
   * edits. One undo step. The page gets a new id; the viewer and the
   * selection follow it.
   */
  const setPhotoPage = (page: PageId, change: Partial<PhotoPage>) =>
    runBusy(async (doc, state) => {
      const now = state.photoPages[page]
      if (!now) return
      const next = { ...now, ...change }
      const replacement = await doc.setPhotoPage(page, imagePageOptions(next.page, next.marginMm))
      if (replacement === page) return
      if (viewerPageId.value === page) viewerPageId.value = replacement
      if (state.selection.delete(page)) state.selection.add(replacement)
    })

  // --- Images already in the document ---------------------------------------

  /** Reads where the document's images are and which are waiting to be removed. */
  async function refreshImages(id: DocumentId) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner || state.locked) return
    try {
      const { images, placements } = await inner.doc.getImages()
      const removed = inner.doc.pendingImageRemovals()
      const byPage = new Map<PageId, PlacementView[]>()
      for (const placement of placements) {
        const view = { ...placement, removed: removed.has(placement.id) }
        byPage.set(placement.page, [...(byPage.get(placement.page) ?? []), view])
      }
      state.images = images.map((image) => {
        const own = placements.filter((p) => p.image === image.key)
        return {
          ...image,
          pages: [...new Set(own.map((p) => p.page))].sort((a, b) => a - b),
          placements: [...new Set(own.map((p) => p.id))],
          removed: own.length > 0 && own.every((p) => removed.has(p.id)),
        }
      })
      const current = state.imagePlacements
      for (const key of Object.keys(current)) {
        if (!byPage.has(Number(key))) delete current[Number(key)]
      }
      for (const [page, views] of byPage) {
        if (JSON.stringify(current[page]) !== JSON.stringify(views)) current[page] = views
      }
    } catch (err) {
      report(err)
    }
  }

  /** Makes a document's images available (`images`, `imagePlacements`), finding them the first time. */
  async function loadImages(id: DocumentId) {
    if (stateOf(id)?.images === null) await refreshImages(id)
  }

  /** Takes these image draws away from the active document: a pending edit, one undo step. */
  const removeImages = (ids: string[]) => edit((doc) => doc.removeImages(ids))
  /** Puts back image draws taken away and not applied yet. */
  const restoreImages = (ids: string[]) => edit((doc) => doc.restoreImages(ids))

  /**
   * Puts the picture `file` in the place of the active document's image
   * `key`, wherever it's drawn; one of other proportions fits inside the old
   * box. Applied at once, one undo step.
   */
  const replaceImage = (key: string, file: File) =>
    runBusy(async (doc) => {
      const pages = imageOf(key)?.pages.length ?? 1
      await doc.replaceImage(key, await replacementBytes(file))
      notify(t('store.notices.imageReplaced', pages))
    })

  /** The active document's image, by key. */
  const imageOf = (key: string) => active.value?.images?.find((image) => image.key === key)

  /** Downloads an image of the active document as a file: the JPEG as stored, or a PNG. */
  async function downloadImage(key: string) {
    const state = active.value
    const inner = state ? internals.get(state.id) : undefined
    if (!state || !inner) return
    try {
      const image = await inner.doc.extractImage(key)
      const number = (state.images?.findIndex((item) => item.key === key) ?? 0) + 1
      const extension = image.mime === 'image/jpeg' ? 'jpg' : 'png'
      const base = state.name.replace(/\.(pdf|jpe?g)$/i, '')
      downloadBytes(image.bytes, t('store.names.image', { base, n: number, extension }), image.mime)
    } catch (err) {
      report(err)
    }
  }

  /** Longest side of the images' thumbnails, in pixels. */
  const THUMBNAIL_SIZE = 192

  /** A small picture of one of the active document's images, made once. */
  function imageThumbnail(key: string): Promise<string> {
    const state = active.value
    const inner = state ? internals.get(state.id) : undefined
    if (!inner) return Promise.reject(new Error(t('store.errors.noDocument')))
    let url = inner.thumbnails.get(key)
    if (!url) {
      url = inner.doc.extractImage(key, THUMBNAIL_SIZE).then((image) => {
        const made = URL.createObjectURL(
          new Blob([image.bytes as Uint8Array<ArrayBuffer>], { type: image.mime }),
        )
        inner.urls.add(made)
        return made
      })
      // A failed one is tried again next time.
      url.catch(() => inner.thumbnails.delete(key))
      inner.thumbnails.set(key, url)
    }
    return url
  }

  /** An image the viewer should show selected when it opens on its page. */
  const focusedImage = ref<string | null>(null)

  /** Opens the viewer on the first page drawing the image, with the image selected. */
  function focusImage(key: string) {
    const page = imageOf(key)?.pages[0]
    if (page === undefined) return
    focusedImage.value = key
    openViewer(page)
  }

  /** Reads the document's properties as they'd be written (pending edits included). */
  async function refreshMetadata(id: DocumentId) {
    const state = stateOf(id)
    const inner = internals.get(id)
    if (!state || !inner || state.locked) return
    try {
      const metadata = await inner.doc.getMetadata()
      state.metadata = metadata
      state.pendingMetadata = [...inner.doc.pendingMetadataFields()]
    } catch (err) {
      report(err)
    }
  }

  /** Makes a document's properties available (`metadata`), reading them the first time. */
  async function loadMetadata(id: DocumentId) {
    if (stateOf(id)?.metadata === null) await refreshMetadata(id)
  }

  /**
   * Edits the active document's properties: a string sets a field, null
   * removes it, a field left out stays as it is. A pending edit like the
   * others - one undoable step, written by Applica modifiche or Scarica.
   */
  async function setMetadata(patch: MetadataPatch) {
    const id = activeId.value
    if (id === null) return
    await runBusy((doc) => doc.setMetadata(patch))
    await refreshMetadata(id)
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
      thumbnails: new Map(),
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
      locked: doc.isLocked(),
      metadata: null,
      pendingMetadata: [],
      images: null,
      imagePlacements: {},
      history: [],
      photoPages: {},
      outline: null,
      permissions: undefined,
    })
    sync(id)
  }

  async function openFiles(files: File[]) {
    loading.value += files.length
    for (const file of files) {
      try {
        const bytes = await readFile(file)
        const kind = detectKind(bytes)
        if (!kind) throw new Error(t('store.errors.notPdfOrJpeg', { name: file.name }))
        const id =
          kind === 'pdf'
            ? await editor.addDocument(bytes)
            : await editor.addImage(bytes, imagePageOptions())
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
  /** Drops the page's pending rotation: back to how it is in the file. */
  const resetRotation = (page: PageId) => edit((doc) => doc.resetRotation(page))
  const move = (page: PageId, toIndex: number) => edit((doc) => doc.movePage(page, toIndex))
  /** Moves pages as one block; `toIndex` counts the other pages only (see `PdfDocument.movePages`). */
  const movePages = (pages: PageId[], toIndex: number) =>
    edit((doc) => doc.movePages(pages, toIndex))
  const undo = () => edit((doc) => doc.undo())
  const redo = () => edit((doc) => doc.redo())
  /** Goes back (or forward) to any step of the active document's history in one go. */
  const goToHistory = (index: number) => edit((doc) => doc.goToHistoryIndex(index))

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
      mergePicks.value = documents.value.filter((d) => !d.locked).map((d) => d.id)
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
    // A locked document has no pages to give: unlock it first.
    if (stateOf(id)?.locked) return
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
      // The merged outline gets one branch per document, under its name.
      const titles = states.map((state) => state.name.replace(/\.(pdf|jpe?g)$/i, ''))
      const mergedId = await editor.mergeDocuments(ids, { applyPending: true, titles })
      register(mergedId, t('store.names.merged', { n: ids.length }))
      mergePicks.value = []
      if (activeTool.value === 'merge') activeTool.value = null
      select(mergedId)
      notify(t('store.notices.merged', { n: ids.length }))
    } catch (err) {
      report(err)
    } finally {
      loading.value -= 1
      states.forEach((state) => (state.busy = false))
    }
  }

  /** Where an insertion goes: after the last selected page, or at the end. */
  function insertionIndex(state: DocumentState): number {
    const selected = selectedPages()
    return selected.length > 0
      ? state.pages.findIndex((p) => p.id === selected[selected.length - 1]) + 1
      : state.pages.length
  }

  /**
   * An empty page, the size of the page before it as shown: after the last
   * selected page, or at the end. One undoable step.
   */
  const insertBlankPage = () =>
    runBusy(async (doc, state) => {
      const at = insertionIndex(state)
      await doc.insertBlankPage(at)
      notify(t('store.notices.blankPage', { position: at + 1 }))
    })

  /**
   * A text watermark on the selected pages, or on every page shown (those
   * marked for deletion left out). Applied to the document right away, as
   * one undoable step: the thumbnails show it as it comes out.
   */
  const addWatermark = (options: WatermarkOptions) =>
    runBusy(async (doc, state) => {
      const selected = selectedPages()
      const pages =
        selected.length > 0 ? selected : state.pages.filter((p) => !p.markedForDeletion).map((p) => p.id)
      await doc.addWatermark(options, pages)
      notify(t('store.notices.watermarked', pages.length))
    })

  /**
   * Adds the pages of PDF/JPEG files to the active document: after the last
   * selected page if there's a selection, otherwise at the end.
   */
  const insertFiles = (files: File[]) =>
    runBusy(async (doc, state) => {
      let at = insertionIndex(state)
      let added = 0
      for (const file of files) {
        const bytes = await readFile(file)
        const kind = detectKind(bytes)
        if (!kind) throw new Error(t('store.errors.notPdfOrJpeg', { name: file.name }))
        if (kind === 'pdf' && (await is_password_protected(bytes))) {
          throw new Error(t('store.errors.insertProtected', { name: file.name }))
        }
        // A photo is inserted as one, so its page can be changed later.
        const count =
          kind === 'pdf'
            ? (await doc.insertPages(bytes, at)).length
            : (await doc.insertImage(bytes, imagePageOptions(), at), 1)
        at += count
        added += count
      }
      if (added > 0) notify(t('store.notices.inserted', added))
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
    if (target.locked) return
    if (source.busy || target.busy) return
    source.busy = target.busy = true
    try {
      await editor.transferPages(source.id, pages, targetId, { move: !copy })
      if (!copy) clearSelection()
      const message = copy ? 'store.notices.copied' : 'store.notices.moved'
      notify(t(message, { target: target.name }, pages.length), {
        label: t('store.actions.open'),
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
  /** Drops the pending rotation of the selected pages (the ones not rotated are left alone). */
  const resetRotationSelected = () => edit((doc) => doc.resetRotations(selectedPages()))

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
      const name =
        imposition.kind === 'nup'
          ? t('store.names.nup', { base, n: perSheet(imposition.options.layout) })
          : t('store.names.booklet', { base })
      register(id, name)
      activeTool.value = null
      select(id)
      notify(t('store.notices.created', { name }), {
        label: t('store.actions.backToOriginal'),
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
        register(id, t('store.names.part', { base, index: index + 1, total: pageParts.length }))
        ids.push(id)
      }
      activeTool.value = null
      select(ids[0]!)
      notify(t('store.notices.split', ids.length), {
        label: t('store.actions.backToOriginal'),
        run: () => select(state.id),
      })
    })

  /** Copies the selected pages, as they look now, into a new document. */
  const extractSelected = () =>
    runBusy(async (_doc, state) => {
      const pages = selectedPages()
      if (pages.length === 0) return
      const id = await editor.extractPages(state.id, pages)
      const name = t('store.names.extracted', { base: state.name.replace(/\.(pdf|jpe?g)$/i, '') })
      register(id, name)
      notify(t('store.notices.extracted', { name }, pages.length), {
        label: t('store.actions.open'),
        run: () => select(id),
      })
    })

  // --- Passwords ---------------------------------------------------------------
  //
  // Protecting or unlocking makes a new document, listed beside the one it
  // comes from: the protected copy with a lock, the unlocked one as any
  // other. Passwords go straight to the engine; nothing keeps them.

  /** The name without its extension, or the " (protetto)" a protected copy got. */
  const baseName = (name: string) => {
    const base = name.replace(/\.(pdf|jpe?g)$/i, '')
    // What a protected copy's name adds to the original's (" (protetto)"),
    // in the current language: its message, around an empty name.
    const suffix = t('store.names.protected', { base: '' }).replace(/\.pdf$/i, '')
    return suffix && base.endsWith(suffix) ? base.slice(0, -suffix.length) : base
  }

  /**
   * A copy of the active document, as it looks now, that needs `password`
   * to be opened (AES-256). Opened, locked; the original stays as it is.
   */
  /**
   * A protected copy of the active document. `options.permissions`
   * restricts what the password allows; restrictions need
   * `options.ownerPassword`, a different one that lifts them.
   */
  const protect = (password: string, options: ProtectOptions = {}) =>
    runBusy(async (_doc, state) => {
      const id = await editor.protectDocument(state.id, password, options)
      const name = t('store.names.protected', { base: baseName(state.name) })
      register(id, name)
      activeTool.value = null
      select(id)
      notify(t('store.notices.protected', { name }), {
        label: t('store.actions.backToOriginal'),
        run: () => select(state.id),
      })
    })

  /**
   * A lighter copy of the active document, as it looks now, its images
   * recompressed for `level`: opened, with the sizes before and after in
   * the notice. When no image gets lighter, nothing is made.
   */
  const compressImages = (level: CompressionLevel) =>
    runBusy(async (_doc, state) => {
      const result = await editor.compressDocument(state.id, level)
      if (result.id === null) {
        notify(t('store.notices.nothingToCompress'))
        return
      }
      const name = t('store.names.compressed', { base: baseName(state.name) })
      register(result.id, name)
      select(result.id)
      notify(
        t('store.notices.compressed', {
          name,
          before: formatBytes(result.bytesBefore),
          after: formatBytes(result.bytesAfter),
          percent: Math.round(100 * (1 - result.bytesAfter / result.bytesBefore)),
        }),
        { label: t('store.actions.backToOriginal'), run: () => select(state.id) },
      )
    })

  /**
   * A readable copy of the active, locked document, opened. False when the
   * password is wrong (the caller says so), true otherwise - errors other
   * than that are reported as usual.
   */
  async function unlock(password: string): Promise<boolean> {
    let wrong = false
    await runBusy(async (_doc, state) => {
      try {
        const id = await editor.unlockDocument(state.id, password)
        const name = t('store.names.unlocked', { base: baseName(state.name) })
        register(id, name)
        select(id)
        notify(t('store.notices.unlocked', { name }), {
          label: t('store.actions.backToProtected'),
          run: () => select(state.id),
        })
      } catch (err) {
        if (err instanceof WrongPasswordError) wrong = true
        else throw err
      }
    })
    return !wrong
  }

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
    if (!inner) throw new Error(t('store.errors.noActiveDocument'))
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
    imagePage,
    imageMargin,
    loadOutline,
    loadPermissions,
    revealedPage,
    revealPage,
    setPhotoPage,
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
    insertBlankPage,
    addWatermark,
    transferPages,
    protect,
    unlock,
    loadMetadata,
    setMetadata,
    loadImages,
    removeImages,
    restoreImages,
    replaceImage,
    compressImages,
    downloadImage,
    imageThumbnail,
    focusedImage,
    focusImage,
    openFiles,
    select,
    rename,
    close,
    rotate,
    resetRotation,
    move,
    movePages,
    toggleDelete,
    selectPage,
    selectAll,
    clearSelection,
    rotateSelected,
    resetRotationSelected,
    toggleDeleteSelected,
    extractSelected,
    impose,
    split,
    previewSplit,
    undo,
    redo,
    goToHistory,
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
