<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'
import { useEditorStore, type ToolId } from '@/stores/editor'

const store = useEditorStore()

const tools: { id: ToolId; icon: IconName; label: string; hint: string }[] = [
  {
    id: 'sign',
    icon: 'pen',
    label: 'Firma',
    hint: 'Firma: disegna o carica una firma e mettila sulle pagine',
  },
  { id: 'merge', icon: 'merge-arrows', label: 'Unisci', hint: 'Unisci più documenti in uno' },
]
</script>

<template>
  <nav
    class="flex flex-col items-center gap-1 border-l border-line bg-surface py-3"
    aria-label="Strumenti"
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
      :title="tool.hint"
      @click="store.toggleTool(tool.id)"
    >
      <AppIcon :name="tool.icon" :size="20" />
      {{ tool.label }}
    </button>
  </nav>
</template>
