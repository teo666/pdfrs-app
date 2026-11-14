import type { PdfPermissions } from 'pdfrs-editor'

/** The permissions of a protected PDF, in the order the Proteggi panel lists them. */
export const PERMISSIONS = [
  'print',
  'printHighQuality',
  'copy',
  'modify',
  'annotate',
  'fillForms',
  'assemble',
] as const satisfies readonly (keyof PdfPermissions)[]

/** Everything allowed: an unrestricted file. */
export const ALL_ALLOWED: PdfPermissions = {
  print: true,
  printHighQuality: true,
  copy: true,
  modify: true,
  annotate: true,
  fillForms: true,
  assemble: true,
}

/**
 * What `permissions` holds back, in panel order. High-quality printing
 * isn't listed on its own when printing is off: no printing says it all.
 */
export function deniedPermissions(permissions: PdfPermissions): (keyof PdfPermissions)[] {
  return PERMISSIONS.filter(
    (key) => !permissions[key] && !(key === 'printHighQuality' && !permissions.print),
  )
}
