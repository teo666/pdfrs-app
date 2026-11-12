<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <aside class="sidebar">
    <div class="head">
      <h2>Documenti</h2>
      <button class="icon-btn" title="Apri file" @click="emit('open')">
        <AppIcon name="plus" />
        <span class="sr-only">Apri file</span>
      </button>
    </div>

    <ul v-if="store.documents.length" class="list">
      <li
        v-for="doc in store.documents"
        :key="doc.id"
        :class="{ active: doc.id === store.activeId }"
      >
        <button class="item" :aria-current="doc.id === store.activeId" @click="store.select(doc.id)">
          <AppIcon name="file" />
          <span class="name" :title="doc.name">{{ doc.name }}</span>
          <span class="meta">
            <span v-if="doc.hasPendingChanges" class="dot" title="Modifiche non applicate" />
            {{ doc.pages.length }}
          </span>
        </button>
        <button class="icon-btn close" :title="`Chiudi ${doc.name}`" @click="store.close(doc.id)">
          <AppIcon name="close" />
          <span class="sr-only">Chiudi {{ doc.name }}</span>
        </button>
      </li>
    </ul>
    <p v-else class="empty">Nessun documento aperto.</p>

    <p v-if="store.loading" class="loading">Apertura in corso…</p>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 10px;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  background: var(--surface);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 6px;
}

h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
}

li:hover {
  background: var(--surface-2);
}

li.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.item {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 4px 8px 8px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--warning);
}

.close {
  width: 26px;
  height: 26px;
  margin-right: 4px;
  opacity: 0;
}

li:hover .close,
li.active .close,
.close:focus-visible {
  opacity: 1;
}

.empty,
.loading {
  margin: 4px 8px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
