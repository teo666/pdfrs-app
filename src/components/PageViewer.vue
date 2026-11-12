<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { PageId } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import { PREVIEW_SCALE, useEditorStore, type DocumentState } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState; pageId: PageId }>()
const store = useEditorStore()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const scroller = useTemplateRef<HTMLElement>('scroller')

/**
 * 100% means one PDF point per CSS pixel, as in desktop PDF viewers. The
 * page is rendered at the screen's pixel density on top of that (capped), so
 * it stays sharp on a 2x display instead of being upscaled.
 */
const renderScale = Math.min(window.devicePixelRatio || 1, 3)

const index = computed(() => props.doc.pages.findIndex((p) => p.id === props.pageId))
const page = computed(() => props.doc.pages[index.value])
const total = computed(() => props.doc.pages.length)

interface Shown {
  url: string
  /** Size at 100%, in CSS pixels, before the pending rotation. */
  width: number
  height: number
  /** A blown-up thumbnail standing in while the real render is on its way. */
  placeholder: boolean
}
const shown = ref<Shown | null>(null)
const error = ref<string | null>(null)
let request = 0

async function decodedSize(url: string, scale: number) {
  const img = new Image()
  img.src = url
  await img.decode()
  return { width: img.naturalWidth / scale, height: img.naturalHeight / scale }
}

async function show(id: PageId) {
  const token = ++request
  const current = () => token === request
  shown.value = null
  error.value = null

  // The thumbnail, if the card already has one, gives the page's size at
  // once and something to look at while the full render runs.
  const thumbnail = props.doc.previews[id]
  if (thumbnail) {
    decodedSize(thumbnail, PREVIEW_SCALE)
      .then((size) => {
        if (current() && !shown.value) shown.value = { url: thumbnail, ...size, placeholder: true }
      })
      .catch(() => {})
  }

  try {
    const url = await store.renderPage(id, renderScale)
    const size = await decodedSize(url, renderScale)
    if (!current()) return
    shown.value = { url, ...size, placeholder: false }
  } catch (err) {
    if (current()) error.value = err instanceof Error ? err.message : String(err)
    return
  }

  // Warm the cache for the neighbours, so the arrow keys feel instant.
  for (const delta of [1, -1]) {
    const neighbour = props.doc.pages[index.value + delta]
    if (neighbour && current()) void store.renderPage(neighbour.id, renderScale).catch(() => {})
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

const rotation = computed(() => page.value?.pendingRotation ?? 0)
const sideways = computed(() => rotation.value % 180 !== 0)

// A rotated element keeps its unrotated layout box, so the box is sized by
// hand (sides swapped a quarter turn) and the image is centred inside it.
const box = computed(() => {
  if (!shown.value) return {}
  const { width, height } = shown.value
  return sideways.value
    ? { width: `${height}px`, height: `${width}px` }
    : { width: `${width}px`, height: `${height}px` }
})

function onKeyDown(event: KeyboardEvent) {
  const steps: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    PageDown: 1,
    PageUp: -1,
    Home: -Infinity,
    End: Infinity,
  }
  const delta = steps[event.key]
  if (delta === undefined) return
  event.preventDefault()
  store.stepViewer(delta)
}

// Esc fires "cancel" on a modal <dialog>: the store decides, the dialog just reflects it.
function onCancel(event: Event) {
  event.preventDefault()
  store.closeViewer()
}

onMounted(() => dialog.value?.showModal())
// Closed while still in the document, so the browser hands focus back to
// the card that opened it.
onBeforeUnmount(() => dialog.value?.close())
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
        <span class="font-semibold">Pagina {{ index + 1 }} di {{ total }}</span>
        <span v-if="page && page.id !== index + 1" class="text-white/60">era {{ page.id }}</span>
        <span v-if="rotation" class="rounded-full bg-white/15 px-2 text-xs font-semibold">
          {{ rotation }}°
        </span>
        <span
          v-if="page?.markedForDeletion"
          class="rounded-full bg-danger px-2 text-xs font-semibold text-white"
        >
          Da eliminare
        </span>
        <span class="ml-auto truncate text-white/60 max-md:hidden">{{ doc.name }}</span>
        <button
          class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md hover:bg-white/15"
          aria-label="Chiudi anteprima"
          title="Chiudi (Esc)"
          @click="store.closeViewer()"
        >
          <AppIcon name="close" />
        </button>
      </header>

      <!-- Clicking the dark area around the page closes the viewer. -->
      <div ref="scroller" class="relative flex-1 overflow-auto" @click.self="store.closeViewer()">
        <div
          class="flex min-h-full w-max min-w-full items-center justify-center p-10"
          @click.self="store.closeViewer()"
        >
          <div v-if="shown" class="relative shrink-0" :style="box">
            <img
              :src="shown.url"
              :alt="`Pagina ${index + 1}`"
              class="absolute top-1/2 left-1/2 max-w-none bg-white shadow-2xl transition-[filter] duration-200"
              :class="{ 'blur-[2px]': shown.placeholder, 'opacity-50': page?.markedForDeletion }"
              :style="{
                width: `${shown.width}px`,
                height: `${shown.height}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              }"
              :data-full="!shown.placeholder"
            />
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
      class="fixed top-1/2 right-4 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 hover:bg-black/75 disabled:cursor-default disabled:opacity-25"
      aria-label="Pagina successiva"
      title="Pagina successiva (→)"
      :disabled="index >= total - 1"
      @click="store.stepViewer(1)"
    >
      <AppIcon name="chevron-right" :size="24" />
    </button>
  </dialog>
</template>
