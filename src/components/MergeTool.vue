<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DocumentId } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
import IconButton from './IconButton.vue'
import { pickFiles } from '@/lib/files'
import { useEditorStore, type DocumentState } from '@/stores/editor'

const store = useEditorStore()

/** The picked documents, in merge order. */
const picked = computed(() =>
  store.mergePicks
    .map((id) => store.documents.find((d) => d.id === id))
    .filter((d): d is DocumentState => d !== undefined),
)
/** Open documents left out of the merge. */
const others = computed(() =>
  store.documents.filter((d) => !d.locked && !store.mergePicks.includes(d.id)),
)

const pageCount = (doc: DocumentState) => doc.pages.filter((p) => !p.markedForDeletion).length
const total = computed(() => picked.value.reduce((sum, doc) => sum + pageCount(doc), 0))

async function open() {
  const files = await pickFiles()
  if (files.length === 0) return
  const before = new Set(store.documents.map((d) => d.id))
  await store.openFiles(files)
  // Newly opened documents join the merge, at the end.
  for (const doc of store.documents) if (!before.has(doc.id)) store.toggleMergePick(doc.id)
}

// --- Reordering by drag ----------------------------------------------------

const MERGE_DRAG_TYPE = 'application/x-pdfrs-merge'
const dragging = ref<DocumentId | null>(null)
/** Index in `picked` the dragged document would be dropped in front of. */
const dropIndex = ref<number | null>(null)

function onDragStart(event: DragEvent, id: DocumentId) {
  dragging.value = id
  event.dataTransfer?.setData(MERGE_DRAG_TYPE, String(id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragOver(event: DragEvent, index: number) {
  if (dragging.value === null) return
  event.preventDefault()
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropIndex.value = event.clientY < rect.top + rect.height / 2 ? index : index + 1
}

function onDrop(event: DragEvent) {
  if (dragging.value === null || dropIndex.value === null) return
  event.preventDefault()
  const from = store.mergePicks.indexOf(dragging.value)
  // The index counts the dragged document too; moveMergePick counts without it.
  store.moveMergePick(
    dragging.value,
    dropIndex.value > from ? dropIndex.value - 1 : dropIndex.value,
  )
  onDragEnd()
}

function onDragEnd() {
  dragging.value = null
  dropIndex.value = null
}
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    I documenti sono uniti così come appaiono ora (riordini, rotazioni, eliminazioni e firme
    comprese), nell’ordine della lista. Il risultato si apre come nuovo documento; gli originali
    restano aperti.
  </p>

  <section class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">
      Da unire, in quest’ordine
    </h3>
    <p v-if="picked.length === 0" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
      Nessun documento: aggiungine almeno due dall’elenco qui sotto.
    </p>
    <ol class="flex flex-col gap-1.5" @dragleave.self="dropIndex = null">
      <li
        v-for="(doc, index) in picked"
        :key="doc.id"
        class="relative flex cursor-grab items-center gap-2 rounded-md border border-line bg-surface px-2 py-1.5 active:cursor-grabbing"
        :class="{ 'opacity-40': dragging === doc.id }"
        draggable="true"
        :data-merge-id="doc.id"
        @dragstart="onDragStart($event, doc.id)"
        @dragover="onDragOver($event, index)"
        @drop="onDrop"
        @dragend="onDragEnd"
      >
        <span
          v-if="dropIndex === index"
          class="pointer-events-none absolute inset-x-0 -top-1 h-0.5 rounded bg-accent"
        />
        <span
          v-if="dropIndex === index + 1 && index === picked.length - 1"
          class="pointer-events-none absolute inset-x-0 -bottom-1 h-0.5 rounded bg-accent"
        />
        <AppIcon name="grip" :size="16" class="text-fg-muted" />
        <span
          class="grid size-5 shrink-0 place-items-center rounded bg-accent text-[11px] font-bold text-accent-fg"
        >
          {{ index + 1 }}
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[13px]" :title="doc.name">{{ doc.name }}</span>
          <span class="text-xs text-fg-muted">
            {{ pageCount(doc) === 1 ? '1 pagina' : `${pageCount(doc)} pagine` }}
          </span>
        </span>
        <IconButton
          icon="arrow-up"
          size="sm"
          :label="`Sposta su ${doc.name}`"
          :disabled="index === 0"
          @click="store.moveMergePick(doc.id, index - 1)"
        />
        <IconButton
          icon="arrow-down"
          size="sm"
          :label="`Sposta giù ${doc.name}`"
          :disabled="index === picked.length - 1"
          @click="store.moveMergePick(doc.id, index + 1)"
        />
        <IconButton
          icon="close"
          size="sm"
          :label="`Togli ${doc.name} dall’unione`"
          @click="store.toggleMergePick(doc.id)"
        />
      </li>
    </ol>
  </section>

  <section v-if="others.length" class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">
      Altri documenti aperti
    </h3>
    <ul class="flex flex-col gap-1">
      <li v-for="doc in others" :key="doc.id">
        <button
          class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-surface-muted"
          :aria-label="`Aggiungi ${doc.name} all’unione`"
          @click="store.toggleMergePick(doc.id)"
        >
          <AppIcon name="plus" :size="16" class="text-accent" />
          <span class="truncate">{{ doc.name }}</span>
        </button>
      </li>
    </ul>
  </section>

  <AppButton icon="plus" class="justify-center" @click="open">Apri altri file da unire</AppButton>

  <AppButton
    variant="primary"
    class="justify-center"
    :disabled="picked.length < 2"
    @click="store.mergePicked()"
  >
    {{
      picked.length < 2
        ? 'Scegli almeno due documenti'
        : `Unisci ${picked.length} documenti (${total} pagine)`
    }}
  </AppButton>
</template>
