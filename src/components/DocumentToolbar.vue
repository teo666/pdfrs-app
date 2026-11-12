<script setup lang="ts">
import { computed } from 'vue'

import AppButton from './AppButton.vue'
import IconButton from './IconButton.vue'
import { useEditorStore, type DocumentState } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState }>()
const store = useEditorStore()

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

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
    class="sticky top-0 z-10 flex items-center gap-x-4 gap-y-2 border-b border-line bg-canvas/88 px-6 py-3 backdrop-blur-md @max-2xl:flex-wrap @max-md:px-4"
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
  </div>
</template>
