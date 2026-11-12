import { describe, expect, it } from 'vitest'

import { pointOnPage, resizeBox, type PageBox } from '@/lib/box'

const page = { width: 600, height: 800 }
const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 6)
  expect(a.y).toBeCloseTo(b.y, 6)
}

describe('resizeBox', () => {
  it('upright: only the size changes, the top-left corner stays', () => {
    const box: PageBox = { x: 0.1, y: 0.2, width: 0.3, height: 0.1, rotation: 0 }
    expect(resizeBox(box, 'stretch-x', { x: 60, y: 0 }, page)).toMatchObject({
      x: 0.1,
      y: 0.2,
      height: 0.1,
    })
    expect(resizeBox(box, 'stretch-x', { x: 60, y: 0 }, page).width).toBeCloseTo(0.4)
    expect(resizeBox(box, 'stretch-y', { x: 0, y: 80 }, page).height).toBeCloseTo(0.2)
    const bigger = resizeBox(box, 'resize', { x: 90, y: 0 }, page)
    expect(bigger.width).toBeCloseTo(0.45)
    expect(bigger.height).toBeCloseTo(0.15) // same proportions
  })

  for (const rotation of [30, 90, -45, 180]) {
    it(`turned ${rotation}°: the side opposite the handle stays put on the page`, () => {
      const box: PageBox = { x: 0.3, y: 0.4, width: 0.3, height: 0.1, rotation }
      const w = box.width * page.width
      const h = box.height * page.height

      // Right handle: the left side (both its corners) doesn't move.
      const wider = resizeBox(box, 'stretch-x', { x: 50, y: 0 }, page)
      close(pointOnPage(wider, page, { x: 0, y: 0 }), pointOnPage(box, page, { x: 0, y: 0 }))
      close(pointOnPage(wider, page, { x: 0, y: h }), pointOnPage(box, page, { x: 0, y: h }))
      expect(wider.height).toBeCloseTo(box.height)

      // Bottom handle: the top side doesn't move.
      const taller = resizeBox(box, 'stretch-y', { x: 0, y: 40 }, page)
      close(pointOnPage(taller, page, { x: 0, y: 0 }), pointOnPage(box, page, { x: 0, y: 0 }))
      close(pointOnPage(taller, page, { x: w, y: 0 }), pointOnPage(box, page, { x: w, y: 0 }))
      expect(taller.width).toBeCloseTo(box.width)

      // Corner: the opposite corner doesn't move, proportions kept.
      const bigger = resizeBox(box, 'resize', { x: 60, y: 0 }, page)
      close(pointOnPage(bigger, page, { x: 0, y: 0 }), pointOnPage(box, page, { x: 0, y: 0 }))
      expect((bigger.height * page.height) / (bigger.width * page.width)).toBeCloseTo(h / w)
    })
  }

  it('never shrinks below the minimum size', () => {
    const box: PageBox = { x: 0.1, y: 0.1, width: 0.3, height: 0.1, rotation: 0 }
    expect(resizeBox(box, 'stretch-x', { x: -1000, y: 0 }, page).width).toBeCloseTo(0.03)
    expect(resizeBox(box, 'stretch-y', { x: 0, y: -1000 }, page).height).toBeCloseTo(0.01)
  })

  it('with Shift, keeps the centre and grows on both sides', () => {
    for (const rotation of [0, 35, 90]) {
      const box: PageBox = { x: 0.3, y: 0.4, width: 0.3, height: 0.1, rotation }
      const w = box.width * page.width
      const h = box.height * page.height
      const centre = pointOnPage(box, page, { x: w / 2, y: h / 2 })

      const wider = resizeBox(box, 'stretch-x', { x: 30, y: 0 }, page, true)
      expect(wider.width * page.width).toBeCloseTo(w + 60) // both sides moved 30
      close(pointOnPage(wider, page, { x: (wider.width * page.width) / 2, y: h / 2 }), centre)

      const taller = resizeBox(box, 'stretch-y', { x: 0, y: 20 }, page, true)
      expect(taller.height * page.height).toBeCloseTo(h + 40)
      close(pointOnPage(taller, page, { x: w / 2, y: (taller.height * page.height) / 2 }), centre)

      const bigger = resizeBox(box, 'resize', { x: 30, y: 0 }, page, true)
      const bw = bigger.width * page.width
      const bh = bigger.height * page.height
      expect(bw).toBeCloseTo(w + 60)
      expect(bh / bw).toBeCloseTo(h / w)
      close(pointOnPage(bigger, page, { x: bw / 2, y: bh / 2 }), centre)
    }
  })
})
