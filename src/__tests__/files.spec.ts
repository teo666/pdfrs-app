import { describe, expect, it } from 'vitest'

import { detectKind, pdfFileName } from '@/lib/files'

const bytes = (...values: number[]) => new Uint8Array(values)

describe('detectKind', () => {
  it('recognizes a PDF by its header', () => {
    expect(detectKind(new TextEncoder().encode('%PDF-1.7\n'))).toBe('pdf')
  })

  it('recognizes a JPEG by its SOI marker', () => {
    expect(detectKind(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg')
  })

  it('rejects anything else, including truncated headers', () => {
    expect(detectKind(bytes(0x89, 0x50, 0x4e, 0x47))).toBeNull() // PNG
    expect(detectKind(new TextEncoder().encode('%PD'))).toBeNull()
    expect(detectKind(bytes())).toBeNull()
  })
})

describe('pdfFileName', () => {
  it('keeps a PDF name and turns an image name into a PDF one', () => {
    expect(pdfFileName('contratto.pdf')).toBe('contratto.pdf')
    expect(pdfFileName('foto.JPG')).toBe('foto.pdf')
    expect(pdfFileName('scan.jpeg')).toBe('scan.pdf')
    expect(pdfFileName('senza-estensione')).toBe('senza-estensione.pdf')
  })
})
