<script setup lang="ts">
import { ref } from 'vue'
import type { AnnotationId } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import type { AnnotationBox, AnnotationView } from '@/stores/editor'

const props = defineProps<{
  annotations: AnnotationView[]
  /** The pending rotation the whole layer is turned by, in degrees. */
  rotation: number
  /** Size of the (unrotated) page on screen, in CSS pixels. */
  pageWidth: number
  pageHeight: number
  selectedId: AnnotationId | null
}>()

const emit = defineEmits<{
  select: [id: AnnotationId | null]
  /** A move or resize finished: one model update, so one undo step. */
  change: [id: AnnotationId, box: AnnotationBox]
  remove: [id: AnnotationId]
}>()

/** Smallest width a signature can be resized to, as a fraction of the page. */
const MIN_WIDTH = 0.03
/** While turning, angles this close to a right angle snap onto it. */
const SNAP_DEGREES = 6
/** With Shift held, the angle moves in steps of this many degrees. */
const SHIFT_STEP = 15

// While dragging, the box lives here and the model is untouched.
const draft = ref<({ id: AnnotationId } & AnnotationBox) | null>(null)

function boxOf(annotation: AnnotationView): AnnotationBox {
  return draft.value?.id === annotation.id ? draft.value : annotation
}

/** Height as a fraction of the page, from the width and the image's aspect. */
function heightOf(annotation: AnnotationView, width: number) {
  return (width * annotation.aspect * props.pageWidth) / props.pageHeight
}

/** A vector turned by `degrees` counter-clockwise: undoes a clockwise CSS rotation. */
function unrotate(dx: number, dy: number, degrees: number) {
  const r = (degrees * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos }
}

/**
 * A pointer movement on screen, in fractions along the page's own
 * (unrotated) axes: the layer is turned by `rotation`, so the delta is
 * turned back.
 */
function toPage(dx: number, dy: number) {
  const px = unrotate(dx, dy, props.rotation)
  return { x: px.x / props.pageWidth, y: px.y / props.pageHeight }
}

/** Snaps an angle onto right angles when close to one, or onto 15° steps with Shift. */
function snapAngle(degrees: number, shift: boolean) {
  if (shift) return Math.round(degrees / SHIFT_STEP) * SHIFT_STEP
  const right = Math.round(degrees / 90) * 90
  return Math.abs(degrees - right) <= SNAP_DEGREES ? right : Math.round(degrees)
}

