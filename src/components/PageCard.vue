<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PageId, PageInfo } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import IconButton from './IconButton.vue'
import ImageLayer from './ImageLayer.vue'
import TextStamp from './TextStamp.vue'
import { useVisibility } from '@/composables/useVisibility'
import { partColor } from '@/lib/split'
import type { AnnotationView, PlacementView } from '@/stores/editor'

const props = defineProps<{
  page: PageInfo
  /** 1-based position in the current display order. */
  position: number
  /**
   * The document's whole thumbnail table, not this page's URL: reading the
   * entry here makes only this card depend on it, so a thumbnail arriving
   * re-renders one card instead of the parent's entire list.
   */
  previews: Record<PageId, string>
  /** The document's selection, read here for the same reason as `previews`. */
  selection: Set<PageId>
  /** Pending signatures by page, read here for the same reason as `previews`. */
  annotations: Record<PageId, AnnotationView[]>
  /** While the Dividi tool is open, the part each page goes into (0: left out). */
  splitParts: Record<PageId, number>
  /** Images drawn on each page, read here for the same reason as `previews`. */
  imagePlacements: Record<PageId, PlacementView[]>
  disabled?: boolean
}>()

const emit = defineEmits<{
  rotate: [degrees: number]
  toggleDelete: []
  /** The card is on screen and has no thumbnail yet. */
  needPreview: []
  /** Show this page full size. */
  open: []
  /** A click on the thumbnail: selects (the grid reads the modifiers). */
  pick: [event: MouseEvent]
  /** Space on the thumbnail: toggles the selection; `range` when shift was held. */
  check: [range: boolean]
}>()

const { t } = useI18n()
const root = useTemplateRef<HTMLElement>('root')
const visible = useVisibility(root)
const previewUrl = computed(() => props.previews[props.page.id])
const selected = computed(() => props.selection.has(props.page.id))
const stamps = computed(() => props.annotations[props.page.id] ?? [])
/** Images on this page waiting to be removed: struck through on the thumbnail. */
const removedImages = computed(() =>
  (props.imagePlacements[props.page.id] ?? []).filter((placement) => placement.removed),
)
/** undefined: not splitting; 0: left out of every part; n: part n. */
const part = computed(() => props.splitParts[props.page.id])
const tint = computed(() =>
  part.value
    ? { backgroundColor: `color-mix(in srgb, ${partColor(part.value)} 16%, var(--color-surface))` }
    : undefined,
)

// Asks when the card scrolls in, and again if its thumbnail is thrown away
// (after a commit) while it stays on screen.
watch([visible, previewUrl], () => {
  if (visible.value && !previewUrl.value) emit('needPreview')
})

const label = computed(() =>
  props.page.id === props.position
    ? t('app.card.page', { n: props.position })
    : t('app.card.pageMoved', { n: props.position, was: props.page.id }),
)
/** The same, inside a sentence ("Seleziona pagina 3"). */
const inlineLabel = computed(() =>
  props.page.id === props.position
    ? t('app.card.pageInline', { n: props.position })
    : t('app.card.pageInlineMoved', { n: props.position, was: props.page.id }),
)
</script>

