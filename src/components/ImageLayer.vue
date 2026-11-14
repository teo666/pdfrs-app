<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { resizeBox, unrotate, type ResizeMode } from '@/lib/box'
import type { PlacementView } from '@/stores/editor'

/**
 * The images already in a page, over its picture: each as its outline (a
 * box clipped to the image's corners, so a turned or slanted image is
 * outlined as it is). In the viewer they can be clicked; on a card only the
 * ones waiting to be removed are shown, struck through. Inside the turned
 * page div, so fractions of the page are all it needs.
 *
 * In the viewer the selected one can also be moved and resized: the box
 * drags it, the corner resizes it keeping its proportions (Shift: from the
 * centre), the sides stretch it. While dragging, the new place is drawn
 * over the page - the picture underneath only changes once it's dropped
 * (`move`), when the document is changed. Esc lets go without moving. An
 * image in a Form other pages draw too can't move: it would move there too.
 */
const {
  placements,
  interactive = false,
  selectedId = null,
  rotation = 0,
  pageWidth = 0,
  pageHeight = 0,
  ghostUrl = null,
} = defineProps<{
  placements: PlacementView[]
  interactive?: boolean
  selectedId?: string | null
  /** The pending rotation the layer is turned by, in degrees (viewer only). */
  rotation?: number
  /** Size of the (unrotated) page on screen, in CSS pixels (viewer only). */
  pageWidth?: number
  pageHeight?: number
  /** A picture of the selected image, for the place it's being dragged to. */
  ghostUrl?: string | null
}>()
const emit = defineEmits<{
  select: [id: string]
  move: [id: string, box: { x: number; y: number; width: number; height: number }]
}>()
const { t } = useI18n()

const percent = (value: number) => `${value * 100}%`

/** The corners relative to the box around them, for clip-path. */
function clip(placement: PlacementView) {
  const w = placement.width || 1
  const h = placement.height || 1
  const points = placement.corners.map(
    ([x, y]) => `${((x - placement.x) / w) * 100}% ${((y - placement.y) / h) * 100}%`,
  )
  return `polygon(${points.join(', ')})`
}

const movable = (placement: PlacementView) =>
  interactive && !placement.removed && placement.sharedPages.length === 0 && pageWidth > 0

/** Upright and not mirrored: the picture can stand in for it while it's dragged. */
const upright = (placement: PlacementView) => {
  const [topLeft, , bottomRight] = placement.corners
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-3
  return (
    near(topLeft[0], placement.x) &&
    near(topLeft[1], placement.y) &&
    near(bottomRight[0], placement.x + placement.width) &&
    near(bottomRight[1], placement.y + placement.height)
  )
}

type Box = { x: number; y: number; width: number; height: number }
/** Where the selected image is being dragged to. */
const draft = ref<(Box & { id: string }) | null>(null)
let cancelDrag: (() => void) | null = null

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function startDrag(event: PointerEvent, placement: PlacementView, mode: 'move' | ResizeMode) {
  if (event.button !== 0 || !movable(placement)) return
  event.preventDefault()
  event.stopPropagation()
  emit('select', placement.id)
  // The handles go away while dragging (the new place is drawn instead), so
  // the pointer is followed on the window, not on what was pressed.
  const start = { x: event.clientX, y: event.clientY }
  const box: Box = {
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
  }
  const page = { width: pageWidth, height: pageHeight }
  let moved = false

  const onMove = (move: PointerEvent) => {
    if (!moved && Math.hypot(move.clientX - start.x, move.clientY - start.y) < 2) return
    moved = true
    // The pointer's movement on the (unturned) page, in page pixels.
    const along = unrotate(move.clientX - start.x, move.clientY - start.y, rotation)
    if (mode === 'move') {
      draft.value = {
        id: placement.id,
        ...box,
        x: clamp(box.x + along.x / page.width, -box.width / 2, 1 - box.width / 2),
        y: clamp(box.y + along.y / page.height, -box.height / 2, 1 - box.height / 2),
      }
    } else {
      const next = resizeBox({ ...box, rotation: 0 }, mode, along, page, move.shiftKey)
      draft.value = {
        id: placement.id,
        x: next.x,
        y: next.y,
        width: next.width,
        height: next.height,
      }
    }
  }

  const finish = (keep: boolean) => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('keydown', onKey, true)
    cancelDrag = null
    if (keep && moved && draft.value) {
      const { x, y, width, height } = draft.value
      emit('move', placement.id, { x, y, width, height })
    }
    draft.value = null
  }
  const onUp = () => finish(true)
  const onCancel = () => finish(false)
  // Esc lets go without moving it - and doesn't close the viewer.
  const onKey = (key: KeyboardEvent) => {
    if (key.key !== 'Escape') return
    key.preventDefault()
    key.stopPropagation()
    finish(false)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
  window.addEventListener('keydown', onKey, true)
  cancelDrag = () => finish(false)
}

