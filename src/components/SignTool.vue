<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ImageAsset } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import IconButton from './IconButton.vue'
import SignaturePad from './SignaturePad.vue'
import { useSignatureImport } from '@/composables/useSignatureImport'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { t } = useI18n()
const { message, fromDrawing, fromFile } = useSignatureImport()
const drawing = ref(false)

/** Where a signature goes: the first selected page, or the first page. */
const target = computed(() => {
  const doc = store.active
  if (!doc || doc.pages.length === 0) return null
  const index = doc.pages.findIndex((p) => doc.selection.has(p.id))
  return index === -1 ? 1 : index + 1
})

/** Signatures already on the document's pages, waiting to be applied. */
const placed = computed(() => {
  const doc = store.active
  if (!doc) return { count: 0, pages: 0 }
  const lists = Object.values(doc.annotations)
    .map((list) => list.filter((a) => a.kind === 'signature'))
    .filter((list) => list.length > 0)
  return { count: lists.flat().length, pages: lists.length }
})

async function onDrawn(image: ImageAsset) {
  const signature = await fromDrawing(image)
  drawing.value = false
  store.placeSignatureFromPanel(signature.id)
}

async function upload() {
  const signature = await fromFile()
  if (signature) store.placeSignatureFromPanel(signature.id)
}
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.sign.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.sign.noDocument') }}
  </p>

  <template v-else>
    <SignaturePad v-if="drawing" tone="light" @done="onDrawn" @cancel="drawing = false" />

    <template v-else>
      <section v-if="store.signatures.length" class="flex flex-col gap-2">
        <h3 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">
          {{ t('tools.sign.yours') }}
        </h3>
        <ul class="flex flex-col gap-2">
          <li v-for="signature in store.signatures" :key="signature.id" class="group relative">
            <button
              class="flex w-full cursor-pointer flex-col items-stretch gap-1.5 rounded-card border border-line p-2 text-left hover:border-accent"
              :aria-label="
                t('tools.common.placeNamedOnPage', { name: signature.name, page: target ?? '' })
              "
              @click="store.placeSignatureFromPanel(signature.id)"
            >
              <span class="block h-16 overflow-hidden rounded-md bg-white">
                <img :src="signature.url" alt="" class="size-full object-contain p-1" />
              </span>
              <span class="text-xs text-fg-muted">{{
                t('tools.common.placeOnPage', { page: target ?? '' })
              }}</span>
            </button>
            <IconButton
              icon="close"
              size="sm"
              :label="t('tools.common.removeFromLibrary', { name: signature.name })"
              class="absolute top-1 right-1 bg-surface opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              :title="t('tools.common.removeFromLibraryHint')"
              @click="store.removeSignature(signature.id)"
            />
          </li>
        </ul>
      </section>

      <div class="flex flex-col gap-1.5">
        <AppButton
          :variant="store.signatures.length ? 'default' : 'primary'"
          icon="pen"
          class="justify-center"
          @click="drawing = true"
        >
          {{ t('tools.sign.draw') }}
        </AppButton>
        <AppButton icon="upload" class="justify-center" @click="upload">
          {{ t('tools.common.uploadImage') }}
        </AppButton>
      </div>
    </template>

    <p v-if="message" class="text-xs text-fg-muted">{{ message }}</p>

    <p v-if="placed.count" class="rounded-md bg-accent-soft p-3 text-[13px] text-accent">
      {{
        t('tools.common.placed', {
          items: t('tools.sign.placedCount', placed.count),
          pages: t('tools.common.pages', placed.pages),
        })
      }}
    </p>
  </template>

  <p class="mt-auto text-[11px] leading-snug text-fg-muted">
    {{ t('tools.sign.privacy') }}
  </p>
</template>
