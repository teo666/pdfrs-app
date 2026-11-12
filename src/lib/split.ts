/**
 * How a document is cut into parts. Positions are 1-based places in the page
 * grid, as the cards are numbered (pages marked for deletion included: they
 * are left out of the parts afterwards, not renumbered away).
 */

export interface Part {
  start: number
  end: number
}

/** Consecutive parts of `size` pages (the last one may be shorter). */
export function splitEvery(size: number, total: number): Part[] {
  if (!Number.isInteger(size) || size < 1 || total < 1) return []
  const parts: Part[] = []
  for (let start = 1; start <= total; start += size) {
    parts.push({ start, end: Math.min(start + size - 1, total) })
  }
  return parts
}

/** A new part begins at each of `starts` (and at page 1); each runs until the next. */
export function splitAtStarts(starts: number[], total: number): Part[] {
  const cuts = [...new Set([1, ...starts.filter((p) => p >= 1 && p <= total)])].sort(
    (a, b) => a - b,
  )
  return cuts.map((start, index) => ({ start, end: (cuts[index + 1] ?? total + 1) - 1 }))
}

/**
 * Reads ranges typed by hand: "1-3, 5, 8-10" (also "1–3" or "1 - 3", and ";"
 * or spaces between them). Each range is a part, in the order written.
 */
export function parseRanges(text: string, total: number): { parts: Part[]; error: string | null } {
  const tokens = text
    .replace(/\s*[-–]\s*/g, '-') // "8 – 10" is one range
    .split(/[\s,;]+/)
    .filter(Boolean)
  if (tokens.length === 0) return { parts: [], error: null }
  const parts: Part[] = []
  for (const token of tokens) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(token)
    if (!match) return { parts: [], error: `«${token}» non è un intervallo (es. 1-3 oppure 5)` }
    const start = Number(match[1])
    const end = Number(match[2] ?? match[1])
    if (start < 1 || end > total) {
      return { parts: [], error: `«${token}»: il documento ha le pagine da 1 a ${total}` }
    }
    if (start > end) return { parts: [], error: `«${token}»: la prima pagina viene dopo l’ultima` }
    parts.push({ start, end })
  }
  return { parts, error: null }
}

/** Positions (1..total) that end up in no part. */
export function leftOut(parts: Part[], total: number): number[] {
  const covered = new Set(parts.flatMap(({ start, end }) => range(start, end)))
  return range(1, total).filter((position) => !covered.has(position))
}

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i)
}

/** How many part colours there are (--color-part-1 ... in main.css), used in turn. */
export const PART_COLORS = 6

/** The CSS colour of a part (1-based), cycling through the palette. */
export function partColor(part: number): string {
  return `var(--color-part-${((part - 1) % PART_COLORS) + 1})`
}
