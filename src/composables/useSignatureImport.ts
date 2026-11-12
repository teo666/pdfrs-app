import { ref } from 'vue'
import type { ImageAsset } from 'pdfrs-editor'

import { pickFiles } from '@/lib/files'
import { assetToUrl, hasTransparency, imageFileToAsset, removeWhiteBackground } from '@/lib/images'
import { useEditorStore, type Signature } from '@/stores/editor'

/**
 * Adding signatures to the library, from a drawing or an image file - shared
 * by the viewer's signature panel and the Firma tool. `message` says what
 * happened to an uploaded image (or why it couldn't be read).
 */
export function useSignatureImport() {
  const store = useEditorStore()
  const message = ref<string | null>(null)

  async function fromDrawing(image: ImageAsset): Promise<Signature> {
    message.value = null
    return store.addSignature(
      image,
      await assetToUrl(image),
      `Firma ${store.signatures.length + 1}`,
    )
  }

  /** Asks for an image file; null if none was picked or it couldn't be read. */
  async function fromFile(): Promise<Signature | null> {
    const [file] = await pickFiles('image/png,image/jpeg,image/webp')
    if (!file) return null
    try {
      let image = await imageFileToAsset(file)
      message.value = null
      // Without transparency (a JPEG, a photo of a signature on paper) the
      // image would paint a white box over the text: keep only the ink.
      if (!hasTransparency(image)) {
        image = removeWhiteBackground(image)
        message.value = 'Lo sfondo bianco dell’immagine è stato reso trasparente.'
      }
      return store.addSignature(image, await assetToUrl(image), file.name.replace(/\.[^.]+$/, ''))
    } catch (err) {
      message.value = `Immagine non leggibile: ${err instanceof Error ? err.message : String(err)}`
      return null
    }
  }

  return { message, fromDrawing, fromFile }
}
