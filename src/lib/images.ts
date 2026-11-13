import type { ImageAsset } from 'pdfrs-editor'

import { t } from '@/i18n'

/**
 * Images are decoded by the browser (canvas), not by the wasm engine: that's
 * what keeps `annotate_pdf` in the small "core" build.
 */

/** Longer side, in pixels, above which an image is scaled down: a signature needs nothing like a photo's resolution, and pixels travel uncompressed to the worker. */
export const MAX_SIGNATURE_SIZE = 1000

/**
 * Longer side for images placed on pages (logos, photos): sharp enough for
 * print at a third of a page, while keeping the PDF reasonable - the pixels
 * are stored losslessly.
 */
export const MAX_IMAGE_SIZE = 1600

/** Channel value above which a pixel counts as background when removing a white background. */
const WHITE_THRESHOLD = 225

/** Decodes an image file to RGBA, scaled so its longer side is at most `maxSize`. */
export async function imageFileToAsset(
  file: File,
  maxSize = MAX_SIGNATURE_SIZE,
): Promise<ImageAsset> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error(t('store.errors.imageDecode'))
    context.drawImage(bitmap, 0, 0, width, height)
    // getImageData is un-premultiplied: exactly what the PDF's /SMask wants.
    return { pixels: new Uint8Array(context.getImageData(0, 0, width, height).data), width, height }
  } finally {
    bitmap.close()
  }
}

/** True when at least one pixel is not fully opaque - a signature that won't paint a box over the text. */
export function hasTransparency(image: ImageAsset): boolean {
  for (let i = 3; i < image.pixels.length; i += 4) if (image.pixels[i] !== 255) return true
  return false
}

/**
 * Makes near-white pixels transparent: a signature scanned or photographed
 * on paper then shows only the ink. Returns a new image.
 */
export function removeWhiteBackground(image: ImageAsset): ImageAsset {
  const pixels = new Uint8Array(image.pixels)
  for (let i = 0; i < pixels.length; i += 4) {
    if (
      pixels[i]! > WHITE_THRESHOLD &&
      pixels[i + 1]! > WHITE_THRESHOLD &&
      pixels[i + 2]! > WHITE_THRESHOLD
    ) {
      pixels[i + 3] = 0
    }
  }
  return { ...image, pixels }
}

/** A PNG object URL of the image, for showing it in the page (thumbnails, viewer, library). */
export async function assetToUrl(image: ImageAsset): Promise<string> {
  const canvas = new OffscreenCanvas(image.width, image.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error(t('store.errors.imageDraw'))
  context.putImageData(
    new ImageData(new Uint8ClampedArray(image.pixels), image.width, image.height),
    0,
    0,
  )
  return URL.createObjectURL(await canvas.convertToBlob({ type: 'image/png' }))
}

/**
 * The drawn part of a canvas (its non-transparent pixels plus a margin), as
 * an image asset - or null if nothing was drawn.
 */
export function cropToInk(canvas: HTMLCanvasElement, margin = 8): ImageAsset | null {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  const { width, height } = canvas
  const { data } = context.getImageData(0, 0, width, height)
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > 0) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }
  if (right < 0) return null
  left = Math.max(0, left - margin)
  top = Math.max(0, top - margin)
  right = Math.min(width - 1, right + margin)
  bottom = Math.min(height - 1, bottom + margin)
  const w = right - left + 1
  const h = bottom - top + 1
  return { pixels: new Uint8Array(context.getImageData(left, top, w, h).data), width: w, height: h }
}
