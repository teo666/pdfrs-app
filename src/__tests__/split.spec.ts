import { describe, expect, it } from 'vitest'

import { leftOut, parseRanges, splitAtStarts, splitEvery } from '@/lib/split'

describe('splitEvery', () => {
  it('cuts consecutive parts, the last one shorter', () => {
    expect(splitEvery(3, 7)).toEqual([
      { start: 1, end: 3 },
      { start: 4, end: 6 },
      { start: 7, end: 7 },
    ])
    expect(splitEvery(1, 2)).toEqual([
      { start: 1, end: 1 },
      { start: 2, end: 2 },
    ])
    expect(splitEvery(0, 5)).toEqual([])
  })
})

describe('splitAtStarts', () => {
  it('starts a part at each given page, always at page 1 too', () => {
    expect(splitAtStarts([4, 8], 10)).toEqual([
      { start: 1, end: 3 },
      { start: 4, end: 7 },
      { start: 8, end: 10 },
    ])
    expect(splitAtStarts([1, 5, 5, 99], 6)).toEqual([
      { start: 1, end: 4 },
      { start: 5, end: 6 },
    ])
  })
})

describe('parseRanges', () => {
  it('reads ranges and single pages, in the order written', () => {
    expect(parseRanges('1-3, 5; 8 – 10', 10)).toEqual({
      parts: [
        { start: 1, end: 3 },
        { start: 5, end: 5 },
        { start: 8, end: 10 },
      ],
      error: null,
    })
    expect(parseRanges('7-9 1-2', 10).parts).toEqual([
      { start: 7, end: 9 },
      { start: 1, end: 2 },
    ])
    expect(parseRanges('  ', 10)).toEqual({ parts: [], error: null })
  })

  it('explains what is wrong', () => {
    expect(parseRanges('1-3, a', 10).error).toContain('«a»')
    expect(parseRanges('9-12', 10).error).toContain('da 1 a 10')
    expect(parseRanges('5-2', 10).error).toContain('dopo l’ultima')
  })
})

describe('leftOut', () => {
  it('lists the pages no part takes', () => {
    expect(
      leftOut(
        [
          { start: 1, end: 2 },
          { start: 5, end: 5 },
        ],
        6,
      ),
    ).toEqual([3, 4, 6])
  })
})
