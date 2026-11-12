<script setup lang="ts">
import { nextTick, reactive, useTemplateRef } from 'vue'
import type { PageId } from 'pdfrs-editor'

import DropIndicator, { type DropIndicatorState } from './DropIndicator.vue'
import PageCard from './PageCard.vue'
import { dropTargetIndex, type DropSide } from '@/lib/reorder'
import { useEditorStore, type DocumentState } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState }>()
const store = useEditorStore()
const grid = useTemplateRef<HTMLElement>('grid')

/*
 * Drag & drop has to stay cheap on documents with a thousand pages:
 * `dragover` fires continuously, even with the pointer standing still.
 * So a drag never re-renders the list. The drag state lives in plain
 * variables, the dragged card is dimmed straight on its element, and the
 * only reactive piece is the drop indicator - its own component, updated
 * only when the target slot actually changes. The model is touched once,
 * on drop.
 */
let dragged: { id: PageId; el: HTMLElement } | null = null
let target: { index: number; side: DropSide } | null = null
const indicator = reactive<DropIndicatorState>({ visible: false, left: 0, top: 0, height: 0 })

const DRAGGED_CLASS = 'opacity-35'

function onDragStart(event: DragEvent, id: PageId) {
  if (props.doc.busy || !event.dataTransfer) return
  const el = event.currentTarget as HTMLElement
  dragged = { id, el }
  el.classList.add(DRAGGED_CLASS)
  event.dataTransfer.effectAllowed = 'move'
  // Some browsers won't start a drag without data; this type also keeps the
  // window-level file drop overlay from reacting (it only looks at "Files").
  event.dataTransfer.setData('application/x-pdfrs-page', String(id))
}

function onDragOver(event: DragEvent, index: number) {
  if (!dragged) return
  event.preventDefault()
  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const side: DropSide = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
  if (target?.index === index && target.side === side) return
  target = { index, side }

  if (card === dragged.el) {
    indicator.visible = false
    return
  }
  // A bar centred in the gap on that side of the card. Offsets are relative
  // to the grid, which is the cards' offsetParent.
  const gap = parseFloat(getComputedStyle(grid.value!).columnGap) || 0
  const x =
    side === 'before' ? card.offsetLeft - gap / 2 : card.offsetLeft + card.offsetWidth + gap / 2
  Object.assign(indicator, {
    visible: true,
    left: x - 1.5,
    top: card.offsetTop + 6,
    height: card.offsetHeight - 12,
  })
}

function onDrop(event: DragEvent) {
  if (!dragged || !target) return
  event.preventDefault()
  const id = dragged.id
  const fromIndex = props.doc.pages.findIndex((p) => p.id === id)
  const toIndex = dropTargetIndex(fromIndex, target.index, target.side)
  onDragEnd()
  if (fromIndex !== -1 && toIndex !== fromIndex) {
    void animateReorder(fromIndex, toIndex, () => store.move(id, toIndex))
  }
}

/** The pointer left the grid for its padding or outside: no slot is targeted. */
function onGridLeave() {
  target = null
  indicator.visible = false
}

function onDragEnd() {
  dragged?.el.classList.remove(DRAGGED_CLASS)
  dragged = null
  target = null
  indicator.visible = false
}

/**
 * FLIP animation of a move, limited to what can actually be seen: only the
 * cards between the old and the new position shift, and of those only the
 * ones inside the scroll viewport get measured and animated. (TransitionGroup
 * would measure every card on every update - hundreds of layout reads.)
 */
async function animateReorder(fromIndex: number, toIndex: number, apply: () => void) {
  const container = grid.value
  const viewport = container?.closest('main')?.getBoundingClientRect()
  if (!container || !viewport) return apply()

  const cards = container.querySelectorAll<HTMLElement>(':scope > article')
  const first = new Map<HTMLElement, DOMRect>()
  for (let i = Math.min(fromIndex, toIndex); i <= Math.max(fromIndex, toIndex); i++) {
    const card = cards[i]
    if (!card) continue
    const rect = card.getBoundingClientRect()
    if (rect.top > viewport.bottom) break // row-major order: everything after is below too
    if (rect.bottom >= viewport.top) first.set(card, rect)
  }

  apply()
  await nextTick()

  const moved: HTMLElement[] = []
  for (const [card, before] of first) {
    const after = card.getBoundingClientRect()
    const dx = before.left - after.left
    const dy = before.top - after.top
    if (!dx && !dy) continue
    card.style.transition = 'none'
    card.style.transform = `translate(${dx}px, ${dy}px)`
    moved.push(card)
  }
  if (moved.length === 0) return
  void container.offsetWidth // commit the inverted positions before animating back
  for (const card of moved) {
    card.style.transition = 'transform 250ms ease'
    card.style.transform = ''
    card.addEventListener('transitionend', () => (card.style.transition = ''), { once: true })
  }
}
</script>

<template>
  <div
    ref="grid"
    class="relative grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-[18px] px-6 pt-5 pb-10 @max-md:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] @max-md:gap-3 @max-md:px-4"
    @dragleave.self="onGridLeave"
  >
    <!--
      v-memo: a card whose page object, position and busy state are unchanged
      reuses its previous vnode, so after a move Vue only diffs the cards that
      actually shifted instead of all of them. (`page` keeps its identity when
      unchanged, see sync() in the store; thumbnails are read inside the card.)
    -->
    <PageCard
      v-for="(page, index) in doc.pages"
      :key="page.id"
      v-memo="[page, index, doc.busy, doc.previews]"
      :page="page"
      :position="index + 1"
      :previews="doc.previews"
      :disabled="doc.busy"
      :draggable="!doc.busy"
      @dragstart="onDragStart($event, page.id)"
      @dragover="onDragOver($event, index)"
      @drop="onDrop"
      @dragend="onDragEnd"
      @rotate="store.rotate(page.id, $event)"
      @toggle-delete="store.toggleDelete(page.id)"
      @need-preview="store.requestPreview(doc.id, page.id)"
      @open="store.openViewer(page.id)"
    />
    <DropIndicator :state="indicator" />
  </div>
</template>
