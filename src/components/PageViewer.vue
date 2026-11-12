<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { AnnotationId, PageId } from 'pdfrs-editor'

import AnnotationLayer from './AnnotationLayer.vue'
import AppIcon from './AppIcon.vue'
import SignaturePanel from './SignaturePanel.vue'
import { PREVIEW_SCALE, useEditorStore, type DocumentState, type ViewerZoom } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState; pageId: PageId }>()
const store = useEditorStore()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const scroller = useTemplateRef<HTMLElement>('scroller')

/** Breathing room around the page, matching the `p-10` of the stage. */
const STAGE_PADDING = 40
/** Highest render scale asked of the wasm renderer (a 4x A4 is ~2400 x 3400 px). */
const MAX_RENDER_SCALE = 4

const dpr = window.devicePixelRatio || 1

const index = computed(() => props.doc.pages.findIndex((p) => p.id === props.pageId))
const page = computed(() => props.doc.pages[index.value])
const total = computed(() => props.doc.pages.length)
const rotation = computed(() => page.value?.pendingRotation ?? 0)
const sideways = computed(() => rotation.value % 180 !== 0)

// --- Signatures ----------------------------------------------------------

const signing = ref(false)
const selectedAnnotation = ref<AnnotationId | null>(null)
const pageAnnotations = computed(() => props.doc.annotations[props.pageId] ?? [])

/** Default width of a newly placed signature, as a fraction of the page. */
const PLACE_WIDTH = 0.3

/** Puts a library signature in the middle of the page, selected so it can be dragged right away. */
function placeSignature(signatureId: number) {
  const signature = store.signatures.find((s) => s.id === signatureId)
  if (!signature || !shown.value) return
  const pageAspect = shown.value.width / shown.value.height
  const height = PLACE_WIDTH * signature.aspect * pageAspect
  const id = store.placeSignature(props.pageId, signatureId, {
    x: (1 - PLACE_WIDTH) / 2,
    y: Math.max(0, (1 - height) / 2),
    width: PLACE_WIDTH,
  })
  selectedAnnotation.value = id
}

function removeSelectedAnnotation() {
  if (selectedAnnotation.value === null) return
  store.removeAnnotation(selectedAnnotation.value)
  selectedAnnotation.value = null
}

// Selection is per page; an undo can also take the selected one away.
watch(
  () => props.pageId,
  () => (selectedAnnotation.value = null),
)
watch(pageAnnotations, (list) => {
  if (!list.some((a) => a.id === selectedAnnotation.value)) selectedAnnotation.value = null
})

interface Shown {
  url: string
  /** The page's size in PDF points, before the pending rotation. */
  width: number
  height: number
  /** The scale the image was rendered at (pixels per point). */
  scale: number
  /** A blown-up thumbnail standing in while the real render is on its way. */
  placeholder: boolean
}
const shown = ref<Shown | null>(null)
const error = ref<string | null>(null)

// --- Zoom ---------------------------------------------------------------
// 100% is one PDF point per CSS pixel, as in desktop PDF viewers. "Fit"
// scales the page, as rotated, to the space the stage has.

const stage = ref({ width: 0, height: 0 })
let resizeObserver: ResizeObserver | null = null

/** The rotated page's size in points: what has to fit. */
const box = computed(() => {
  if (!shown.value) return null
  const { width, height } = shown.value
  return sideways.value ? { width: height, height: width } : { width, height }
})

const zoom = computed(() => {
  if (store.viewerZoom === 'actual' || !box.value) return 1
  const fit = Math.min(stage.value.width / box.value.width, stage.value.height / box.value.height)
  return fit > 0 ? fit : 1
})

/**
 * Pixels per point the image needs to look sharp at the current zoom on
 * this screen. Rounded up to half steps so small resizes reuse the model's
 * render cache instead of asking for a new scale each time.
 */
const neededScale = computed(() => Math.min(MAX_RENDER_SCALE, Math.ceil(dpr * zoom.value * 2) / 2))

function setZoom(mode: ViewerZoom) {
  store.viewerZoom = mode
}

// --- Loading ------------------------------------------------------------

let request = 0

async function decodedSize(url: string, scale: number) {
  const img = new Image()
  img.src = url
  await img.decode()
  return { width: img.naturalWidth / scale, height: img.naturalHeight / scale }
}

async function render(id: PageId, scale: number, isCurrent: () => boolean) {
  const url = await store.renderPage(id, scale)
  const size = await decodedSize(url, scale)
  if (isCurrent()) shown.value = { url, ...size, scale, placeholder: false }
}

