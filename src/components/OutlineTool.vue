<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PdfDocument } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
import IconButton from './IconButton.vue'
import { useEditorStore, type SelectMode } from '@/stores/editor'

/**
 * The document's outline (bookmarks) as a tree: branches open and close,
 * each entry says where its page is now - moved, marked for deletion -
 * and a click brings that page into view in the grid, selected.
 *
 * It can be edited too: the entry picked last (`current`) gets the bar of
 * commands above the tree - rename, move, indent, remove - also from the
 * keyboard (F2, Alt+arrows, Delete). Every edit is a pending one, undone
 * like the page edits. Opening or closing a branch isn't an edit, but the
 * model keeps it and writes it into the file with the next Applica
 * modifiche, so it doesn't snap back.
 */
const store = useEditorStore()
const { t } = useI18n()
const doc = computed(() => store.active)

/** The entry the commands act on: the one picked last. */
const current = ref<number | null>(null)
/** The entry whose title is being typed, and the text so far. */
const renaming = ref<number | null>(null)
const draft = ref('')
const tree = useTemplateRef<HTMLElement>('tree')

watch(
  () => store.active?.id,
  (id) => {
    if (id !== undefined) void store.loadOutline(id)
    current.value = null
    renaming.value = null
  },
  { immediate: true },
)

const entries = computed(() => doc.value?.outline ?? null)
const currentEntry = computed(() =>
  current.value === null ? null : (entries.value?.[current.value] ?? null),
)
// An undo can take the picked entry away.
watch(entries, (list) => {
  if (current.value !== null && current.value >= (list?.length ?? 0)) current.value = null
})

function hasChildren(index: number) {
  const list = entries.value ?? []
  return (list[index + 1]?.level ?? 0) > (list[index]?.level ?? 0)
}
const isClosed = (index: number) => hasChildren(index) && entries.value?.[index]?.open === false

/** As on the cards: Shift picks the range from the last page picked, ⌘/Ctrl adds or takes away. */
const modeOf = (event: MouseEvent): SelectMode =>
  event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'only'

/** Where each entry's page is now, by page id: its position, or that it's going. */
const positions = computed(
  () => new Map((doc.value?.pages ?? []).map((page, index) => [page.id, { index, page }])),
)

interface Row {
  index: number
  title: string
  level: number
  page: number | null
  /** Shown as "p. 5", "da eliminare", "link", or nothing for an entry pointing nowhere. */
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
    hiddenBelow = isClosed(index) ? entry.level : null
    const found = entry.page == null ? undefined : positions.value.get(entry.page)
    shown.push({
      index,
      title: entry.title || t('tools.outline.untitled'),
      level: entry.level,
      page: found ? found.page.id : null,
      where: found
        ? found.page.markedForDeletion
          ? t('tools.outline.deleted')
          : t('tools.outline.page', { page: found.index + 1 })
        : entry.uri
          ? t('tools.outline.link')
          : null,
      deleted: found?.page.markedForDeletion ?? false,
    })
  })
  return shown
})

// --- Editing ---------------------------------------------------------------

function pick(index: number, event: MouseEvent, page: number | null) {
  current.value = index
  if (page !== null) store.revealPage(page, modeOf(event))
}

async function focusRow(index: number) {
  await nextTick()
  tree.value?.querySelector<HTMLElement>(`[data-index="${index}"] [data-entry]`)?.focus()
}

function startRename(index: number) {
  current.value = index
  renaming.value = index
  draft.value = entries.value?.[index]?.title ?? ''
  void nextTick(() => {
    const input = tree.value?.querySelector<HTMLInputElement>('input[data-rename]')
    input?.focus()
    input?.select()
  })
}

async function finishRename(save: boolean) {
  const index = renaming.value
  if (index === null) return
  renaming.value = null
  const title = draft.value.trim()
  if (save && title) await store.editOutline((d) => d.renameOutlineEntry(index, title))
  void focusRow(index)
}

/** Runs an edit that moves the current entry, and follows it to where it lands. */
async function moveCurrent(edit: (d: PdfDocument, index: number) => Promise<number | null>) {
  const index = current.value
  if (index === null) return
  const landed = await store.editOutline((d) => edit(d, index))
  if (landed === undefined || landed === null) return
  current.value = landed
  void focusRow(landed)
}

const moveUp = () => moveCurrent((d, i) => d.moveOutlineEntry(i, -1))
const moveDown = () => moveCurrent((d, i) => d.moveOutlineEntry(i, 1))
const indent = () => moveCurrent((d, i) => d.indentOutlineEntry(i))
const outdent = () => moveCurrent((d, i) => d.outdentOutlineEntry(i))

async function remove() {
  const index = current.value
  if (index === null) return
  await store.editOutline((d) => d.removeOutlineEntry(index))
  const count = entries.value?.length ?? 0
  current.value = count === 0 ? null : Math.min(index, count - 1)
  if (current.value !== null) void focusRow(current.value)
}

/** The page a new entry points at: the first selected one, or the first page. */
const newPage = computed(() => {
  const d = doc.value
  if (!d || d.pages.length === 0) return null
  const index = Math.max(
    0,
    d.pages.findIndex((p) => d.selection.has(p.id)),
  )
  return { id: d.pages[index]!.id, position: index + 1 }
})

