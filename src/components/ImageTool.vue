<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'
import IconButton from './IconButton.vue'
import { useSignatureImport } from '@/composables/useSignatureImport'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { t } = useI18n()
const { message, fromFile } = useSignatureImport()

/** Where an image goes: the first selected page, or the first page. */
const target = computed(() => {
  const doc = store.active
  if (!doc || doc.pages.length === 0) return null
  const index = doc.pages.findIndex((p) => doc.selection.has(p.id))
  return index === -1 ? 1 : index + 1
})

/** Images already on the document's pages, waiting to be applied. */
const placed = computed(() => {
  const doc = store.active
  if (!doc) return { count: 0, pages: 0 }
  const lists = Object.values(doc.annotations)
    .map((list) => list.filter((a) => a.kind === 'image'))
    .filter((list) => list.length > 0)
  return { count: lists.flat().length, pages: lists.length }
})

async function upload() {
  const image = await fromFile('image')
  if (image) store.placeSignatureFromPanel(image.id)
}
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.image.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.image.noDocument') }}
  </p>

  <template v-else>
    <section v-if="store.images.length" class="flex flex-col gap-2">
      <h3 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">
        {{ t('tools.image.yours') }}
      </h3>
      <ul class="grid grid-cols-2 gap-2">
        <!-- min-w-0: a cell never grows to a picture's own width (a photo is wider than the panel). -->
        <li v-for="image in store.images" :key="image.id" class="group relative min-w-0">
          <button
            class="flex w-full cursor-pointer flex-col items-stretch gap-1.5 rounded-card border border-line p-2 text-left hover:border-accent"
            :aria-label="
              t('tools.common.placeNamedOnPage', { name: image.name, page: target ?? '' })
            "
            @click="store.placeSignatureFromPanel(image.id)"
          >
            <!-- A checkerboard behind the picture shows where it's transparent. -->
            <span
              class="block h-20 overflow-hidden rounded-md bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] bg-size-[12px_12px]"
            >
              <img :src="image.url" alt="" class="size-full object-contain p-1" />
            </span>
            <span class="truncate text-xs" :title="image.name">{{ image.name }}</span>
            <span class="text-xs text-fg-muted">{{
              t('tools.common.placeOnPage', { page: target ?? '' })
            }}</span>
          </button>
          <IconButton
            icon="close"
            size="sm"
            :label="t('tools.common.removeFromLibrary', { name: image.name })"
            class="absolute top-1 right-1 bg-surface opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            :title="t('tools.common.removeFromLibraryHint')"
            @click="store.removeSignature(image.id)"
          />
        </li>
      </ul>
    </section>

    <AppButton
      :variant="store.images.length ? 'default' : 'primary'"
      icon="upload"
      class="justify-center"
      @click="upload"
    >
      {{ t('tools.common.uploadImage') }}
    </AppButton>
    <p class="text-xs text-fg-muted">
      {{ t('tools.image.formats') }}
    </p>

    <p v-if="message" class="text-xs text-fg-muted">{{ message }}</p>

    <p v-if="placed.count" class="rounded-md bg-accent-soft p-3 text-[13px] text-accent">
      {{
        t('tools.common.placed', {
          items: t('tools.image.placedCount', placed.count),
          pages: t('tools.common.pages', placed.pages),
        })
      }}
    </p>
  </template>
</template>
