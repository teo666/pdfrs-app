<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import type { PageInfo } from 'pdfrs-editor'

import IconButton from './IconButton.vue'
import type { DropSide } from '@/lib/reorder'

const props = defineProps<{
  page: PageInfo
  /** 1-based position in the current display order. */
  position: number
  previewUrl?: string
  disabled?: boolean
  dragging?: boolean
  dropSide?: DropSide | null
}>()

const emit = defineEmits<{
  rotate: [degrees: number]
  toggleDelete: []
  /** The card is on screen and has no thumbnail yet. */
  needPreview: []
}>()

const root = useTemplateRef<HTMLElement>('root')
const visible = ref(false)
let observer: IntersectionObserver | null = null

function askIfNeeded() {
  if (visible.value && !props.previewUrl) emit('needPreview')
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      visible.value = entry?.isIntersecting ?? false
      askIfNeeded()
    },
    // Start rendering a little before the card actually scrolls in.
    { rootMargin: '300px 0px' },
  )
  if (root.value) observer.observe(root.value)
})

onUnmounted(() => observer?.disconnect())

// After a commit the thumbnails are thrown away while the card stays on
// screen - no intersection change will fire, so ask again from here.
watch(() => props.previewUrl, askIfNeeded)

const label = computed(() =>
  props.page.id === props.position
    ? `Pagina ${props.position}`
    : `Pagina ${props.position} (era ${props.page.id})`,
)
</script>

<template>
  <article
    ref="root"
    class="group relative flex cursor-grab flex-col gap-2 rounded-card bg-surface p-2.5 shadow-card transition hover:shadow-lift"
    :class="{ 'opacity-35': dragging }"
    :aria-label="label"
    :data-page-id="page.id"
  >
    <!-- Where the dragged page will land: a bar in the gap on this card's side. -->
    <span
      v-if="dropSide"
      class="absolute inset-y-1.5 w-[3px] rounded-sm bg-accent"
      :class="dropSide === 'before' ? '-left-[9px]' : '-right-[9px]'"
    />

    <!--
      Square box: a page rotated a quarter turn still fits without rescaling.
      The image is absolutely positioned so its percentage limits resolve
      against the box.
    -->
    <div class="relative aspect-square overflow-hidden rounded-md bg-surface-muted">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="label"
        class="absolute inset-0 m-auto max-h-[calc(100%-20px)] max-w-[calc(100%-20px)] bg-white shadow-[0_0_0_1px_var(--color-line),0_2px_6px_#0000001a] transition-transform duration-200"
        :class="{ 'opacity-30 grayscale': page.markedForDeletion }"
        :style="{ transform: `rotate(${page.pendingRotation}deg)` }"
        draggable="false"
      />
      <div
        v-else
        class="absolute inset-0 m-auto h-[88%] w-[64%] animate-shimmer rounded-[3px] bg-linear-to-r from-surface-muted via-line to-surface-muted bg-size-[200%_100%]"
        :class="{ 'opacity-30': page.markedForDeletion }"
        aria-hidden="true"
      />

      <div
        v-if="page.markedForDeletion"
        class="absolute top-1/2 left-1/2 -translate-1/2 rounded-full bg-danger px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white"
      >
        Da eliminare
      </div>

      <div
        class="absolute right-1.5 bottom-1.5 flex gap-0.5 rounded-md bg-surface p-0.5 shadow-card transition"
        :class="
          page.markedForDeletion
            ? ''
            : 'translate-y-1 opacity-0 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 pointer-coarse:translate-y-0 pointer-coarse:opacity-100'
        "
      >
        <template v-if="!page.markedForDeletion">
          <IconButton
            icon="rotate-left"
            label="Ruota a sinistra"
            :disabled="disabled"
            @click="emit('rotate', -90)"
          />
          <IconButton
            icon="rotate-right"
            label="Ruota a destra"
            :disabled="disabled"
            @click="emit('rotate', 90)"
          />
          <IconButton
            icon="trash"
            label="Elimina pagina"
            variant="danger"
            :disabled="disabled"
            @click="emit('toggleDelete')"
          />
        </template>
        <IconButton
          v-else
          icon="restore"
          label="Ripristina pagina"
          :disabled="disabled"
          @click="emit('toggleDelete')"
        />
      </div>
    </div>

    <footer class="flex min-h-5 items-center gap-1.5 text-xs text-fg-muted">
      <span class="font-semibold text-fg">{{ position }}</span>
      <span v-if="page.id !== position" title="Posizione originale">era {{ page.id }}</span>
      <span
        v-if="page.pendingRotation"
        class="ml-auto rounded-full bg-accent-soft px-1.5 font-semibold text-accent"
      >
        {{ page.pendingRotation }}°
      </span>
    </footer>
  </article>
</template>
