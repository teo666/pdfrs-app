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

// While dragging, the box lives here and the model is untouched.
const draft = ref<({ id: AnnotationId } & AnnotationBox) | null>(null)

function boxOf(annotation: AnnotationView): AnnotationBox {
  return draft.value?.id === annotation.id ? draft.value : annotation
}

/** Height as a fraction of the page, from the width and the image's aspect. */
function heightOf(annotation: AnnotationView, width: number) {
  return (width * annotation.aspect * props.pageWidth) / props.pageHeight
}

/**
 * A pointer movement on screen, expressed in the page's own (unrotated)
 * axes: the layer is turned by `rotation`, so the delta is turned back.
 */
function toPage(dx: number, dy: number) {
  const r = (props.rotation * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  return {
    x: (dx * cos + dy * sin) / props.pageWidth,
    y: (-dx * sin + dy * cos) / props.pageHeight,
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function startDrag(event: PointerEvent, annotation: AnnotationView, mode: 'move' | 'resize') {
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
    } else {
      // The top-left corner stays put; the width follows the pointer and
      // the height follows the width (the image keeps its proportions).
      const maxByHeight = ((1 - box.y) * props.pageHeight) / (annotation.aspect * props.pageWidth)
      box.width = clamp(start.box.width + delta.x, MIN_WIDTH, Math.min(1 - box.x, maxByHeight))
    }
    draft.value = { id: annotation.id, ...box }
  }

  const onUp = () => {
    target.removeEventListener('pointermove', onMove)
    target.removeEventListener('pointerup', onUp)
    target.removeEventListener('pointercancel', onUp)
    if (moved && draft.value) {
      const { x, y, width } = draft.value
      emit('change', annotation.id, { x, y, width })
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
      }"
      role="button"
      tabindex="0"
      :aria-label="`Firma sulla pagina${selectedId === annotation.id ? ' (selezionata)' : ''}`"
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
          aria-label="Rimuovi la firma"
          title="Rimuovi (Canc)"
          @pointerdown.stop
          @click.stop="emit('remove', annotation.id)"
        >
          <AppIcon name="close" :size="14" />
        </button>
        <div
          class="absolute -right-2 -bottom-2 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-accent shadow-lift"
          role="slider"
          aria-label="Ridimensiona la firma"
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
