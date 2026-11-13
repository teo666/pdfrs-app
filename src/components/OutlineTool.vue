<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppIcon from './AppIcon.vue'
import { useEditorStore, type SelectMode } from '@/stores/editor'

/**
 * The document's outline (bookmarks) as a tree: branches open and close,
 * each entry says where its page is now - moved, marked for deletion -
 * and a click brings that page into view in the grid, selected.
 */
const store = useEditorStore()
const doc = computed(() => store.active)

watch(
  () => store.active?.id,
  (id) => {
    if (id !== undefined) void store.loadOutline(id)
  },
  { immediate: true },
)

const entries = computed(() => doc.value?.outline ?? null)

/** Entries (by index) whose branch is closed; starts as the PDF has it. */
const closed = ref(new Set<number>())
watch(
  entries,
  (list) => {
    closed.value = new Set(
      (list ?? []).flatMap((entry, index) => (hasChildren(index) && !entry.open ? [index] : [])),
    )
  },
  { immediate: true },
)

function hasChildren(index: number) {
  const list = entries.value ?? []
  return (list[index + 1]?.level ?? 0) > (list[index]?.level ?? 0)
}

/** As on the cards: Shift picks the range from the last page picked, ⌘/Ctrl adds or takes away. */
const modeOf = (event: MouseEvent): SelectMode =>
  event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'only'

function toggle(index: number) {
  const next = new Set(closed.value)
  if (!next.delete(index)) next.add(index)
  closed.value = next
}

/** Where each entry's page is now, by page id: its position, or that it's going. */
const positions = computed(
  () => new Map((doc.value?.pages ?? []).map((page, index) => [page.id, { index, page }])),
)

interface Row {
  index: number
  title: string
  level: number
  page: number | null
  /** Shown as "p. 5", "da eliminare", or nothing for an entry pointing nowhere. */
  where: string | null
  deleted: boolean
}

/** The entries to show: those not inside a closed branch. */
const rows = computed<Row[]>(() => {
  const list = entries.value ?? []
  const shown: Row[] = []
  let hiddenBelow: number | null = null
  list.forEach((entry, index) => {
    if (hiddenBelow !== null && entry.level > hiddenBelow) return
    hiddenBelow = closed.value.has(index) ? entry.level : null
    const found = entry.page == null ? undefined : positions.value.get(entry.page)
    shown.push({
      index,
      title: entry.title || 'Senza titolo',
      level: entry.level,
      page: found ? found.page.id : null,
      where: found
        ? found.page.markedForDeletion
          ? 'da eliminare'
          : `p. ${found.index + 1}`
        : null,
      deleted: found?.page.markedForDeletion ?? false,
    })
  })
  return shown
})
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    I segnalibri del documento. Fai clic su una voce per andare alla sua pagina; con Maiusc
    selezioni tutte le pagine fino a quella, con ⌘/Ctrl la aggiungi alla selezione. L’indice resta
    anche quando elimini, riordini, estrai o unisci pagine.
  </p>

  <p v-if="!doc" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    Apri un documento per vederne l’indice.
  </p>
  <p v-else-if="entries === null" class="text-[13px] text-fg-muted">Lettura dell’indice…</p>
  <p
    v-else-if="entries.length === 0"
    class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted"
  >
    Questo documento non ha un indice.
  </p>

  <ul
    v-else
    class="flex flex-col gap-0.5 select-none"
    role="tree"
    aria-label="Indice del documento"
  >
    <li
      v-for="row in rows"
      :key="row.index"
      class="flex items-center gap-1"
      role="treeitem"
      :aria-level="row.level"
      :aria-expanded="hasChildren(row.index) ? !closed.has(row.index) : undefined"
      :style="{ paddingLeft: `${(row.level - 1) * 14}px` }"
    >
      <button
        v-if="hasChildren(row.index)"
        class="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-fg-muted hover:bg-surface-muted"
        :aria-label="closed.has(row.index) ? `Apri ${row.title}` : `Chiudi ${row.title}`"
        @click="toggle(row.index)"
      >
        <AppIcon
          name="chevron-right"
          :size="14"
          class="transition-transform"
          :class="{ 'rotate-90': !closed.has(row.index) }"
        />
      </button>
      <span v-else class="size-6 shrink-0" aria-hidden="true" />
      <button
        class="flex min-w-0 flex-1 cursor-pointer items-baseline gap-2 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-surface-muted disabled:cursor-default disabled:hover:bg-transparent"
        :class="{ 'text-fg-muted': row.page === null || row.deleted }"
        :disabled="row.page === null"
        :title="row.page === null ? 'Non porta a una pagina di questo documento' : undefined"
        @click="row.page !== null && store.revealPage(row.page, modeOf($event))"
      >
        <span class="min-w-0 flex-1 truncate" :class="{ 'line-through': row.deleted }">
          {{ row.title }}
        </span>
        <span v-if="row.where" class="shrink-0 text-xs text-fg-muted">{{ row.where }}</span>
      </button>
    </li>
  </ul>
</template>
