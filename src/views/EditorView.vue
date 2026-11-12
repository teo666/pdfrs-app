<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import AppButton from '@/components/AppButton.vue'
import AppIcon from '@/components/AppIcon.vue'
import DocumentList from '@/components/DocumentList.vue'
import DocumentToolbar from '@/components/DocumentToolbar.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconButton from '@/components/IconButton.vue'
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
  <div
    class="grid h-full grid-cols-[260px_1fr] grid-rows-[56px_1fr] [grid-template-areas:'topbar_topbar'_'sidebar_workspace'] max-md:grid-cols-1 max-md:grid-rows-[56px_auto_1fr] max-md:[grid-template-areas:'topbar'_'sidebar'_'workspace']"
  >
    <header
      class="flex items-center justify-between border-b border-line bg-surface pr-4 pl-5 [grid-area:topbar]"
    >
      <div class="flex items-baseline gap-3">
        <span class="text-[19px] font-medium tracking-tight">pdf<b class="text-accent">rs</b></span>
        <span class="text-[13px] text-fg-muted max-md:hidden">Editor PDF nel browser</span>
      </div>
      <AppButton icon="plus" @click="openPicker">Apri file</AppButton>
    </header>

    <DocumentList
      class="[grid-area:sidebar] max-md:max-h-[150px] max-md:border-r-0 max-md:border-b"
      @open="openPicker"
    />

    <main class="@container min-w-0 overflow-y-auto [grid-area:workspace]">
      <template v-if="store.active">
        <DocumentToolbar :doc="store.active" />
        <PageGrid :key="store.active.id" :doc="store.active" />
      </template>
      <EmptyState v-else @open="openPicker" />
    </main>

    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
    >
      <div
        v-if="dragging"
        class="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-accent/12 backdrop-blur-[2px]"
      >
        <div
          class="flex flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed border-accent bg-surface px-12 py-8 text-base font-semibold shadow-lift"
        >
          <AppIcon name="upload" :size="32" class="text-accent" />
          Rilascia per aprire
        </div>
      </div>
    </Transition>

    <Transition
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="translate-y-2 opacity-0"
      enter-active-class="transition duration-150"
      leave-active-class="transition duration-150"
    >
      <div
        v-if="store.error"
        class="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit max-w-[min(560px,calc(100%-32px))] items-center gap-2.5 rounded-card border border-danger bg-surface py-2 pr-2 pl-3.5 text-danger shadow-lift"
        role="alert"
      >
        <AppIcon name="alert" />
        <span class="text-fg">{{ store.error }}</span>
        <IconButton icon="close" label="Chiudi" @click="store.dismissError()" />
      </div>
    </Transition>
  </div>
</template>
