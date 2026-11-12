<script setup lang="ts">
import { computed } from 'vue'

import { useEditorStore } from '@/stores/editor'

/**
 * Says what a tool is about to work on: the selected pages, or the whole
 * document as it looks now (pages marked for deletion left out).
 */
const store = useEditorStore()

const scope = computed(() => {
  const doc = store.active
  if (!doc) return null
  const selected = doc.selection.size
  const shown = doc.pages.filter((p) => !p.markedForDeletion).length
  return selected > 0
    ? {
        count: selected,
        text: selected === 1 ? 'alla pagina selezionata' : `alle ${selected} pagine selezionate`,
      }
    : { count: shown, text: shown === 1 ? 'all’unica pagina' : `a tutte le ${shown} pagine` }
})

defineExpose({ scope })
</script>

<template>
  <p v-if="scope" class="rounded-md bg-surface-muted px-3 py-2 text-[13px]">
    Si applica <strong>{{ scope.text }}</strong
    ><span v-if="!store.active?.selection.size" class="text-fg-muted">
      (seleziona delle pagine per usarne solo alcune)</span
    >
  </p>
</template>
