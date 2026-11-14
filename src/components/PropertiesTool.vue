<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MetadataField } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import PermissionsNote from './PermissionsNote.vue'
import { formatPdfDate, fromDatetimeLocal, parsePdfDate, toDatetimeLocal } from '@/lib/pdfDate'
import { useEditorStore } from '@/stores/editor'

/**
 * The document's properties - what PDF readers show as its title, author
 * and so on. Each field is saved when it's left (or on Enter), as a pending
 * edit like any other: undoable, written by Applica modifiche or Scarica.
 * An emptied field is removed from the document.
 */
const store = useEditorStore()
const { t } = useI18n()
const doc = computed(() => store.active)

// Read the first time they're wanted, for whichever document is on show.
watch(
  () => store.active?.id,
  (id) => {
    if (id === undefined) return
    void store.loadMetadata(id)
    void store.loadPermissions(id)
  },
  { immediate: true },
)

type TextField = { field: MetadataField; label: string; hint?: string; placeholder?: string }
const textFields = computed<TextField[]>(() => [
  {
    field: 'title',
    label: t('tools.properties.fields.title'),
    hint: t('tools.properties.hints.title'),
  },
  { field: 'author', label: t('tools.properties.fields.author') },
  { field: 'subject', label: t('tools.properties.fields.subject') },
  {
    field: 'keywords',
    label: t('tools.properties.fields.keywords'),
    placeholder: t('tools.properties.keywordsPlaceholder'),
  },
  {
    field: 'creator',
    label: t('tools.properties.fields.creator'),
    hint: t('tools.properties.hints.creator'),
  },
  {
    field: 'producer',
    label: t('tools.properties.fields.producer'),
    hint: t('tools.properties.hints.producer'),
  },
])
const dateFields = computed<{ field: MetadataField; label: string }[]>(() => [
  { field: 'creationDate', label: t('tools.properties.fields.creationDate') },
  { field: 'modDate', label: t('tools.properties.fields.modDate') },
])
const allFields: MetadataField[] = [
  'title',
  'author',
  'subject',
  'keywords',
  'creator',
  'producer',
  'creationDate',
  'modDate',
]

const value = (field: MetadataField) => doc.value?.metadata?.[field] ?? ''
const pending = (field: MetadataField) => doc.value?.pendingMetadata.includes(field) ?? false

/** A date the field can show, or '' (absent, or not a date it can read). */
const dateValue = (field: MetadataField) => {
  const date = parsePdfDate(value(field))
  return date ? toDatetimeLocal(date) : ''
}
/** A date the document holds but that isn't in a form the field can show. */
const unreadable = (field: MetadataField) => value(field) !== '' && dateValue(field) === ''

function saveText(field: MetadataField, event: Event) {
  const text = (event.target as HTMLInputElement).value.trim()
  void store.setMetadata({ [field]: text === '' ? null : text })
}

function saveDate(field: MetadataField, event: Event) {
  const input = (event.target as HTMLInputElement).value
  if (input === '') return void store.setMetadata({ [field]: null })
  const date = fromDatetimeLocal(input)
  if (date) void store.setMetadata({ [field]: date })
}

const empty = computed(() => Object.keys(doc.value?.metadata ?? {}).length === 0)

function clearAll() {
  void store.setMetadata(Object.fromEntries(allFields.map((field) => [field, null])))
}

const blurOnEnter = (event: KeyboardEvent) => (event.target as HTMLInputElement).blur()
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.properties.intro') }}
  </p>

  <p v-if="!doc" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.properties.noDocument') }}
  </p>
  <p v-else-if="!doc.metadata" class="text-[13px] text-fg-muted">
    {{ t('tools.properties.loading') }}
  </p>

  <template v-else>
    <PermissionsNote :permissions="doc.permissions" :advice="t('tools.properties.permissionsAdvice')" />

    <label v-for="item in textFields" :key="item.field" class="flex flex-col gap-1">
      <span class="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
        {{ item.label }}
        <span v-if="pending(item.field)" class="font-normal text-warning">{{
          t('tools.properties.modified')
        }}</span>
      </span>
      <input
        :value="value(item.field)"
        type="text"
        :placeholder="item.placeholder"
        class="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
        :disabled="doc.busy"
        @change="saveText(item.field, $event)"
        @keydown.enter="blurOnEnter"
      />
      <span v-if="item.hint" class="text-xs text-fg-muted">{{ item.hint }}</span>
    </label>

    <div class="flex flex-col gap-4">
      <label v-for="item in dateFields" :key="item.field" class="flex min-w-0 flex-col gap-1">
        <span class="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
          {{ item.label }}
          <span v-if="pending(item.field)" class="font-normal text-warning">{{
            t('tools.properties.modified')
          }}</span>
        </span>
        <input
          :value="dateValue(item.field)"
          type="datetime-local"
          class="min-w-0 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
          :disabled="doc.busy"
          @change="saveDate(item.field, $event)"
        />
        <span v-if="unreadable(item.field)" class="text-xs break-all text-fg-muted">
          {{ t('tools.properties.inFile', { date: formatPdfDate(value(item.field)) }) }}
        </span>
      </label>
    </div>

    <AppButton
      icon="trash"
      class="justify-center"
      :title="t('tools.properties.clearAllHint')"
      :disabled="doc.busy || empty"
      @click="clearAll"
    >
      {{ t('tools.properties.clearAll') }}
    </AppButton>
  </template>
</template>
