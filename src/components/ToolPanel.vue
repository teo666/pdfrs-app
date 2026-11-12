<script setup lang="ts">
import { computed } from 'vue'

import IconButton from './IconButton.vue'
import MergeTool from './MergeTool.vue'
import SignTool from './SignTool.vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

const titles = { sign: 'Firma', merge: 'Unisci documenti' } as const
const title = computed(() => (store.activeTool ? titles[store.activeTool] : ''))
</script>

<template>
  <aside
    v-if="store.activeTool"
    class="flex w-80 flex-col overflow-hidden border-l border-line bg-surface"
    :aria-label="title"
  >
    <header class="flex items-center justify-between border-b border-line px-4 py-3">
      <h2 class="text-sm font-semibold">{{ title }}</h2>
      <IconButton icon="close" label="Chiudi il pannello" @click="store.activeTool = null" />
    </header>
    <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <SignTool v-if="store.activeTool === 'sign'" />
      <MergeTool v-else-if="store.activeTool === 'merge'" />
    </div>
  </aside>
</template>
