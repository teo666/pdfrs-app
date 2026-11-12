<script setup lang="ts">
import { computed } from 'vue'

import AppButton from './AppButton.vue'
import IconButton from './IconButton.vue'
import { pickFiles } from '@/lib/files'
import { useEditorStore, type DocumentState } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState }>()
const store = useEditorStore()

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

async function insert() {
  const files = await pickFiles()
  if (files.length > 0) await store.insertFiles(files)
}

const selected = computed(() => props.doc.selection.size)
const allSelected = computed(() => selected.value === props.doc.pages.length)
/** The selection's delete button restores instead when every selected page is already marked. */
const selectionAllMarked = computed(
  () =>
    selected.value > 0 &&
    props.doc.pages.every((p) => !props.doc.selection.has(p.id) || p.markedForDeletion),
)

const summary = computed(() => {
  const total = props.doc.pages.length
  const deleted = props.doc.pages.filter((p) => p.markedForDeletion).length
  const parts = [`${total} ${total === 1 ? 'pagina' : 'pagine'}`]
  if (deleted > 0) parts.push(`${deleted} da eliminare`)
  return parts.join(' · ')
})
</script>

<template>
  <div
    class="sticky top-0 z-10 flex items-center flex-wrap gap-x-4 gap-y-2 border-b border-line bg-canvas/88 px-6 py-3 backdrop-blur-md @max-md:px-4"
  >
    <!-- Wraps on the width of the workspace (the @container in EditorView), not of the window. -->
    <div class="min-w-0 flex-1 @max-2xl:basis-full">
      <h1 class="truncate text-base font-semibold" :title="doc.name">{{ doc.name }}</h1>
      <p class="text-xs text-fg-muted">
        {{ summary }}
        <span v-if="doc.hasPendingChanges" class="text-warning">· modifiche non applicate</span>
      </p>
    </div>

    <div class="flex items-center gap-1.5">
      <IconButton
        icon="undo"
        label="Annulla"
        :title="`Annulla (${mod}Z)`"
        :disabled="!doc.canUndo || doc.busy"
        @click="store.undo()"
      />
      <IconButton
        icon="redo"
        label="Ripeti"
        :title="`Ripeti (${isMac ? '⇧⌘Z' : 'Ctrl+Y'})`"
        :disabled="!doc.canRedo || doc.busy"
        @click="store.redo()"
      />
    </div>

    <div class="flex items-center gap-1.5">
      <AppButton
        icon="plus"
        :title="
          doc.selection.size
            ? 'Aggiungi le pagine di un PDF o JPEG dopo l’ultima pagina selezionata'
            : 'Aggiungi le pagine di un PDF o JPEG in fondo al documento'
        "
        :disabled="doc.busy"
        @click="insert"
      >
        Inserisci pagine
      </AppButton>
      <AppButton
        icon="check"
        title="Applica rotazioni, eliminazioni e riordino al documento"
        :disabled="!doc.hasPendingChanges || doc.busy"
        @click="store.commit()"
      >
        Applica modifiche
      </AppButton>
      <AppButton
        variant="primary"
        icon="download"
        title="Scarica il PDF con le modifiche, anche quelle non ancora applicate"
        :disabled="doc.busy"
        @click="store.download()"
      >
        Scarica
      </AppButton>
    </div>

    <!-- Actions on the selected pages, while there are any. -->
    <div
      v-if="selected > 0"
      class="flex basis-full flex-wrap items-center gap-x-3 gap-y-2 rounded-card bg-accent-soft px-3 py-2"
      role="toolbar"
      aria-label="Azioni sulle pagine selezionate"
    >
      <span class="font-semibold text-accent">
        {{ selected === 1 ? '1 pagina selezionata' : `${selected} pagine selezionate` }}
      </span>
      <button
        v-if="!allSelected"
        class="cursor-pointer text-accent underline-offset-2 hover:underline"
        @click="store.selectAll()"
      >
        Seleziona tutte
      </button>
      <button
        class="cursor-pointer text-accent underline-offset-2 hover:underline"
        title="Deseleziona (Esc)"
        @click="store.clearSelection()"
      >
        Deseleziona
      </button>

      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <IconButton
          icon="rotate-left"
          label="Ruota a sinistra le pagine selezionate"
          :disabled="doc.busy"
          @click="store.rotateSelected(-90)"
        />
        <IconButton
          icon="rotate-right"
          label="Ruota a destra le pagine selezionate"
          :disabled="doc.busy"
          @click="store.rotateSelected(90)"
        />
        <AppButton
          :icon="selectionAllMarked ? 'restore' : 'trash'"
          :title="selectionAllMarked ? undefined : 'Segna per l’eliminazione (Canc)'"
          :disabled="doc.busy"
          @click="store.toggleDeleteSelected()"
        >
          {{ selectionAllMarked ? 'Ripristina' : 'Elimina' }}
        </AppButton>
        <AppButton
          icon="file-plus"
          title="Copia le pagine selezionate, così come appaiono, in un nuovo documento"
          :disabled="doc.busy"
          @click="store.extractSelected()"
        >
          Estrai in un nuovo documento
        </AppButton>
      </div>
    </div>
  </div>
</template>
