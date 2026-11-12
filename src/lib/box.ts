/**
 * Resizing a placed image or signature, possibly turned. The box is kept as
 * the model stores it - top-left corner, width and height of the *unturned*
 * box, in fractions of the page, turned about its own centre - but the maths
 * is done in page pixels, where a turn is a plain rotation (fractions of a
 * non-square page are not).
 *
 * The rule: the side (or corner) opposite the handle stays where it is on
 * the page. With a turned box that is not the same as keeping x/y: changing
 * the width moves the centre the box turns about.
 */

export interface PageBox {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export type ResizeMode = 'resize' | 'stretch-x' | 'stretch-y'

/** Smallest width and height, as fractions of the page. */
export const MIN_SIZE = { width: 0.03, height: 0.01 }

/**
 * The box after dragging a handle by `along` - the pointer movement in page
 * pixels, already expressed along the box's own axes. `page` is the page's
 * size in pixels.
 *
 * - resize (bottom-right corner): the width follows the pointer and the
 *   height keeps the box's current proportions; the top-left corner stays.
 * - stretch-x (right side): only the width; the left side stays.
 * - stretch-y (bottom side): only the height; the top side stays.
 *
 * `fromCentre` (Shift held): the centre stays instead, and the opposite side
 * moves too, mirroring the handle - the size changes twice as much.
 */
export function resizeBox(
  box: PageBox,
  mode: ResizeMode,
  along: { x: number; y: number },
  page: { width: number; height: number },
  fromCentre = false,
): PageBox {
  const w = box.width * page.width
  const h = box.height * page.height
  const grow = fromCentre ? 2 : 1
  let newW = w
  let newH = h
  if (mode === 'resize') {
    newW = clampPx(w + grow * along.x, MIN_SIZE.width * page.width, page.width)
    newH = (newW * h) / w
  } else if (mode === 'stretch-x') {
    newW = clampPx(w + grow * along.x, MIN_SIZE.width * page.width, page.width)
  } else {
    newH = clampPx(h + grow * along.y, MIN_SIZE.height * page.height, page.height)
  }

  // The box's own axes on the page: u along its width, v along its height.
  const r = (box.rotation * Math.PI) / 180
  const u = { x: Math.cos(r), y: Math.sin(r) }
  const v = { x: -Math.sin(r), y: Math.cos(r) }
  const centre = { x: box.x * page.width + w / 2, y: box.y * page.height + h / 2 }
  if (fromCentre) {
    return {
      x: (centre.x - newW / 2) / page.width,
      y: (centre.y - newH / 2) / page.height,
      width: newW / page.width,
      height: newH / page.height,
      rotation: box.rotation,
    }
  }

  // The fixed point is the top-left corner (in the box's own frame) for all
  // three handles: they all sit on the right/bottom. Its position on the
  // page doesn't change; the new centre is measured from it.
  const anchor = {
    x: centre.x - (u.x * w) / 2 - (v.x * h) / 2,
    y: centre.y - (u.y * w) / 2 - (v.y * h) / 2,
  }
  const newCentre = {
    x: anchor.x + (u.x * newW) / 2 + (v.x * newH) / 2,
    y: anchor.y + (u.y * newW) / 2 + (v.y * newH) / 2,
  }

  return {
    x: (newCentre.x - newW / 2) / page.width,
    y: (newCentre.y - newH / 2) / page.height,
    width: newW / page.width,
    height: newH / page.height,
    rotation: box.rotation,
  }
}

function clampPx(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** A vector turned by `degrees` counter-clockwise: undoes a clockwise CSS rotation. */
export function unrotate(dx: number, dy: number, degrees: number) {
  const r = (degrees * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos }
}

/** Where a point of the box (in its own frame, from its top-left) lands on the page, in pixels. */
export function pointOnPage(
  box: PageBox,
  page: { width: number; height: number },
  local: { x: number; y: number },
) {
  const w = box.width * page.width
  const h = box.height * page.height
  const r = (box.rotation * Math.PI) / 180
  const cx = box.x * page.width + w / 2
  const cy = box.y * page.height + h / 2
  const dx = local.x - w / 2
  const dy = local.y - h / 2
  return {
    x: cx + dx * Math.cos(r) - dy * Math.sin(r),
    y: cy + dx * Math.sin(r) + dy * Math.cos(r),
  }
}
