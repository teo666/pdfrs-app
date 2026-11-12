<script setup lang="ts">
import { computed, watch } from 'vue'
import type { MetadataField } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import { formatPdfDate, fromDatetimeLocal, parsePdfDate, toDatetimeLocal } from '@/lib/pdfDate'
import { useEditorStore } from '@/stores/editor'

/**
 * The document's properties - what PDF readers show as its title, author
 * and so on. Each field is saved when it's left (or on Enter), as a pending
 * edit like any other: undoable, written by Applica modifiche or Scarica.
 * An emptied field is removed from the document.
 */
const store = useEditorStore()
const doc = computed(() => store.active)

// Read the first time they're wanted, for whichever document is on show.
watch(
  () => store.active?.id,
  (id) => {
    if (id !== undefined) void store.loadMetadata(id)
  },
  { immediate: true },
)

const textFields: { field: MetadataField; label: string; hint?: string; placeholder?: string }[] = [
  {
    field: 'title',
    label: 'Titolo',
    hint: 'I lettori PDF lo mostrano al posto del nome del file',
  },
  { field: 'author', label: 'Autore' },
  { field: 'subject', label: 'Oggetto' },
  { field: 'keywords', label: 'Parole chiave', placeholder: 'separate da virgole' },
  { field: 'creator', label: 'Creato con', hint: 'L’applicazione in cui è nato il documento' },
  { field: 'producer', label: 'Prodotto da', hint: 'Il programma che ha scritto il PDF' },
]
const dateFields: { field: MetadataField; label: string }[] = [
  { field: 'creationDate', label: 'Creato il' },
  { field: 'modDate', label: 'Modificato il' },
]
const allFields = [...textFields, ...dateFields].map(({ field }) => field)

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
    Le informazioni che il PDF porta con sé e che i lettori mostrano nelle proprietà del file. Si
    scrivono con «Applica modifiche» o scaricando, e si annullano come le altre modifiche.
  </p>

  <p v-if="!doc" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    Apri un documento per vederne le proprietà.
  </p>
  <p v-else-if="!doc.metadata" class="text-[13px] text-fg-muted">Lettura delle proprietà…</p>

  <template v-else>
    <label v-for="item in textFields" :key="item.field" class="flex flex-col gap-1">
      <span class="flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
        {{ item.label }}
        <span v-if="pending(item.field)" class="font-normal text-warning">· modificato</span>
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
          <span v-if="pending(item.field)" class="font-normal text-warning">· modificato</span>
        </span>
        <input
          :value="dateValue(item.field)"
          type="datetime-local"
          class="min-w-0 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
          :disabled="doc.busy"
          @change="saveDate(item.field, $event)"
        />
        <span v-if="unreadable(item.field)" class="text-xs break-all text-fg-muted">
          Nel file: {{ formatPdfDate(value(item.field)) }}
        </span>
      </label>
    </div>

    <AppButton
      icon="trash"
      class="justify-center"
      title="Toglie tutte le proprietà, per esempio prima di condividere il file"
      :disabled="doc.busy || empty"
      @click="clearAll"
    >
      Togli tutte le proprietà
    </AppButton>
  </template>
</template>