async function add() {
  const page = newPage.value
  if (!page) return
  const index = await store.editOutline((d) =>
    d.addOutlineEntry(t('tools.outline.newTitle', { page: page.position }), page.id),
  )
  if (index !== undefined) startRename(index)
}

function onKey(event: KeyboardEvent, index: number) {
  current.value = index
  const run = (action: () => unknown) => {
    event.preventDefault()
    // Not the grid's own shortcuts (Delete marks pages).
    event.stopPropagation()
    void action()
  }
  if (event.key === 'F2') run(() => startRename(index))
  else if (event.key === 'Delete' || event.key === 'Backspace') run(remove)
  else if (event.altKey && event.key === 'ArrowUp') run(moveUp)
  else if (event.altKey && event.key === 'ArrowDown') run(moveDown)
  else if (event.altKey && event.key === 'ArrowRight') run(indent)
  else if (event.altKey && event.key === 'ArrowLeft') run(outdent)
}

const busy = computed(() => doc.value?.busy ?? true)
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.outline.intro') }}
  </p>

  <p v-if="!doc" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.outline.noDocument') }}
  </p>
  <p v-else-if="entries === null" class="text-[13px] text-fg-muted">
    {{ t('tools.outline.loading') }}
  </p>

  <template v-else>
    <AppButton v-if="newPage" icon="plus" class="justify-center" :disabled="busy" @click="add">
      {{ t('tools.outline.add', { page: newPage.position }) }}
    </AppButton>

    <p
      v-if="entries.length === 0"
      class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted"
    >
      {{ t('tools.outline.none') }}
    </p>

    <template v-else>
      <div
        class="flex items-center gap-0.5 rounded-md bg-surface-muted p-0.5"
        role="toolbar"
        :aria-label="
          currentEntry
            ? t('tools.outline.commandsFor', { title: currentEntry.title })
            : t('tools.outline.commands')
        "
      >
        <IconButton
          icon="pen"
          :label="t('tools.outline.rename')"
          :disabled="busy || current === null"
          @click="current !== null && startRename(current)"
        />
        <IconButton
          icon="arrow-up"
          :label="t('tools.outline.moveUp')"
          :disabled="busy || current === null"
          @click="moveUp"
        />
        <IconButton
          icon="arrow-down"
          :label="t('tools.outline.moveDown')"
          :disabled="busy || current === null"
          @click="moveDown"
        />
        <IconButton
          icon="chevron-left"
          :label="t('tools.outline.outdent')"
          :disabled="busy || current === null || (currentEntry?.level ?? 1) <= 1"
          @click="outdent"
        />
        <IconButton
          icon="chevron-right"
          :label="t('tools.outline.indent')"
          :disabled="busy || current === null"
          @click="indent"
        />
        <IconButton
          icon="trash"
          variant="danger"
          class="ml-auto"
          :label="t('tools.outline.remove')"
          :disabled="busy || current === null"
          @click="remove"
        />
      </div>

      <ul
        ref="tree"
        class="flex flex-col gap-0.5 select-none"
        role="tree"
        :aria-label="t('tools.outline.tree')"
      >
        <li
          v-for="row in rows"
          :key="row.index"
          :data-index="row.index"
          class="flex items-center gap-1 rounded-md"
          :class="{ 'bg-accent-soft': current === row.index }"
          role="treeitem"
          :aria-level="row.level"
          :aria-selected="current === row.index"
          :aria-expanded="hasChildren(row.index) ? !isClosed(row.index) : undefined"
          :style="{ paddingLeft: `${(row.level - 1) * 14}px` }"
        >
          <button
            v-if="hasChildren(row.index)"
            class="grid size-6 shrink-0 cursor-pointer place-items-center rounded text-fg-muted hover:bg-surface-muted"
            :aria-label="
              t(isClosed(row.index) ? 'tools.outline.open' : 'tools.outline.close', {
                title: row.title,
              })
            "
            @click="store.setOutlineOpen(row.index, isClosed(row.index))"
          >
            <AppIcon
              name="chevron-right"
              :size="14"
              class="transition-transform"
              :class="{ 'rotate-90': !isClosed(row.index) }"
            />
          </button>
          <span v-else class="size-6 shrink-0" aria-hidden="true" />

          <input
            v-if="renaming === row.index"
            v-model="draft"
            data-rename
            class="min-w-0 flex-1 rounded-md border border-accent bg-surface px-1.5 py-0.5 text-[13px]"
            :aria-label="t('tools.outline.renameLabel')"
            @keydown.enter.prevent="finishRename(true)"
            @keydown.esc.stop.prevent="finishRename(false)"
            @blur="finishRename(true)"
          />
          <button
            v-else
            data-entry
            class="flex min-w-0 flex-1 cursor-pointer items-baseline gap-2 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-surface-muted"
            :class="{ 'text-fg-muted': row.page === null || row.deleted }"
            :title="row.page === null ? t('tools.outline.nowhere') : undefined"
            @click="pick(row.index, $event, row.page)"
            @dblclick="startRename(row.index)"
            @keydown="onKey($event, row.index)"
          >
            <span class="min-w-0 flex-1 truncate" :class="{ 'line-through': row.deleted }">
              {{ row.title }}
            </span>
            <span v-if="row.where" class="shrink-0 text-xs text-fg-muted">{{ row.where }}</span>
          </button>
        </li>
      </ul>

      <p class="text-[11px] leading-snug text-fg-muted">{{ t('tools.outline.keys') }}</p>
    </template>
  </template>
</template>
