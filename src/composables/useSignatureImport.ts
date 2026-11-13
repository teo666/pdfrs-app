import { ref } from 'vue'
import type { ImageAsset } from 'pdfrs-editor'

import { t } from '@/i18n'
import { pickFiles } from '@/lib/files'
import {
  assetToUrl,
  hasTransparency,
  imageFileToAsset,
  MAX_IMAGE_SIZE,
  removeWhiteBackground,
} from '@/lib/images'
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
      t('store.names.signature', { n: store.signatures.length + 1 }),
    )
  }

  /**
   * Asks for an image file; null if none was picked or it couldn't be read.
   * As a signature, an image without transparency (a JPEG, a photo of a
   * signature on paper) gets its white background removed - it would paint
   * a white box over the text. As an image, it's kept as it is.
   */
  async function fromFile(kind: 'signature' | 'image' = 'signature'): Promise<Signature | null> {
    const [file] = await pickFiles('image/png,image/jpeg,image/webp,image/gif')
    if (!file) return null
    try {
      let image = await imageFileToAsset(file, kind === 'image' ? MAX_IMAGE_SIZE : undefined)
      message.value = null
      if (kind === 'signature' && !hasTransparency(image)) {
        image = removeWhiteBackground(image)
        message.value = t('store.library.whiteBackground')
      }
      const url = await assetToUrl(image)
      const name = file.name.replace(/\.[^.]+$/, '')
      return kind === 'image'
        ? store.addImage(image, url, name)
        : store.addSignature(image, url, name)
    } catch (err) {
      message.value = t('store.library.unreadable', {
        reason: err instanceof Error ? err.message : String(err),
      })
      return null
    }
  }

  return { message, fromDrawing, fromFile }
}
