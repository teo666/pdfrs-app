<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import AppIcon from '@/components/AppIcon.vue'
import DocumentList from '@/components/DocumentList.vue'
import DocumentToolbar from '@/components/DocumentToolbar.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageGrid from '@/components/PageGrid.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { pickFiles } from '@/lib/files'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { dragging } = useFileDrop((files) => store.openFiles(files))

async function openPicker() {
  const files = await pickFiles()
  if (files.length > 0) await store.openFiles(files)
}

function onKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable]')) return
  if (!(event.metaKey || event.ctrlKey)) return
  const key = event.key.toLowerCase()
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    store.undo()
  } else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault()
    store.redo()
  } else if (key === 'o') {
    event.preventDefault()
    void openPicker()
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <div class="brand">
        <span class="logo">pdf<b>rs</b></span>
        <span class="tagline">Editor PDF nel browser</span>
      </div>
      <button class="btn" @click="openPicker">
        <AppIcon name="plus" />
        Apri file
      </button>
    </header>

    <DocumentList class="sidebar" @open="openPicker" />

    <main class="workspace">
      <template v-if="store.active">
        <DocumentToolbar :doc="store.active" />
        <PageGrid :key="store.active.id" :doc="store.active" />
      </template>
      <EmptyState v-else @open="openPicker" />
    </main>

    <Transition name="fade">
      <div v-if="dragging" class="drop-overlay">
        <div class="drop-card">
          <AppIcon name="upload" class="big" />
          Rilascia per aprire
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="store.error" class="toast" role="alert">
        <AppIcon name="alert" />
        <span>{{ store.error }}</span>
        <button class="icon-btn" title="Chiudi" @click="store.dismissError()">
          <AppIcon name="close" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-areas:
    'topbar topbar'
    'sidebar workspace';
  grid-template-rows: var(--topbar-height) 1fr;
  grid-template-columns: var(--sidebar-width) 1fr;
  height: 100%;
}

.topbar {
  grid-area: topbar;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.logo {
  font-size: 19px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.logo b {
  color: var(--accent);
}

.tagline {
  font-size: 13px;
  color: var(--text-muted);
}

.sidebar {
  grid-area: sidebar;
}

.workspace {
  grid-area: workspace;
  min-width: 0;
  overflow-y: auto;
}

.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.drop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 48px;
  border: 2px dashed var(--accent);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow-lift);
  font-size: 16px;
  font-weight: 600;
}

.big {
  width: 32px;
  height: 32px;
  color: var(--accent);
}

.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(560px, calc(100% - 32px));
  padding: 8px 8px 8px 14px;
  border: 1px solid var(--danger);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-lift);
  color: var(--danger);
  transform: translateX(-50%);
}

.toast span {
  color: var(--text);
}

.fade-enter-active,
.fade-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.fade-enter-from,
.fade-leave-to,
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

.toast-enter-from,
.toast-leave-to {
  transform: translate(-50%, 8px);
}

@media (max-width: 720px) {
  .layout {
    grid-template-areas:
      'topbar'
      'sidebar'
      'workspace';
    grid-template-rows: var(--topbar-height) auto 1fr;
    grid-template-columns: 1fr;
  }

  .tagline {
    display: none;
  }

  .sidebar {
    max-height: 150px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
</style>