async function show(id: PageId) {
  const token = ++request
  const isCurrent = () => token === request
  // Pages of a document are usually all the same size, so the scale needed
  // for the previous one is the best guess for this one too.
  const scale = shown.value?.placeholder === false ? neededScale.value : dpr
  shown.value = null
  error.value = null

  // The thumbnail, if the card already has one, gives the page's size at
  // once and something to look at while the full render runs.
  const thumbnail = props.doc.previews[id]
  if (thumbnail) {
    decodedSize(thumbnail, PREVIEW_SCALE)
      .then((size) => {
        if (isCurrent() && !shown.value) {
          shown.value = { url: thumbnail, ...size, scale: PREVIEW_SCALE, placeholder: true }
        }
      })
      .catch(() => {})
  }

  try {
    await render(id, scale, isCurrent)
  } catch (err) {
    if (isCurrent()) error.value = err instanceof Error ? err.message : String(err)
    return
  }

  // Warm the cache for the neighbours, so the arrow keys feel instant.
  for (const delta of [1, -1]) {
    const neighbour = props.doc.pages[index.value + delta]
    if (neighbour && isCurrent()) void store.renderPage(neighbour.id, scale).catch(() => {})
  }
}

watch(
  () => props.pageId,
  async (id) => {
    await show(id)
    await nextTick()
    scroller.value?.scrollTo({ top: 0, left: 0 })
  },
  { immediate: true },
)

// Zooming in past what the current render can show sharply (fit on a big
// window, or a page that turned out bigger than guessed): render again,
// sharper. Never downgrades - a sharper image only costs memory.
watch(neededScale, (scale) => {
  const current = shown.value
  if (!current || current.placeholder || scale <= current.scale) return
  const token = request
  render(props.pageId, scale, () => token === request).catch(() => {})
})

// --- Keyboard & lifecycle -----------------------------------------------

function onKeyDown(event: KeyboardEvent) {
  if ((event.target as HTMLElement | null)?.closest('input, textarea')) return
  // Undo/redo work in here too: signatures are edited in the viewer.
  if (event.metaKey || event.ctrlKey) {
    const key = event.key.toLowerCase()
    if (key === 'z' || key === 'y') {
      event.preventDefault()
      if (key === 'y' || event.shiftKey) store.redo()
      else store.undo()
    }
    return
  }
  if (event.altKey) return
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedAnnotation.value !== null) {
    event.preventDefault()
    removeSelectedAnnotation()
    return
  }
  const steps: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    PageDown: 1,
    PageUp: -1,
    Home: -Infinity,
    End: Infinity,
  }
  const zooms: Record<string, ViewerZoom> = { '0': 'fit', '1': 'actual' }
  if (event.key in steps) {
    event.preventDefault()
    store.stepViewer(steps[event.key]!)
  } else if (event.key in zooms) {
    event.preventDefault()
    setZoom(zooms[event.key]!)
  }
}

// Esc fires "cancel" on a modal <dialog>: the store decides, the dialog just
// reflects it. With a signature selected, Esc first just deselects it.
function onCancel(event: Event) {
  event.preventDefault()
  if (selectedAnnotation.value !== null) selectedAnnotation.value = null
  else store.closeViewer()
}

onMounted(() => {
  dialog.value?.showModal()
  const el = scroller.value
  if (!el) return
  resizeObserver = new ResizeObserver(() => {
    stage.value = {
      width: el.clientWidth - 2 * STAGE_PADDING,
      height: el.clientHeight - 2 * STAGE_PADDING,
    }
  })
  resizeObserver.observe(el)
})

// Closed while still in the document, so the browser hands focus back to
// the card that opened it.
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  dialog.value?.close()
})

const zoomOptions: { mode: ViewerZoom; label: string; key: string }[] = [
  { mode: 'fit', label: 'Adatta', key: '0' },
  { mode: 'actual', label: '100%', key: '1' },
]
</script>

