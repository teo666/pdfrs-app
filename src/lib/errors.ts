import { t } from '@/i18n'

/** The model's error classes (`EmptyDocumentError`, `WrongPasswordError` from pdfrs-editor), recognised by the name they set. */
const isNamed = (err: unknown, name: string) => err instanceof Error && err.name === name

/**
 * An error as the user reads it, in the app's language: the model's and the
 * engine's known failures translated, anything else with its own message
 * (the app's own errors are already translated when thrown).
 */
export function describeError(err: unknown): string {
  if (isNamed(err, 'EmptyDocumentError')) return t('store.errors.emptyDocument')
  if (isNamed(err, 'WrongPasswordError')) return t('store.errors.wrongPassword')
  const message = err instanceof Error ? err.message : String(err)
  if (/invalid password/i.test(message)) return t('store.errors.wrongPassword')
  // The engine says it as "invalid arguments: spazio colore JPEG non supportato: Cmyk (...)".
  if (message.includes('spazio colore JPEG non supportato')) {
    const space = /spazio colore JPEG non supportato: ([^\s(]+)/.exec(message)?.[1] ?? ''
    return t('store.errors.jpegColorSpace', { space })
  }
  if (message.includes('non è un JPEG valido')) {
    const detail = /non è un JPEG valido: (.*)$/s.exec(message)?.[1] ?? ''
    return t('store.errors.invalidJpeg', { detail })
  }
  return message
}
