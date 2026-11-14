import type { WatermarkOptions } from 'pdfrs-editor'

/** Share of the page the "fit" size fills, and the margin at the top or bottom: as in the engine. */
const FIT_SHARE = 0.8
const EDGE_MARGIN = 0.05

/**
 * Where the engine puts a watermark on a page (`watermark.rs`): the text
 * box before it's turned, in fractions of the page as shown (origin at the
 * top-left), and its turn, clockwise in degrees as CSS has it.
 *
 * `text` is the laid-out text at a font size of 1 (em), `page` the page's
 * size in points.
 */
export function watermarkBox(
  text: { width: number; height: number },
  page: { width: number; height: number },
  options: Pick<WatermarkOptions, 'size' | 'angle' | 'position'>,
): { x: number; y: number; width: number; height: number; rotation: number } {
  const angle = options.angle ?? 45
  const aspect = text.height / text.width
  const radians = (angle * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const size = options.size ?? 'fit'

  const boxWidth =
    size === 'fit'
      ? Math.min(
          (FIT_SHARE * page.width) / (cos + aspect * sin),
          (FIT_SHARE * page.height) / (sin + aspect * cos),
        )
      : text.width * size
  const boxHeight = boxWidth * aspect
  const turnedHeight = boxWidth * sin + boxHeight * cos
  const centreY =
    options.position === 'top'
      ? EDGE_MARGIN * page.height + turnedHeight / 2
      : options.position === 'bottom'
        ? page.height - EDGE_MARGIN * page.height - turnedHeight / 2
        : page.height / 2

  return {
    x: (page.width - boxWidth) / 2 / page.width,
    y: (centreY - boxHeight / 2) / page.height,
    width: boxWidth / page.width,
    height: boxHeight / page.height,
    rotation: -angle,
  }
}
