<script setup lang="ts">
import { computed, ref } from 'vue'
import { layoutText, type TextContent } from 'pdfrs-editor'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'
import TextEditor from './TextEditor.vue'
import TextStamp from './TextStamp.vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { t } = useI18n()

const content = ref<TextContent>({
  text: '',
  font: 'helvetica',
  bold: false,
  italic: false,
  color: '#1c2026',
  align: 'left',
})
const size = ref(14)

/** Where the text goes: the first selected page, or the first page. */
const target = computed(() => {
  const doc = store.active
  if (!doc || doc.pages.length === 0) return null
  const index = doc.pages.findIndex((p) => doc.selection.has(p.id))
  return index === -1 ? 1 : index + 1
})

/** The preview at the chosen size (1 pt = 1 px), shrunk only if it doesn't fit the panel. */
const preview = computed(() => {
  const layout = layoutText(content.value.text, content.value)
  return { width: layout.width * size.value, height: layout.height * size.value }
})
const blank = computed(() => content.value.text.trim() === '')

/** Texts already on the pages, waiting to be applied. */
const placed = computed(() => {
  const doc = store.active
  if (!doc) return { count: 0, pages: 0 }
  const lists = Object.values(doc.annotations)
    .map((list) => list.filter((a) => a.kind === 'text'))
    .filter((list) => list.length > 0)
  return { count: lists.flat().length, pages: lists.length }
})
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.text.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.text.noDocument') }}
  </p>

  <template v-else>
    <TextEditor v-model="content" v-model:size="size" />

    <figure
      v-if="!blank"
      class="flex max-h-48 items-center justify-center overflow-hidden rounded-md bg-white p-3 ring-1 ring-line"
      :aria-label="t('tools.text.preview')"
    >
      <div
        class="max-w-full"
        :style="{
          width: `${preview.width}px`,
          aspectRatio: `${preview.width} / ${preview.height}`,
        }"
      >
        <TextStamp :content="content" />
      </div>
    </figure>

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="blank || store.active.busy"
      @click="store.placeTextFromPanel(content, size)"
    >
      {{ t('tools.common.placeOnPage', { page: target ?? '' }) }}
    </AppButton>

    <p v-if="placed.count" class="rounded-md bg-accent-soft p-3 text-[13px] text-accent">
      {{
        t('tools.common.placed', {
          items: t('tools.text.placedCount', placed.count),
          pages: t('tools.common.pages', placed.pages),
        })
      }}
    </p>

    <p class="mt-auto text-[11px] leading-snug text-fg-muted">
      {{ t('tools.text.fonts') }}
    </p>
  </template>
</template>
