import { describe, expect, it } from 'vitest'

import { bookletSheets, mmToPt, nupGrid, nupOrder } from '@/lib/imposition'

describe('nupGrid', () => {
  it('turns the sheet landscape when there are more columns than rows', () => {
    expect(nupGrid(2, 'auto')).toEqual({ cols: 2, rows: 1, landscape: true })
    expect(nupGrid(8, 'auto')).toEqual({ cols: 4, rows: 2, landscape: true })
    expect(nupGrid(4, 'auto')).toEqual({ cols: 2, rows: 2, landscape: false })
    expect(nupGrid(9, 'auto')).toEqual({ cols: 3, rows: 3, landscape: false })
  })

  it('stacks two pages on an upright sheet', () => {
    expect(nupGrid(2, 'portrait')).toEqual({ cols: 1, rows: 2, landscape: false })
    expect(nupGrid(6, 'portrait')).toEqual({ cols: 3, rows: 2, landscape: false })
  })
})

describe('nupOrder', () => {
  it('fills rows first or columns first', () => {
    expect(nupOrder(2, 2, 'horizontal')).toEqual([1, 2, 3, 4])
    expect(nupOrder(2, 2, 'vertical')).toEqual([1, 3, 2, 4])
    expect(nupOrder(3, 2, 'vertical')).toEqual([1, 3, 5, 2, 4, 6])
  })
})

describe('bookletSheets', () => {
  it('pads to a multiple of four pages, four pages per sheet', () => {
    expect(bookletSheets(8)).toEqual({ sheets: 2, blanks: 0 })
    expect(bookletSheets(10)).toEqual({ sheets: 3, blanks: 2 })
    expect(bookletSheets(1)).toEqual({ sheets: 1, blanks: 3 })
  })
})

describe('mmToPt', () => {
  it('converts millimetres to PDF points', () => {
    expect(mmToPt(25.4)).toBe(72)
  })
})
