<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PdfPermissions } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import { deniedPermissions } from '@/lib/permissions'

/**
 * The restrictions of the file the document was opened from (print, copy...),
 * when it has any: what they are, and that the edits made here drop them.
 */
const props = defineProps<{
  permissions: PdfPermissions | null | undefined
  /** What to say about getting them back. */
  advice: string
}>()
const { t, locale } = useI18n()

const denied = computed(() => (props.permissions ? deniedPermissions(props.permissions) : []))
const list = computed(() =>
  new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(
    denied.value.map((key) => t(`tools.protect.denied.${key}`)),
  ),
)
</script>

<template>
  <div
    v-if="denied.length"
    class="flex gap-2 rounded-md border border-line bg-surface-muted p-3 text-xs text-fg-muted"
    role="note"
  >
    <AppIcon name="lock" :size="14" class="mt-px shrink-0 text-fg" />
    <p>
      <span class="font-semibold text-fg">{{ t('tools.protect.current', { list }) }}</span>
      {{ advice }}
    </p>
  </div>
</template>
