export type DropSide = 'before' | 'after'

/**
 * Where a dragged page ends up when dropped on one side of the page at
 * `overIndex`, as the final index `PdfDocument.movePage()` expects - that
 * index is counted *after* the page has been taken out of its old spot, so
 * dropping further down the list shifts it back by one.
 */
export function dropTargetIndex(fromIndex: number, overIndex: number, side: DropSide): number {
  const insertAt = side === 'before' ? overIndex : overIndex + 1
  return fromIndex < insertAt ? insertAt - 1 : insertAt
}
