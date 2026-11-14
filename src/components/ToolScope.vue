<script setup lang="ts">
import { computed } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

import { useEditorStore } from '@/stores/editor'

/**
 * Says what a tool is about to work on: the selected pages, or the whole
 * document as it looks now (pages marked for deletion left out).
 */
const store = useEditorStore()
const { t } = useI18n()

const scope = computed(() => {
  const doc = store.active
  if (!doc) return null
  const selected = doc.selection.size
  const shown = doc.pages.filter((p) => !p.markedForDeletion).length
  return selected > 0
    ? { count: selected, text: t('tools.scope.selected', selected) }
    : { count: shown, text: t('tools.scope.all', shown) }
})

defineExpose({ scope })
</script>

<template>
  <p v-if="scope" class="rounded-md bg-surface-muted px-3 py-2 text-[13px]">
    <I18nT keypath="tools.scope.appliesTo" scope="global">
      <template #target>
        <strong>{{ scope.text }}</strong>
      </template>
    </I18nT>
    <!-- The line break above renders as nothing: the gap is a margin. -->
    <span v-if="!store.active?.selection.size" class="ml-1 text-fg-muted">
      {{ t('tools.scope.hint') }}
    </span>
  </p>
</template>