onBeforeUnmount(() => cancelDrag?.())

const dragged = computed(() =>
  draft.value ? placements.find((p) => p.id === draft.value!.id) : undefined,
)
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0"
    :data-image-layer="interactive ? 'viewer' : 'card'"
  >
    <template v-for="placement in placements" :key="placement.id">
      <div
        v-if="interactive || placement.removed"
        class="absolute"
        :class="[
          placement.removed ? 'hatch-removed' : '',
          interactive ? 'pointer-events-auto outline-2 -outline-offset-2 transition-colors' : '',
          interactive && movable(placement) && placement.id === selectedId
            ? 'cursor-move'
            : interactive
              ? 'cursor-pointer'
              : '',
          interactive && placement.id === selectedId
            ? draft?.id === placement.id
              ? 'bg-black/10 outline-accent/40'
              : 'bg-accent/20 outline-accent'
            : interactive
              ? 'outline-accent/70 outline-dashed hover:bg-accent/15'
              : '',
        ]"
        :style="{
          left: percent(placement.x),
          top: percent(placement.y),
          width: percent(placement.width),
          height: percent(placement.height),
          clipPath: clip(placement),
        }"
        :role="interactive ? 'button' : undefined"
        :aria-label="
          interactive
            ? placement.removed
              ? t('viewer.imageLayer.removed')
              : t('viewer.imageLayer.onPage')
            : undefined
        "
        :aria-pressed="interactive ? placement.id === selectedId : undefined"
        :title="
          interactive && movable(placement) && placement.id === selectedId
            ? t('viewer.imageLayer.moveTitle')
            : undefined
        "
        :data-placement="placement.id"
        @pointerdown.stop="placement.id === selectedId && startDrag($event, placement, 'move')"
        @click.stop="emit('select', placement.id)"
      />

      <!-- The selected one's handles, outside the clip so they stay whole. -->
      <div
        v-if="interactive && placement.id === selectedId && movable(placement) && !draft"
        class="pointer-events-none absolute"
        :style="{
          left: percent(placement.x),
          top: percent(placement.y),
          width: percent(placement.width),
          height: percent(placement.height),
        }"
      >
        <div
          class="pointer-events-auto absolute top-1/2 -right-2 h-7 w-2.5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-accent shadow-lift"
          role="slider"
          :aria-label="t('viewer.imageLayer.stretchX')"
          :aria-valuenow="Math.round(placement.width * 100)"
          aria-valuemin="1"
          aria-valuemax="100"
          data-image-stretch-x
          @pointerdown="startDrag($event, placement, 'stretch-x')"
        />
        <div
          class="pointer-events-auto absolute -bottom-2 left-1/2 h-2.5 w-7 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-accent shadow-lift"
          role="slider"
          :aria-label="t('viewer.imageLayer.stretchY')"
          :aria-valuenow="Math.round(placement.height * 100)"
          aria-valuemin="1"
          aria-valuemax="100"
          data-image-stretch-y
          @pointerdown="startDrag($event, placement, 'stretch-y')"
        />
        <div
          class="pointer-events-auto absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-accent shadow-lift"
          role="slider"
          :aria-label="t('viewer.imageLayer.resize')"
          :aria-valuenow="Math.round(placement.width * 100)"
          aria-valuemin="1"
          aria-valuemax="100"
          data-image-resize
          @pointerdown="startDrag($event, placement, 'resize')"
        />
      </div>
    </template>

    <!-- Where it's going: its picture (or its shape), over the page. -->
    <div
      v-if="draft && dragged"
      class="absolute outline-2 -outline-offset-2 outline-accent"
      :style="{
        left: percent(draft.x),
        top: percent(draft.y),
        width: percent(draft.width),
        height: percent(draft.height),
        clipPath: upright(dragged) ? undefined : clip(dragged),
      }"
      data-image-draft
    >
      <img
        v-if="ghostUrl && upright(dragged)"
        :src="ghostUrl"
        alt=""
        class="block size-full opacity-80"
        draggable="false"
      />
      <div v-else class="size-full bg-accent/30" />
    </div>
  </div>
</template>
