import { describe, expect, it } from 'vitest'

import { formatPdfDate, fromDatetimeLocal, parsePdfDate, toDatetimeLocal } from '@/lib/pdfDate'

describe('PDF dates', () => {
  it('reads every form a PDF date takes', () => {
    expect(parsePdfDate("D:20240115103000+01'00'")?.toISOString()).toBe('2024-01-15T09:30:00.000Z')
    expect(parsePdfDate("D:20240115103000-05'30")?.toISOString()).toBe('2024-01-15T16:00:00.000Z')
    expect(parsePdfDate('D:20240115103000Z')?.toISOString()).toBe('2024-01-15T10:30:00.000Z')
    // No offset: local time. Only the year: 1 January, midnight.
    expect(parsePdfDate('D:20240115103000')).toEqual(new Date(2024, 0, 15, 10, 30, 0))
    expect(parsePdfDate('D:2024')).toEqual(new Date(2024, 0, 1))
  })

  it('turns down what is not a PDF date', () => {
    for (const value of ['', '2024-01-15', 'D:24', 'D:20241315', 'D:20240115253000', 'ieri']) {
      expect(parsePdfDate(value)).toBeNull()
    }
    expect(formatPdfDate('ieri')).toBe('ieri')
  })

  it('goes to a date field and back, keeping the moment', () => {
    const pdf = fromDatetimeLocal('2024-07-01T09:05')!
    expect(pdf).toMatch(/^D:20240701090500[+-]\d{2}'\d{2}'$/)
    expect(toDatetimeLocal(parsePdfDate(pdf)!)).toBe('2024-07-01T09:05')
    expect(fromDatetimeLocal('domani')).toBeNull()
  })
})
