/** The drag data type of pages dragged out of the grid: their ids, comma-separated. */
export const PAGE_DRAG_TYPE = 'application/x-pdfrs-page'

export type DropSide = 'before' | 'after'

/**
 * Where pages being dragged end up when dropped on one side of the page at
 * `overIndex`, as the index `PdfDocument.movePages()` expects: it counts
 * only the pages that are *not* moving, so every moving page in front of
 * the drop slot shifts it back by one. Works for a single page too.
 */
export function blockDropIndex<T>(
  order: readonly T[],
  moving: ReadonlySet<T>,
  overIndex: number,
  side: DropSide,
): number {
  const insertAt = side === 'before' ? overIndex : overIndex + 1
  let movingBefore = 0
  for (let i = 0; i < insertAt && i < order.length; i++) {
    if (moving.has(order[i] as T)) movingBefore++
  }
  return insertAt - movingBefore
}
