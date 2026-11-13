import { currentLocale } from '@/i18n'

/**
 * PDF dates (`D:YYYYMMDDHHmmSSOHH'mm'`) to and from what a
 * `<input type="datetime-local">` holds (`YYYY-MM-DDTHH:mm`, local time).
 *
 * In a PDF date everything after the year is optional, and the offset is
 * `Z`, or `+HH'mm'` / `-HH'mm'` (apostrophes optional). Without an offset
 * the time is taken as local, which is what the spec leaves it as: unknown.
 */
const PDF_DATE =
  /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:(Z)|([+-])(\d{2})'?(\d{2})?'?)?$/

/** The moment a PDF date names, or null when it isn't one (real PDFs hold all sorts). */
export function parsePdfDate(value: string): Date | null {
  const match = PDF_DATE.exec(value.trim())
  if (!match) return null
  const [, year, month = '01', day = '01', hour = '00', minute = '00', second = '00'] = match
  const [z, sign, offH, offM = '00'] = match.slice(7)
  const fields = [year, month, day, hour, minute, second].map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ]
  const [y, mo, d, h, mi, s] = fields
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null

  if (!z && !sign) return new Date(y, mo - 1, d, h, mi, s)
  const offset = z ? 0 : (sign === '-' ? -1 : 1) * (Number(offH) * 60 + Number(offM))
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s) - offset * 60_000)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** A moment as a `datetime-local` value, in local time. */
export function toDatetimeLocal(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/** A `datetime-local` value as a PDF date, with the local offset of that moment; null if it isn't one. */
export function fromDatetimeLocal(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return null
  const [, y, mo, d, h, mi, s = '00'] = match
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s))
  // getTimezoneOffset is minutes *behind* UTC: Rome in winter is -60.
  const offset = -date.getTimezoneOffset()
  const sign = offset < 0 ? '-' : '+'
  const abs = Math.abs(offset)
  return `D:${y}${mo}${d}${h}${mi}${s}${sign}${pad(Math.floor(abs / 60))}'${pad(abs % 60)}'`
}

/** A PDF date as people read it ("15 gennaio 2024, 10:30"), or the raw string if it can't be read. */
export function formatPdfDate(value: string): string {
  const date = parsePdfDate(value)
  if (!date) return value
  return date.toLocaleString(currentLocale(), { dateStyle: 'long', timeStyle: 'short' })
}
