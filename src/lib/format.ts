/** A size in bytes as people read it: "870 byte", "12 KB", "3,4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} byte`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`
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
  return `${pages.length === 1 ? 'pagina' : 'pagine'} ${pageRanges(pages)}`
}
