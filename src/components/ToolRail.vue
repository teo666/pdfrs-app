<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AppIcon, { type IconName } from './AppIcon.vue'
import { useEditorStore, type ToolId } from '@/stores/editor'

const store = useEditorStore()
const { t } = useI18n()

// Labels and hints come from the messages (tools.rail.<id>), so they follow the language.
const tools: { id: ToolId; icon: IconName }[] = [
  { id: 'sign', icon: 'pen' },
  { id: 'image', icon: 'image' },
  { id: 'text', icon: 'type' },
  { id: 'merge', icon: 'merge-arrows' },
  { id: 'split', icon: 'scissors' },
  { id: 'nup', icon: 'layout-grid' },
  { id: 'booklet', icon: 'book' },
  { id: 'outline', icon: 'list-tree' },
  { id: 'images', icon: 'images' },
  { id: 'protect', icon: 'lock' },
  { id: 'properties', icon: 'info' },
  { id: 'history', icon: 'history' },
]
</script>

<template>
  <nav
    class="flex min-h-0 flex-col items-center gap-1 overflow-y-auto border-l border-line bg-surface py-3"
    :aria-label="t('tools.rail.navLabel')"
  >
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="flex w-14 cursor-pointer flex-col items-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors"
      :class="
        store.activeTool === tool.id
          ? 'bg-accent-soft text-accent'
          : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
      "
      :aria-pressed="store.activeTool === tool.id"
      :title="t(`tools.rail.${tool.id}.hint`)"
      @click="store.toggleTool(tool.id)"
    >
      <AppIcon :name="tool.icon" :size="20" />
      {{ t(`tools.rail.${tool.id}.label`) }}
    </button>
  </nav>
</template>
