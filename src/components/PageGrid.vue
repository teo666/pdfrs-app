<script setup lang="ts">
import { nextTick, reactive, useTemplateRef } from 'vue'
import type { PageId } from 'pdfrs-editor'

import DropIndicator, { type DropIndicatorState } from './DropIndicator.vue'
import PageCard from './PageCard.vue'
import { blockDropIndex, PAGE_DRAG_TYPE, type DropSide } from '@/lib/reorder'
import { useEditorStore, type DocumentState } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState }>()
const store = useEditorStore()
const grid = useTemplateRef<HTMLElement>('grid')

/*
 * Drag & drop has to stay cheap on documents with a thousand pages:
 * `dragover` fires continuously, even with the pointer standing still.
 * So a drag never re-renders the list. The drag state lives in plain
 * variables, the dragged cards are dimmed straight in the DOM (a class on
 * the card, or a data attribute on the grid for a whole selection), and the
 * only reactive piece is the drop indicator - its own component, updated
 * only when the target slot actually changes. The model is touched once,
 * on drop.
 */
let dragged: { ids: PageId[]; el: HTMLElement } | null = null
let target: { index: number; side: DropSide } | null = null
const indicator = reactive<DropIndicatorState>({ visible: false, left: 0, top: 0, height: 0 })

const DRAGGED_CLASS = 'opacity-35'

function onDragStart(event: DragEvent, id: PageId) {
  if (props.doc.busy || !event.dataTransfer) return
  const el = event.currentTarget as HTMLElement
  const { selection } = props.doc
  // Grabbing a selected page drags the whole selection; grabbing any other
  // page drags just that one, leaving the selection alone.
  const block = selection.has(id) && selection.size > 1
  const ids = block ? props.doc.pages.filter((p) => selection.has(p.id)).map((p) => p.id) : [id]
  dragged = { ids, el }
  // Copy is allowed too: dropped on another document with Alt held.
  event.dataTransfer.effectAllowed = 'copyMove'
  // The ids travel with the drag for the sidebar's documents to read. This
  // type also keeps the window-level file drop overlay from reacting (it
  // only looks at "Files").
  event.dataTransfer.setData(PAGE_DRAG_TYPE, ids.join(','))
  store.draggingPages = true
  if (block) {
    grid.value?.setAttribute('data-drag', 'selection') // dims every selected card, see PageCard
    setCountDragImage(event.dataTransfer, ids.length)
  } else {
    el.classList.add(DRAGGED_CLASS)
  }
}

/** For a multi-page drag, a "12 pagine" label follows the pointer instead of one card's picture. */
function setCountDragImage(transfer: DataTransfer, count: number) {
  const label = document.createElement('div')
  label.textContent = `${count} pagine`
  label.className =
    'fixed -top-96 left-0 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg shadow-lift'
  document.body.append(label)
  transfer.setDragImage(label, 12, 12)
  // The browser takes its snapshot synchronously; the element can go.
  requestAnimationFrame(() => label.remove())
}

/**
 * A click on a thumbnail: opens the viewer, unless a selection is in
 * progress or a modifier asks for selecting - then it selects instead
 * (shift: everything from the last clicked page; Cmd/Ctrl: toggle).
 */
function onPick(event: MouseEvent, id: PageId) {
  if (event.shiftKey) store.selectPage(id, 'range')
  else if (event.metaKey || event.ctrlKey || props.doc.selection.size > 0) {
    store.selectPage(id, 'toggle')
  } else store.openViewer(id)
}

function onDragOver(event: DragEvent, index: number, id: PageId) {
  if (!dragged) return
  event.preventDefault()
  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const side: DropSide = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
  if (target?.index === index && target.side === side) return
  target = { index, side }

  // Dropping next to a page that is itself being moved: shown as no slot.
  if (dragged.ids.includes(id)) {
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
  const { ids } = dragged
  const order = props.doc.pages.map((p) => p.id)
  const moving = new Set(ids)
  // On a page that is itself moving there's no indicator, so no drop either.
  if (moving.has(order[target.index]!)) return onDragEnd()
  const toIndex = blockDropIndex(order, moving, target.index, target.side)
  const insertAt = target.side === 'before' ? target.index : target.index + 1
  onDragEnd()
  // Every card between the first moving page and the drop slot can shift.
  const indexes = ids.map((id) => order.indexOf(id))
  const lo = Math.min(insertAt, ...indexes)
  const hi = Math.max(insertAt - 1, ...indexes)
  void animateReorder(lo, hi, () => store.movePages(ids, toIndex))
}

/** The pointer left the grid for its padding or outside: no slot is targeted. */
function onGridLeave() {
  target = null
  indicator.visible = false
}

function onDragEnd() {
  store.draggingPages = false
  dragged?.el.classList.remove(DRAGGED_CLASS)
  grid.value?.removeAttribute('data-drag')
  dragged = null
  target = null
  indicator.visible = false
}

/**
 * FLIP animation of a move, limited to what can actually be seen: only the
 * cards with an index in `lo..hi` can shift, and of those only the ones
 * inside the scroll viewport get measured and animated. (TransitionGroup
 * would measure every card on every update - hundreds of layout reads.)
 */
async function animateReorder(lo: number, hi: number, apply: () => void) {
  const container = grid.value
  const viewport = container?.closest('main')?.getBoundingClientRect()
  if (!container || !viewport) return apply()

  const cards = container.querySelectorAll<HTMLElement>(':scope > article')
  const first = new Map<HTMLElement, DOMRect>()
  for (let i = lo; i <= hi; i++) {
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
    :data-selecting="doc.selection.size > 0 || undefined"
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
      v-memo="[page, index, doc.busy, doc.previews, doc.selection]"
      :page="page"
      :position="index + 1"
      :previews="doc.previews"
      :selection="doc.selection"
      :disabled="doc.busy"
      :draggable="!doc.busy"
      @dragstart="onDragStart($event, page.id)"
      @dragover="onDragOver($event, index, page.id)"
      @drop="onDrop"
      @dragend="onDragEnd"
      @rotate="store.rotate(page.id, $event)"
      @toggle-delete="store.toggleDelete(page.id)"
      @need-preview="store.requestPreview(doc.id, page.id)"
      @open="store.openViewer(page.id)"
      @pick="onPick($event, page.id)"
      @check="store.selectPage(page.id, $event ? 'range' : 'toggle')"
    />
    <DropIndicator :state="indicator" />
  </div>
</template>
