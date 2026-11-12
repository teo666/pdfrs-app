<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ImageAsset } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import IconButton from './IconButton.vue'
import SignaturePad from './SignaturePad.vue'
import { useSignatureImport } from '@/composables/useSignatureImport'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
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
    Disegna o carica la tua firma, poi mettila su una pagina: si apre la pagina in grande, dove la
    sposti, la ridimensioni, la ruoti e, se vuoi, la metti uguale su tutte le pagine.
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    Apri un documento per firmarlo.
  </p>

  <template v-else>
    <SignaturePad v-if="drawing" tone="light" @done="onDrawn" @cancel="drawing = false" />

    <template v-else>
      <section v-if="store.signatures.length" class="flex flex-col gap-2">
        <h3 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">Le tue firme</h3>
        <ul class="flex flex-col gap-2">
          <li v-for="signature in store.signatures" :key="signature.id" class="group relative">
            <button
              class="flex w-full cursor-pointer flex-col items-stretch gap-1.5 rounded-card border border-line p-2 text-left hover:border-accent"
              :aria-label="`Metti «${signature.name}» sulla pagina ${target}`"
              @click="store.placeSignatureFromPanel(signature.id)"
            >
              <span class="grid h-16 place-items-center rounded-md bg-white">
                <img :src="signature.url" alt="" class="max-h-full max-w-full" />
              </span>
              <span class="text-xs text-fg-muted">Metti su pagina {{ target }}</span>
            </button>
            <IconButton
              icon="close"
              size="sm"
              :label="`Togli «${signature.name}» dalla libreria`"
              class="absolute top-1 right-1 bg-surface opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              title="Togli dalla libreria (resta sulle pagine dove l’hai già messa)"
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
          Disegna una firma
        </AppButton>
        <AppButton icon="upload" class="justify-center" @click="upload">
          Carica un’immagine
        </AppButton>
      </div>
    </template>

    <p v-if="message" class="text-xs text-fg-muted">{{ message }}</p>

    <p v-if="placed.count" class="rounded-md bg-accent-soft p-3 text-[13px] text-accent">
      {{ placed.count === 1 ? '1 firma' : `${placed.count} firme` }} su
      {{ placed.pages === 1 ? '1 pagina' : `${placed.pages} pagine` }}: finiscono nel PDF quando
      applichi le modifiche o lo scarichi.
    </p>
  </template>

  <p class="mt-auto text-[11px] leading-snug text-fg-muted">
    Le firme restano solo in questa scheda del browser e non vengono salvate da nessuna parte.
  </p>
</template>
