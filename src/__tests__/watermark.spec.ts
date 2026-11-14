import { describe, expect, it } from 'vitest'

import { watermarkBox } from '@/lib/watermark'

const a4 = { width: 595, height: 842 }
const text = { width: 4, height: 1.2 }

describe('watermarkBox', () => {
  it('fits a horizontal line to 80% of the width, centred', () => {
    const box = watermarkBox(text, a4, { size: 'fit', angle: 0, position: 'center' })
    expect(box.width).toBeCloseTo(0.8)
    expect(box.x).toBeCloseTo(0.1)
    expect(box.y + box.height / 2).toBeCloseTo(0.5)
    expect(box.rotation).toBe(-0)
  })

  it('on the diagonal, keeps the turned box inside 80% of the page both ways', () => {
    const box = watermarkBox(text, a4, { size: 'fit', angle: 45, position: 'center' })
    const w = box.width * a4.width
    const h = box.height * a4.height
    const turnedWidth = (w + h) * Math.SQRT1_2
    const turnedHeight = (w + h) * Math.SQRT1_2
    expect(turnedWidth).toBeLessThanOrEqual(0.8 * a4.width + 1e-9)
    expect(turnedHeight).toBeLessThanOrEqual(0.8 * a4.height + 1e-9)
    expect(box.rotation).toBe(-45)
  })

  it('a size in points is the font size, the same on any page', () => {
    const box = watermarkBox(text, a4, { size: 50, angle: 0, position: 'center' })
    expect(box.width * a4.width).toBeCloseTo(200)
    expect(box.height * a4.height).toBeCloseTo(60)
  })

  it('at the top and at the bottom, 5% from the edge', () => {
    const top = watermarkBox(text, a4, { size: 50, angle: 0, position: 'top' })
    expect(top.y).toBeCloseTo(0.05)
    const bottom = watermarkBox(text, a4, { size: 50, angle: 0, position: 'bottom' })
    expect(bottom.y + bottom.height).toBeCloseTo(0.95)
  })
})