<template>
  <dialog
    ref="dialog"
    class="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 text-white backdrop:bg-black/80"
    aria-label="Anteprima pagina"
    @cancel="onCancel"
    @keydown="onKeyDown"
  >
    <div class="flex h-full flex-col">
      <header class="flex items-center gap-3 bg-black/50 px-4 py-2.5 backdrop-blur">
        <span class="font-semibold whitespace-nowrap">Pagina {{ index + 1 }} di {{ total }}</span>
        <span v-if="page && page.id !== index + 1" class="text-white/60 whitespace-nowrap">
          era {{ page.id }}
        </span>
        <span v-if="rotation" class="rounded-full bg-white/15 px-2 text-xs font-semibold">
          {{ rotation }}°
        </span>
        <span
          v-if="page?.markedForDeletion"
          class="rounded-full bg-danger px-2 text-xs font-semibold whitespace-nowrap text-white"
        >
          Da eliminare
        </span>
        <span class="ml-auto truncate text-white/60 max-md:hidden">{{ doc.name }}</span>

        <button
          class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors max-md:ml-auto"
          :class="signing ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'"
          :aria-pressed="signing"
          @click="signing = !signing"
        >
          <AppIcon name="pen" :size="14" />
          Firma
        </button>

        <div
          class="flex shrink-0 rounded-md bg-white/10 p-0.5 max-md:ml-auto"
          role="group"
          aria-label="Zoom"
        >
          <button
            v-for="option in zoomOptions"
            :key="option.mode"
            class="cursor-pointer rounded px-2.5 py-1 text-xs font-semibold transition-colors"
            :class="
              store.viewerZoom === option.mode
                ? 'bg-white text-black'
                : 'text-white/75 hover:text-white'
            "
            :aria-pressed="store.viewerZoom === option.mode"
            :title="`${option.label} (${option.key})`"
            @click="setZoom(option.mode)"
          >
            {{ option.label }}
          </button>
        </div>

        <button
          class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md hover:bg-white/15"
          aria-label="Chiudi anteprima"
          title="Chiudi (Esc)"
          @click="store.closeViewer()"
        >
          <AppIcon name="close" />
        </button>
      </header>

      <div class="relative flex min-h-0 flex-1">
        <!-- Clicking the dark area around the page closes the viewer. -->
        <div
          ref="scroller"
          class="relative min-w-0 flex-1 overflow-auto"
          @click.self="store.closeViewer()"
        >
          <div
            class="flex min-h-full w-max min-w-full items-center justify-center p-10"
            @click.self="store.closeViewer()"
          >
            <!--
            A rotated element keeps its unrotated layout box, so the box is
            sized by hand (sides swapped a quarter turn) and the page - image
            and signatures together - is centred and turned inside it.
          -->
            <div
              v-if="shown && box"
              class="relative shrink-0"
              :style="{ width: `${box.width * zoom}px`, height: `${box.height * zoom}px` }"
            >
              <div
                class="absolute top-1/2 left-1/2"
                :style="{
                  width: `${shown.width * zoom}px`,
                  height: `${shown.height * zoom}px`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }"
              >
                <img
                  :src="shown.url"
                  :alt="`Pagina ${index + 1}`"
                  class="block size-full max-w-none bg-white shadow-2xl transition-[filter] duration-200"
                  :class="{
                    'blur-[2px]': shown.placeholder,
                    'opacity-50': page?.markedForDeletion,
                  }"
                  :data-full="!shown.placeholder"
                  draggable="false"
                />
                <AnnotationLayer
                  :annotations="pageAnnotations"
                  :rotation="rotation"
                  :page-width="shown.width * zoom"
                  :page-height="shown.height * zoom"
                  :selected-id="selectedAnnotation"
                  @select="selectedAnnotation = $event"
                  @change="(id, change) => store.updateAnnotation(id, change)"
                  @remove="(id) => (store.removeAnnotation(id), (selectedAnnotation = null))"
                />
              </div>
            </div>
            <p v-else-if="error" class="text-white/80">{{ error }}</p>
            <div
              v-else
              class="size-10 animate-spin rounded-full border-4 border-white/20 border-t-white"
              role="status"
              aria-label="Caricamento"
            />
          </div>
        </div>

        <SignaturePanel v-if="signing" @place="placeSignature" @close="signing = false" />
      </div>
    </div>

    <button
      class="fixed top-1/2 left-4 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 hover:bg-black/75 disabled:cursor-default disabled:opacity-25"
      aria-label="Pagina precedente"
      title="Pagina precedente (←)"
      :disabled="index <= 0"
      @click="store.stepViewer(-1)"
    >
      <AppIcon name="chevron-left" :size="24" />
    </button>
    <button
      class="fixed top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 hover:bg-black/75 disabled:cursor-default disabled:opacity-25"
      :class="signing ? 'right-[19rem] max-md:right-4' : 'right-4'"
      aria-label="Pagina successiva"
      title="Pagina successiva (→)"
      :disabled="index >= total - 1"
      @click="store.stepViewer(1)"
    >
      <AppIcon name="chevron-right" :size="24" />
    </button>
  </dialog>
</template>
