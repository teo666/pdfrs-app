/**
 * The same layout rules as the engine's N-up and booklet (src/operations/
 * nup.rs and booklet.rs in pdfrs), for drawing a faithful preview of the
 * sheet before making it.
 */

export type NupCount = 2 | 4 | 6 | 8 | 9 | 16
export type SheetOrientation = 'auto' | 'portrait' | 'landscape'

/** Millimetres to PDF points (1 pt = 1/72 inch). */
export const mmToPt = (mm: number) => (mm * 72) / 25.4

/** Grid and sheet orientation the engine will use for `count` pages per sheet. */
export function nupGrid(count: NupCount, orientation: SheetOrientation) {
  const grids: Record<NupCount, [cols: number, rows: number]> = {
    2: [2, 1],
    4: [2, 2],
    6: [3, 2],
    8: [4, 2],
    9: [3, 3],
    16: [4, 4],
  }
  let [cols, rows] = grids[count]
  const landscape = orientation === 'landscape' || (orientation === 'auto' && cols > rows)
  // Two pages on an upright sheet go one above the other.
  if (!landscape && cols === 2 && rows === 1) [cols, rows] = [1, 2]
  return { cols, rows, landscape }
}

/** Page numbers in the cells of the first sheet, row by row. */
export function nupOrder(
  cols: number,
  rows: number,
  direction: 'horizontal' | 'vertical',
): number[] {
  const cells: number[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(direction === 'horizontal' ? r * cols + c + 1 : c * rows + r + 1)
    }
  }
  return cells
}

/** Sheets of paper a booklet of `pages` pages needs, and the blank pages added to reach a multiple of 4. */
export function bookletSheets(pages: number) {
  const padded = Math.max(4, Math.ceil(pages / 4) * 4)
  return { sheets: padded / 4, blanks: padded - pages }
}