<template>
  <!--
    content-visibility: auto lets the browser skip layout and paint of the
    cards that are off screen - with a thousand pages, reordering would
    otherwise relayout all of them. The intrinsic size is only the
    placeholder height until a card has been rendered once.
  -->
  <article
    ref="root"
    class="group relative flex cursor-grab flex-col gap-2 rounded-card bg-surface p-2.5 shadow-card transition-[box-shadow,opacity] [contain-intrinsic-size:auto_240px] [content-visibility:auto] hover:shadow-lift"
    :class="[
      selected
        ? 'ring-2 ring-accent ring-offset-2 ring-offset-canvas in-data-[drag=selection]:opacity-35'
        : '',
      part === 0 ? 'opacity-45' : '',
    ]"
    :style="tint"
    :aria-label="label"
    :data-page-id="page.id"
    :data-part="part"
  >
    <!-- Which part of a split this page goes into: a coloured bar on top. -->
    <span
      v-if="part"
      class="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-card"
      :style="{ backgroundColor: partColor(part) }"
    />
    <!--
      Square box: a page rotated a quarter turn still fits without rescaling.
      The image is absolutely positioned so its percentage limits resolve
      against the box.
    -->
    <div class="@container relative aspect-square overflow-hidden rounded-md bg-surface-muted">
      <!--
        The page and its pending signatures turn together. The box takes its
        size from the image, which is limited in container units (the box is
        square, so 100cqw is also its height) - percentages wouldn't resolve
        against a box sized by its own content.
      -->
      <div
        v-if="previewUrl"
        class="absolute top-1/2 left-1/2 transition-transform duration-200"
        :class="{ 'opacity-30 grayscale': page.markedForDeletion }"
        :style="{ transform: `translate(-50%, -50%) rotate(${page.pendingRotation}deg)` }"
      >
        <img
          :src="previewUrl"
          :alt="label"
          class="block max-h-[calc(100cqw-20px)] max-w-[calc(100cqw-20px)] bg-white shadow-[0_0_0_1px_var(--color-line),0_2px_6px_#0000001a]"
          draggable="false"
        />
        <ImageLayer v-if="removedImages.length" :placements="removedImages" />
        <template v-for="stamp in stamps" :key="stamp.id">
          <!-- Text: its box takes the laid out text's proportions (or the stretched height). -->
          <div
            v-if="stamp.text"
            class="pointer-events-none absolute"
            :style="{
              left: `${stamp.x * 100}%`,
              top: `${stamp.y * 100}%`,
              width: `${stamp.width * 100}%`,
              height: stamp.height === null ? undefined : `${stamp.height * 100}%`,
              aspectRatio: stamp.height === null ? `1 / ${stamp.aspect}` : undefined,
              transform: stamp.rotation ? `rotate(${stamp.rotation}deg)` : undefined,
            }"
            data-stamp
          >
            <TextStamp :content="stamp.text" />
          </div>
          <img
            v-else
            :src="stamp.url"
            alt=""
            class="pointer-events-none absolute"
            :style="{
              left: `${stamp.x * 100}%`,
              top: `${stamp.y * 100}%`,
              width: `${stamp.width * 100}%`,
              height: stamp.height === null ? undefined : `${stamp.height * 100}%`,
              transform: stamp.rotation ? `rotate(${stamp.rotation}deg)` : undefined,
            }"
            draggable="false"
            data-stamp
          />
        </template>
      </div>
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
        {{ t('app.card.toDelete') }}
      </div>

      <!--
        The whole thumbnail selects the page: a click toggles it, shift+click
        selects a range (the grid decides), Space toggles from the keyboard.
        Opening the full-size view is the magnifier's job (or Enter, or a
        double-click). The magnifier and the action bar sit above it.
        A div, not a <button>: Firefox won't start a drag from a button, and
        the thumbnail is where people grab the card to reorder it.
      -->
      <div
        class="absolute inset-0 cursor-pointer rounded-md"
        role="checkbox"
        tabindex="0"
        :aria-checked="selected"
        :aria-label="t('app.card.select', { page: inlineLabel })"
        @click="emit('pick', $event)"
        @dblclick="emit('open')"
        @keydown.enter.prevent="emit('open')"
        @keydown.space.prevent="emit('check', $event.shiftKey)"
      />

      <!-- Selected: a check mark, just a sign (the thumbnail itself is the control). -->
      <span
        v-if="selected"
        class="pointer-events-none absolute top-1.5 left-1.5 grid size-6 place-items-center rounded-md bg-accent text-accent-fg shadow-card"
        aria-hidden="true"
      >
        <AppIcon name="check" :size="14" />
      </span>

      <button
        class="absolute top-1.5 right-1.5 grid size-8 cursor-zoom-in place-items-center rounded-full bg-surface/95 opacity-0 shadow-card transition group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface hover:text-accent pointer-coarse:opacity-100"
        :aria-label="t('app.card.open', { page: inlineLabel })"
        :title="t('app.card.openTitle')"
        @click="emit('open')"
      >
        <AppIcon name="zoom-in" :size="18" />
      </button>

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
            :label="t('app.card.rotateLeft')"
            :disabled="disabled"
            @click="emit('rotate', -90)"
          />
          <IconButton
            icon="rotate-right"
            :label="t('app.card.rotateRight')"
            :disabled="disabled"
            @click="emit('rotate', 90)"
          />
          <IconButton
            icon="trash"
            :label="t('app.card.delete')"
            variant="danger"
            :disabled="disabled"
            @click="emit('toggleDelete')"
          />
        </template>
        <IconButton
          v-else
          icon="restore"
          :label="t('app.card.restore')"
          :disabled="disabled"
          @click="emit('toggleDelete')"
        />
      </div>
    </div>

    <footer class="flex min-h-5 items-center gap-1.5 text-xs text-fg-muted">
      <span class="font-semibold text-fg">{{ position }}</span>
      <span
        v-if="page.originalNumber != null && page.originalNumber !== position"
        :title="t('app.card.originalPosition')"
        >{{ t('app.card.was', { n: page.originalNumber }) }}</span
      >
      <span
        v-if="part"
        class="rounded-full px-1.5 font-semibold text-white"
        :style="{ backgroundColor: partColor(part) }"
      >
        {{ t('app.card.part', { n: part }) }}
      </span>
      <span v-else-if="part === 0" class="font-semibold">{{ t('app.card.excluded') }}</span>
      <span
        v-if="page.pendingRotation"
        class="ml-auto rounded-full bg-accent-soft px-1.5 font-semibold text-accent"
      >
        {{ page.pendingRotation }}°
      </span>
    </footer>
  </article>
</template>
