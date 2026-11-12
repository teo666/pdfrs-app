<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from './AppIcon.vue'
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
  <div class="toolbar">
    <div class="title">
      <h1 :title="doc.name">{{ doc.name }}</h1>
      <p>
        {{ summary }}
        <span v-if="doc.hasPendingChanges" class="pending">· modifiche non applicate</span>
      </p>
    </div>

    <div class="group">
      <button
        class="icon-btn"
        :title="`Annulla (${mod}Z)`"
        :disabled="!doc.canUndo || doc.busy"
        @click="store.undo()"
      >
        <AppIcon name="undo" />
        <span class="sr-only">Annulla</span>
      </button>
      <button
        class="icon-btn"
        :title="`Ripeti (${isMac ? '⇧⌘Z' : 'Ctrl+Y'})`"
        :disabled="!doc.canRedo || doc.busy"
        @click="store.redo()"
      >
        <AppIcon name="redo" />
        <span class="sr-only">Ripeti</span>
      </button>
    </div>

    <div class="group">
      <button
        class="btn"
        title="Applica rotazioni, eliminazioni e riordino al documento"
        :disabled="!doc.hasPendingChanges || doc.busy"
        @click="store.commit()"
      >
        <AppIcon name="check" />
        Applica modifiche
      </button>
      <button
        class="btn btn--primary"
        title="Scarica il PDF con le modifiche, anche quelle non ancora applicate"
        :disabled="doc.busy"
        @click="store.download()"
      >
        <AppIcon name="download" />
        Scarica
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(8px);
}

.title {
  flex: 1;
  min-width: 0;
}

h1 {
  margin: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

p {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.pending {
  color: var(--warning);
}

.group {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 720px) {
  .toolbar {
    flex-wrap: wrap;
    padding: 10px 16px;
  }

  .title {
    flex-basis: 100%;
  }
}
</style>
