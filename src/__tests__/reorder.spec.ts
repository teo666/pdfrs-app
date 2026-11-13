import { describe, expect, it } from 'vitest'

import { blockDropIndex } from '@/lib/reorder'

// Pages A..F, indexes 0..5.
const order = ['A', 'B', 'C', 'D', 'E', 'F']
const one = (page: string, overIndex: number, side: 'before' | 'after') =>
  blockDropIndex(order, new Set([page]), overIndex, side)

describe('blockDropIndex', () => {
  it('moves a single page forward, accounting for the slot it leaves', () => {
    // A dropped after C -> [B, C, A, ...]: A ends at index 2 of the others.
    expect(one('A', 2, 'after')).toBe(2)
    // A dropped before C -> [B, A, C, ...]: index 1.
    expect(one('A', 2, 'before')).toBe(1)
  })

  it('moves a single page backward', () => {
    expect(one('D', 0, 'before')).toBe(0)
    expect(one('D', 0, 'after')).toBe(1)
  })

  it('leaves a page where it is when dropped next to itself', () => {
    expect(one('B', 1, 'before')).toBe(1)
    expect(one('B', 1, 'after')).toBe(1)
    expect(one('B', 0, 'after')).toBe(1)
    expect(one('B', 2, 'before')).toBe(1)
  })

  it('counts only the pages not moving when a block is dragged', () => {
    const moving = new Set(['A', 'C'])
    // After E: the others are [B, D, E, F]; E is their index 2, so index 3.
    expect(blockDropIndex(order, moving, 4, 'after')).toBe(3)
    // Before B: in front of everything.
    expect(blockDropIndex(order, moving, 1, 'before')).toBe(0)
    // After the last page.
    expect(blockDropIndex(order, moving, 5, 'after')).toBe(4)
  })
})
