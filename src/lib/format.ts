import { currentLocale, t } from '@/i18n'

/** A size in bytes as people read it: "870 byte", "12 KB", "3,4 MB". */
export function formatBytes(bytes: number): string {
  const locale = currentLocale()
  if (bytes < 1024) return t('app.format.bytes', { n: bytes.toLocaleString(locale) })
  const kb = bytes / 1024
  if (kb < 1024) return t('app.format.kilobytes', { n: Math.round(kb).toLocaleString(locale) })
  return t('app.format.megabytes', {
    n: (kb / 1024).toLocaleString(locale, { maximumFractionDigits: 1 }),
  })
}

/** Page numbers as ranges: [1, 2, 3, 7, 9, 10] → "1–3, 7, 9–10". */
export function pageRanges(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b)
  const parts: string[] = []
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i]!
    let end = start
    while (sorted[i + 1] === end + 1) end = sorted[++i]!
    parts.push(end === start ? `${start}` : `${start}–${end}`)
  }
  return parts.join(', ')
}

/** "pagina 3", "pagine 1–3, 7". */
export function pagesLabel(pages: number[]): string {
  return t('app.format.pages', { ranges: pageRanges(pages) }, pages.length)
}
