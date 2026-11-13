<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import AppButton from '@/components/AppButton.vue'
import AppIcon from '@/components/AppIcon.vue'
import DocumentList from '@/components/DocumentList.vue'
import DocumentToolbar from '@/components/DocumentToolbar.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconButton from '@/components/IconButton.vue'
import LockedDocument from '@/components/LockedDocument.vue'
import PageGrid from '@/components/PageGrid.vue'
import PageViewer from '@/components/PageViewer.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import ToolPanel from '@/components/ToolPanel.vue'
import ToolRail from '@/components/ToolRail.vue'
import { useFileDrop } from '@/composables/useFileDrop'
import { pickFiles } from '@/lib/files'
import { THUMB_SIZE, useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { dragging } = useFileDrop((files) => store.openFiles(files))

async function openPicker() {
  const files = await pickFiles()
  if (files.length > 0) await store.openFiles(files)
}

function onKeyDown(event: KeyboardEvent) {
  // The viewer has its own keys, and editing from behind it would be invisible.
  if (store.viewerPageId !== null) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable]')) return
  const key = event.key.toLowerCase()
  const selecting = (store.active?.selection.size ?? 0) > 0

  if (!(event.metaKey || event.ctrlKey)) {
    if (key === 'escape' && selecting) {
      event.preventDefault()
      store.clearSelection()
    } else if ((key === 'delete' || key === 'backspace') && selecting) {
      event.preventDefault()
      store.toggleDeleteSelected()
    }
    return
  }

  if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    store.undo()
  } else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault()
    store.redo()
  } else if (key === 'o') {
    event.preventDefault()
    void openPicker()
  } else if (key === 'a' && store.active) {
    event.preventDefault()
    store.selectAll()
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div
    class="grid h-full grid-cols-[260px_minmax(0,1fr)_auto_auto] grid-rows-[56px_minmax(0,1fr)] [grid-template-areas:'topbar_topbar_topbar_topbar'_'sidebar_workspace_panel_rail'] max-md:grid-cols-[minmax(0,1fr)_auto] max-md:grid-rows-[56px_auto_minmax(0,1fr)] max-md:[grid-template-areas:'topbar_topbar'_'sidebar_sidebar'_'workspace_rail']"
  >
    <header
      class="flex items-center justify-between border-b border-line bg-surface pr-4 pl-5 [grid-area:topbar]"
    >
      <div class="flex items-baseline gap-3">
        <span class="text-[19px] font-medium tracking-tight">pdf<b class="text-accent">rs</b></span>
        <span class="text-[13px] text-fg-muted max-md:hidden">Editor PDF nel browser</span>
      </div>
      <div class="flex items-center gap-4">
        <!-- Card size: smaller to see more pages at once, bigger to read them. -->
        <label
          class="flex items-center gap-2 text-xs text-fg-muted"
          title="Dimensione delle anteprime"
        >
          <AppIcon name="layout-grid" :size="14" />
          <input
            v-model.number="store.thumbSize"
            type="range"
            :min="THUMB_SIZE.min"
            :max="THUMB_SIZE.max"
            step="10"
            class="w-28 cursor-pointer accent-accent max-md:w-20"
            aria-label="Dimensione delle anteprime"
          />
          <AppIcon name="image" :size="18" />
        </label>
        <ThemeSwitcher class="max-md:hidden" />
        <AppButton icon="plus" @click="openPicker">Apri file</AppButton>
      </div>
    </header>

    <DocumentList
      class="[grid-area:sidebar] max-md:max-h-[150px] max-md:border-r-0 max-md:border-b"
      @open="openPicker"
    />

    <main class="@container min-w-0 overflow-y-auto [grid-area:workspace]">
      <LockedDocument v-if="store.active?.locked" :doc="store.active" />
      <template v-else-if="store.active">
        <DocumentToolbar :doc="store.active" />
        <PageGrid :key="store.active.id" :doc="store.active" />
      </template>
      <EmptyState v-else @open="openPicker" />
    </main>

    <!--
      Tools on the right: the icon column is always there, the panel opens
      next to it. On narrow screens the panel floats over the pages.
    -->
    <ToolPanel
      class="[grid-area:panel] max-md:fixed max-md:top-14 max-md:right-[4.5rem] max-md:bottom-0 max-md:z-30 max-md:w-[min(20rem,calc(100%-5rem))] max-md:shadow-lift"
    />
    <ToolRail class="[grid-area:rail]" />

    <PageViewer
      v-if="store.active && store.viewerPageId !== null"
      :doc="store.active"
      :page-id="store.viewerPageId"
    />

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
        v-if="store.notice && !store.error"
        class="fixed inset-x-0 bottom-5 z-50 mx-auto flex w-fit max-w-[min(560px,calc(100%-32px))] items-center gap-3 rounded-card border border-line bg-surface py-2 pr-2 pl-3.5 shadow-lift"
        role="status"
      >
        <AppIcon name="check" class="text-accent" />
        <span>{{ store.notice.message }}</span>
        <AppButton
          v-if="store.notice.action"
          variant="primary"
          @click="(store.notice.action.run(), store.dismissNotice())"
        >
          {{ store.notice.action.label }}
        </AppButton>
        <IconButton icon="close" label="Chiudi avviso" @click="store.dismissNotice()" />
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
