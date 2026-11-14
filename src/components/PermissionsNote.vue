<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PdfPermissions } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import { deniedPermissions } from '@/lib/permissions'

/**
 * The restrictions of the file the document was opened from (print, copy...),
 * when it has any: what they are, and what becomes of them. A file that
 * opens without a password keeps them through the edits (with a button to
 * let them go); a copy unlocked from one with a password doesn't.
 */
const props = defineProps<{
  permissions: PdfPermissions | null | undefined
  /** The document keeps them in what it saves. */
  kept?: boolean
  /** What to say, when it doesn't keep them, about getting them back. */
  advice: string
}>()
const emit = defineEmits<{ drop: [] }>()
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
    <div class="flex flex-col items-start gap-2">
      <p>
        <span class="font-semibold text-fg">{{ t('tools.protect.current', { list }) }}</span>
        {{ kept ? t('tools.protect.keptAdvice') : advice }}
      </p>
      <button
        v-if="kept"
        type="button"
        class="cursor-pointer rounded-md border border-line bg-surface px-2 py-1 font-semibold text-fg hover:bg-surface-muted"
        @click="emit('drop')"
      >
        {{ t('tools.protect.dropRestrictions') }}
      </button>
    </div>
  </div>
</template>
