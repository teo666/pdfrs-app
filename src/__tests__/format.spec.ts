import { describe, expect, it } from 'vitest'

import { formatBytes, pageRanges, pagesLabel } from '@/lib/format'

describe('format', () => {
  it('writes sizes as people read them', () => {
    expect(formatBytes(870)).toBe('870 byte')
    expect(formatBytes(12 * 1024)).toBe('12 KB')
    expect(formatBytes(3.4 * 1024 * 1024)).toBe('3,4 MB')
  })

  it('writes pages as ranges', () => {
    expect(pageRanges([7, 1, 2, 3, 9, 10, 2])).toBe('1–3, 7, 9–10')
    expect(pagesLabel([4])).toBe('pagina 4')
    expect(pagesLabel([1, 2])).toBe('pagine 1–2')
  })
})
