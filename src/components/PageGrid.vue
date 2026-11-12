<script setup lang="ts">
import { ref } from 'vue'
import type { PageId } from 'pdfrs-editor'

import PageCard from './PageCard.vue'
import { dropTargetIndex, type DropSide } from '@/lib/reorder'
import { useEditorStore, type DocumentState } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState }>()
const store = useEditorStore()

// Native HTML5 drag & drop. The model is only touched once, on drop; while
// dragging, a bar on the hovered card's side shows where the page will land.
const draggedId = ref<PageId | null>(null)
const target = ref<{ index: number; side: DropSide } | null>(null)

function onDragStart(event: DragEvent, id: PageId) {
  if (props.doc.busy || !event.dataTransfer) return
  draggedId.value = id
  event.dataTransfer.effectAllowed = 'move'
  // Some browsers won't start a drag without data; this type also keeps the
  // window-level file drop overlay from reacting (it only looks at "Files").
  event.dataTransfer.setData('application/x-pdfrs-page', String(id))
}

function onDragOver(event: DragEvent, index: number) {
  if (draggedId.value === null) return
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const side: DropSide = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
  target.value = { index, side }
}

function onDrop(event: DragEvent) {
  if (draggedId.value === null || !target.value) return
  event.preventDefault()
  const fromIndex = props.doc.pages.findIndex((p) => p.id === draggedId.value)
  const toIndex = dropTargetIndex(fromIndex, target.value.index, target.value.side)
  if (fromIndex !== -1 && toIndex !== fromIndex) store.move(draggedId.value, toIndex)
  onDragEnd()
}

function onDragEnd() {
  draggedId.value = null
  target.value = null
}
</script>

<template>
  <TransitionGroup
    tag="div"
    name="reorder"
    class="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-[18px] px-6 pt-5 pb-10 @max-md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] @max-md:gap-3 @max-md:px-4"
    @dragleave.self="target = null"
  >
    <PageCard
      v-for="(page, index) in doc.pages"
      :key="page.id"
      :page="page"
      :position="index + 1"
      :preview-url="doc.previews[page.id]"
      :disabled="doc.busy"
      :dragging="draggedId === page.id"
      :drop-side="target?.index === index && draggedId !== page.id ? target.side : null"
      :draggable="!doc.busy"
      @dragstart="onDragStart($event, page.id)"
      @dragover="onDragOver($event, index)"
      @drop="onDrop"
      @dragend="onDragEnd"
      @rotate="store.rotate(page.id, $event)"
      @toggle-delete="store.toggleDelete(page.id)"
      @need-preview="store.requestPreview(doc.id, page.id)"
    />
  </TransitionGroup>
</template>

<style scoped>
/* FLIP animation of the cards when the order changes (TransitionGroup). */
.reorder-move {
  transition: transform 0.25s ease;
}
</style>