/** An angle in (-180, 180], the form the model keeps. */
function normalize(degrees: number) {
  const turned = ((degrees % 360) + 360) % 360
  return turned > 180 ? turned - 360 : turned
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function startDrag(
  event: PointerEvent,
  annotation: AnnotationView,
  mode: 'move' | 'resize' | 'rotate',
) {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  emit('select', annotation.id)
  const target = event.currentTarget as HTMLElement
  // Capture keeps the drag going when the pointer outruns the box. It throws
  // for a pointer that isn't active (synthetic events): the drag then simply
  // works without it.
  try {
    target.setPointerCapture(event.pointerId)
  } catch {
    /* not capturable */
  }
  const start = { x: event.clientX, y: event.clientY, box: { ...boxOf(annotation) } }
  // Turning happens about the box's centre, which stays put on screen.
  const frame = (target.closest('[data-annotation]') as HTMLElement).getBoundingClientRect()
  const centre = { x: frame.left + frame.width / 2, y: frame.top + frame.height / 2 }
  let moved = false

  const onMove = (move: PointerEvent) => {
    const delta = toPage(move.clientX - start.x, move.clientY - start.y)
    if (!moved && Math.hypot(move.clientX - start.x, move.clientY - start.y) < 2) return
    moved = true
    const box = { ...start.box }
    if (mode === 'move') {
      const height = heightOf(annotation, box.width)
      box.x = clamp(start.box.x + delta.x, 0, Math.max(0, 1 - box.width))
      box.y = clamp(start.box.y + delta.y, 0, Math.max(0, 1 - height))
    } else if (mode === 'resize') {
      // The width follows the pointer along the box's own horizontal axis
      // (the box may be turned), the height follows the width (fixed
      // proportions); the top-left corner stays put.
      const onPage = unrotate(move.clientX - start.x, move.clientY - start.y, props.rotation)
      const along = unrotate(onPage.x, onPage.y, start.box.rotation).x / props.pageWidth
      const maxByHeight = ((1 - box.y) * props.pageHeight) / (annotation.aspect * props.pageWidth)
      box.width = clamp(start.box.width + along, MIN_WIDTH, Math.min(1 - box.x, maxByHeight))
    } else {
      // The handle sits above the box: the angle from the centre to the
      // pointer, plus a quarter turn, is the box's angle on screen - minus
      // the page's own pending rotation, which the box already inherits.
      const angle =
        (Math.atan2(move.clientY - centre.y, move.clientX - centre.x) * 180) / Math.PI + 90
      box.rotation = normalize(snapAngle(normalize(angle - props.rotation), move.shiftKey))
    }
    draft.value = { id: annotation.id, ...box }
  }

  const onUp = () => {
    target.removeEventListener('pointermove', onMove)
    target.removeEventListener('pointerup', onUp)
    target.removeEventListener('pointercancel', onUp)
    if (moved && draft.value) {
      const { x, y, width, rotation } = draft.value
      emit('change', annotation.id, { x, y, width, rotation })
    }
    draft.value = null
  }

  target.addEventListener('pointermove', onMove)
  target.addEventListener('pointerup', onUp)
  target.addEventListener('pointercancel', onUp)
}
</script>

<template>
  <!-- A click on the page itself (not on a signature) clears the selection. -->
  <div class="absolute inset-0" @pointerdown.self="emit('select', null)">
    <div
      v-for="annotation in annotations"
      :key="annotation.id"
      class="absolute cursor-move touch-none select-none"
      :class="
        selectedId === annotation.id
          ? 'outline-2 outline-offset-2 outline-accent outline-dashed'
          : 'hover:outline-1 hover:outline-offset-2 hover:outline-accent/70 hover:outline-dashed'
      "
      :style="{
        left: `${boxOf(annotation).x * 100}%`,
        top: `${boxOf(annotation).y * 100}%`,
        width: `${boxOf(annotation).width * 100}%`,
        transform: boxOf(annotation).rotation
          ? `rotate(${boxOf(annotation).rotation}deg)`
          : undefined,
      }"
      role="button"
      tabindex="0"
      :aria-label="`${annotation.kind === 'image' ? 'Immagine' : 'Firma'} sulla pagina${selectedId === annotation.id ? ' (selezionata)' : ''}`"
      :aria-pressed="selectedId === annotation.id"
      data-annotation
      @pointerdown="startDrag($event, annotation, 'move')"
      @focus="emit('select', annotation.id)"
    >
      <img
        :src="annotation.url"
        alt=""
        class="pointer-events-none block w-full"
        draggable="false"
      />

      <template v-if="selectedId === annotation.id">
        <button
          class="absolute -top-3 -right-3 grid size-6 cursor-pointer place-items-center rounded-full bg-danger text-white shadow-lift"
          aria-label="Rimuovi dalla pagina"
          title="Rimuovi (Canc)"
          @pointerdown.stop
          @click.stop="emit('remove', annotation.id)"
        >
          <AppIcon name="close" :size="14" />
        </button>
        <!-- Turn: a knob on a stem above the box. Double-click straightens it. -->
        <div
          class="absolute -top-7 left-1/2 flex -translate-x-1/2 cursor-grab flex-col items-center active:cursor-grabbing"
          role="slider"
          aria-label="Ruota"
          :aria-valuenow="boxOf(annotation).rotation"
          aria-valuemin="-179"
          aria-valuemax="180"
          :title="`${boxOf(annotation).rotation}° - trascina per ruotare (⇧: a passi di 15°), doppio clic per raddrizzare`"
          data-rotate
          @pointerdown="startDrag($event, annotation, 'rotate')"
          @dblclick.stop="emit('change', annotation.id, { ...boxOf(annotation), rotation: 0 })"
        >
          <span class="size-4 rounded-full border-2 border-white bg-accent shadow-lift" />
          <span class="h-3 w-0.5 bg-accent" />
        </div>
        <span
          v-if="draft?.id === annotation.id && draft.rotation !== annotation.rotation"
          class="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white"
        >
          {{ draft.rotation }}°
        </span>
        <div
          class="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-accent shadow-lift"
          role="slider"
          aria-label="Ridimensiona"
          :aria-valuenow="Math.round(boxOf(annotation).width * 100)"
          aria-valuemin="3"
          aria-valuemax="100"
          data-resize
          @pointerdown="startDrag($event, annotation, 'resize')"
        />
      </template>
    </div>
  </div>
</template>
