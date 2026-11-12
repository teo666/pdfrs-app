<script setup lang="ts">
import { ref } from 'vue'
import type { DocumentId } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import IconButton from './IconButton.vue'
import InlineRename from './InlineRename.vue'
import { PAGE_DRAG_TYPE } from '@/lib/reorder'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const emit = defineEmits<{ open: [] }>()

// --- Pages dragged from the grid onto another document ------------------

const dropTarget = ref<DocumentId | null>(null)

/** The document whose name is being edited in place. */
const renaming = ref<DocumentId | null>(null)

const carriesPages = (event: DragEvent) =>
  event.dataTransfer?.types.includes(PAGE_DRAG_TYPE) ?? false

/** Option/Alt (or Ctrl on Windows) held while dropping copies instead of moving. */
const wantsCopy = (event: DragEvent) => event.altKey || event.ctrlKey

function onDragOver(event: DragEvent, id: DocumentId) {
  if (!carriesPages(event) || id === store.activeId) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = wantsCopy(event) ? 'copy' : 'move'
  dropTarget.value = id
}

function onDragLeave(event: DragEvent, id: DocumentId) {
  const into = event.relatedTarget as Node | null
  if (dropTarget.value === id && !(event.currentTarget as Element).contains(into)) {
    dropTarget.value = null
  }
}

function onDrop(event: DragEvent, id: DocumentId) {
  if (!carriesPages(event) || id === store.activeId) return
  event.preventDefault()
  dropTarget.value = null
  const pages = (event.dataTransfer?.getData(PAGE_DRAG_TYPE) ?? '')
    .split(',')
    .map(Number)
    .filter((page) => page > 0)
  void store.transferPages(pages, id, wantsCopy(event))
}
</script>

<template>
  <aside class="flex flex-col gap-1 overflow-y-auto border-r border-line bg-surface px-2.5 py-3.5">
    <div class="flex items-center justify-between px-1.5 pb-1.5">
      <h2 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">Documenti</h2>
      <IconButton icon="plus" label="Apri file" @click="emit('open')" />
    </div>

    <ul v-if="store.documents.length" class="flex flex-col gap-0.5">
      <li
        v-for="doc in store.documents"
        :key="doc.id"
        class="group flex items-center rounded-md transition-colors"
        :class="[
          doc.id === store.activeId ? 'bg-accent-soft text-accent' : 'hover:bg-surface-muted',
          dropTarget === doc.id ? 'ring-2 ring-accent' : '',
        ]"
        :data-doc-id="doc.id"
        @dragover="onDragOver($event, doc.id)"
        @dragleave="onDragLeave($event, doc.id)"
        @drop="onDrop($event, doc.id)"
      >
        <!-- Renaming: the field takes the place of the name; Enter or leaving it saves. -->
        <div
          v-if="renaming === doc.id"
          class="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1 pl-2"
        >
          <AppIcon name="file" />
          <InlineRename
            class="flex-1"
            :value="doc.name"
            :label="`Nuovo nome per ${doc.name}`"
            @save="(name) => (store.rename(doc.id, name), (renaming = null))"
            @cancel="renaming = null"
          />
        </div>
        <template v-else>
          <button
            class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pr-1 pl-2 text-left"
            :aria-current="doc.id === store.activeId"
            @click="store.select(doc.id)"
            @dblclick="renaming = doc.id"
          >
            <AppIcon name="file" />
            <span class="flex-1 truncate" :title="doc.name">{{ doc.name }}</span>
            <span class="flex items-center gap-1.5 text-xs text-fg-muted">
              <span
                v-if="doc.hasPendingChanges"
                class="size-[7px] rounded-full bg-warning"
                title="Modifiche non applicate"
              />
              {{ doc.pages.length }}
            </span>
          </button>
          <IconButton
            icon="pen"
            :label="`Rinomina ${doc.name}`"
            size="sm"
            class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            title="Rinomina (anche con doppio clic sul nome)"
            @click="renaming = doc.id"
          />
        </template>
        <IconButton
          icon="close"
          :label="`Chiudi ${doc.name}`"
          size="sm"
          class="mr-1 focus-visible:opacity-100"
          :class="doc.id === store.activeId ? '' : 'opacity-0 group-hover:opacity-100'"
          @click="store.close(doc.id)"
        />
      </li>
    </ul>
    <p v-else class="mx-2 my-1 text-[13px] text-fg-muted">Nessun documento aperto.</p>

    <p v-if="store.loading" class="mx-2 my-1 text-[13px] text-fg-muted">Elaborazione in corso…</p>

    <!--
      At the bottom, out of the list's way: shown when the drag starts, it
      must not push the documents down from under the pointer.
    -->
    <p
      v-if="store.draggingPages && store.documents.length > 1"
      class="mx-1.5 mt-auto rounded-md border border-dashed border-accent px-2 py-1.5 text-xs text-accent"
    >
      Rilascia su un altro documento per spostare le pagine (tieni premuto ⌥/Alt per copiarle)
    </p>
  </aside>
</template>
