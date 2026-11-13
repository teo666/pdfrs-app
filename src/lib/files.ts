export type FileKind = 'pdf' | 'jpeg'

/**
 * Recognizes a file by its first bytes rather than by name or MIME type:
 * dropped files often have an empty `type`, and an extension can lie.
 */
export function detectKind(bytes: Uint8Array): FileKind | null {
  // "%PDF-"
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return 'pdf'
  }
  // JPEG SOI marker followed by the start of another marker.
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  return null
}

export const ACCEPTED_FILES = 'application/pdf,.pdf,image/jpeg,.jpg,.jpeg'

export async function readFile(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer())
}

/** Opens the browser's file picker; resolves with the chosen files (empty if cancelled). */
export function pickFiles(accept = ACCEPTED_FILES): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = true
    input.addEventListener('change', () => resolve(Array.from(input.files ?? [])))
    input.addEventListener('cancel', () => resolve([]))
    input.click()
  })
}

export function downloadBytes(bytes: Uint8Array, filename: string, type = 'application/pdf'): void {
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // Revoked on the next tick: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** "contratto.pdf" for a PDF, "foto.pdf" for an imported "foto.jpg". */
export function pdfFileName(name: string): string {
  return name.replace(/\.(pdf|jpe?g)$/i, '') + '.pdf'
}
