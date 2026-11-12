import { describe, expect, it } from 'vitest'

import { dropTargetIndex } from '@/lib/reorder'

describe('dropTargetIndex', () => {
  // Pages [A, B, C, D], indexes 0..3.
  it('moves a page forward, accounting for the slot it leaves', () => {
    // A dropped after C -> [B, C, A, D]: A ends at index 2.
    expect(dropTargetIndex(0, 2, 'after')).toBe(2)
    // A dropped before C -> [B, A, C, D]: index 1.
    expect(dropTargetIndex(0, 2, 'before')).toBe(1)
  })

  it('moves a page backward', () => {
    // D dropped before A -> [D, A, B, C]: index 0.
    expect(dropTargetIndex(3, 0, 'before')).toBe(0)
    // D dropped after A -> [A, D, B, C]: index 1.
    expect(dropTargetIndex(3, 0, 'after')).toBe(1)
  })

  it('leaves the page where it is when dropped next to itself', () => {
    expect(dropTargetIndex(1, 1, 'before')).toBe(1)
    expect(dropTargetIndex(1, 1, 'after')).toBe(1)
    expect(dropTargetIndex(1, 0, 'after')).toBe(1)
    expect(dropTargetIndex(1, 2, 'before')).toBe(1)
  })
})
