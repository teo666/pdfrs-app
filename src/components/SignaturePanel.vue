<script setup lang="ts">
import { ref } from 'vue'
import type { ImageAsset } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import SignaturePad from './SignaturePad.vue'
import { pickFiles } from '@/lib/files'
import { assetToUrl, hasTransparency, imageFileToAsset, removeWhiteBackground } from '@/lib/images'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const emit = defineEmits<{ place: [signatureId: number]; close: [] }>()

const drawing = ref(store.signatures.length === 0)
const message = ref<string | null>(null)

async function add(image: ImageAsset, name: string) {
  const signature = store.addSignature(image, await assetToUrl(image), name)
  drawing.value = false
  emit('place', signature.id)
}

async function onDrawn(image: ImageAsset) {
  message.value = null
  await add(image, `Firma ${store.signatures.length + 1}`)
}

async function upload() {
  const [file] = await pickFiles('image/png,image/jpeg,image/webp')
  if (!file) return
  try {
    let image = await imageFileToAsset(file)
    // An image without transparency (a JPEG, a photo of a signature on
    // paper) would paint a white box over the text: keep only the ink.
    message.value = null
    if (!hasTransparency(image)) {
      image = removeWhiteBackground(image)
      message.value = 'Lo sfondo bianco dell’immagine è stato reso trasparente.'
    }
    await add(image, file.name.replace(/\.[^.]+$/, ''))
  } catch (err) {
    message.value = `Immagine non leggibile: ${err instanceof Error ? err.message : String(err)}`
  }
}
</script>

<template>
  <aside
    class="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/10 bg-black/60 p-3 backdrop-blur max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:z-10"
    aria-label="Firme"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Firme</h2>
      <button
        class="grid size-7 cursor-pointer place-items-center rounded-md hover:bg-white/15"
        aria-label="Chiudi il pannello delle firme"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="16" />
      </button>
    </div>

    <SignaturePad v-if="drawing" @done="onDrawn" @cancel="drawing = false" />

    <template v-else>
      <p v-if="store.signatures.length" class="text-xs text-white/60">
        Clicca una firma per metterla su questa pagina, poi trascinala dove serve.
      </p>
      <ul class="flex flex-col gap-2">
        <li v-for="signature in store.signatures" :key="signature.id" class="group relative">
          <button
            class="grid h-20 w-full cursor-pointer place-items-center rounded-md bg-white p-2 ring-accent hover:ring-2"
            :aria-label="`Metti «${signature.name}» sulla pagina`"
            @click="emit('place', signature.id)"
          >
            <img :src="signature.url" alt="" class="max-h-full max-w-full" />
          </button>
          <button
            class="absolute top-1 right-1 grid size-6 cursor-pointer place-items-center rounded bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            :aria-label="`Togli «${signature.name}» dalla libreria`"
            title="Togli dalla libreria (resta sulle pagine dove l’hai già messa)"
            @click="store.removeSignature(signature.id)"
          >
            <AppIcon name="close" :size="14" />
          </button>
        </li>
      </ul>

      <div class="flex flex-col gap-1.5">
        <button
          class="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-black"
          @click="drawing = true"
        >
          <AppIcon name="pen" :size="16" />
          Disegna una firma
        </button>
        <button
          class="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          @click="upload"
        >
          <AppIcon name="upload" :size="16" />
          Carica un’immagine
        </button>
      </div>
    </template>

    <p v-if="message" class="text-xs text-white/70">{{ message }}</p>
    <p class="mt-auto text-[11px] leading-snug text-white/45">
      Le firme restano solo in questa scheda del browser e non vengono salvate da nessuna parte.
      Finiscono nel PDF quando applichi le modifiche o lo scarichi.
    </p>
  </aside>
</template>
