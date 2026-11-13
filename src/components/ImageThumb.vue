<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'

import AppIcon from './AppIcon.vue'
import { useVisibility } from '@/composables/useVisibility'
import { useEditorStore } from '@/stores/editor'

/** A thumbnail of an image of the active document, made when it scrolls into view. */
const { imageKey } = defineProps<{ imageKey: string }>()
const store = useEditorStore()

const root = useTemplateRef<HTMLElement>('root')
const visible = useVisibility(root)
const url = ref<string | null>(null)
const failed = ref(false)

watch(
  [visible, () => imageKey],
  async ([on, key]) => {
    if (!on || url.value) return
    try {
      url.value = await store.imageThumbnail(key)
    } catch {
      failed.value = true
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    ref="root"
    class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-[repeating-conic-gradient(var(--color-surface-muted)_0_25%,var(--color-surface)_0_50%)] bg-size-[12px_12px] shadow-[0_0_0_1px_var(--color-line)]"
  >
    <img v-if="url" :src="url" alt="" class="max-h-full max-w-full object-contain" />
    <AppIcon v-else-if="failed" name="image" class="text-fg-muted" />
    <div v-else class="size-full animate-pulse bg-surface-muted" aria-hidden="true" />
  </div>
</template>
