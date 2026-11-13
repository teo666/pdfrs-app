import { createI18n } from 'vue-i18n'

import it, { type Messages } from './locales/it'

/** The languages the app speaks, by code, with their names as their speakers write them. */
export const LOCALES = [
  { code: 'it', name: 'Italiano' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
] as const
export type Locale = (typeof LOCALES)[number]['code']
const CODES: readonly string[] = LOCALES.map((locale) => locale.code)
const LOCALE_KEY = 'pdfrs.locale'

/** The language chosen before, else the browser's first one the app speaks, else English. */
export function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved && CODES.includes(saved)) return saved as Locale
  } catch {
    /* no storage */
  }
  const wanted =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  for (const tag of wanted) {
    const code = tag?.slice(0, 2).toLowerCase()
    if (code && CODES.includes(code)) return code as Locale
  }
  return 'en'
}

const messages: Record<Locale, Messages> = { it, en: it, es: it, de: it, fr: it }

export const i18n = createI18n<[Messages], Locale, false>({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  messages,
})

/** Switches the whole app to `locale`, and remembers it. */
export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') document.documentElement.lang = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    /* not kept: fine */
  }
}

/** The language in use. */
export const currentLocale = () => i18n.global.locale.value

/** For code outside components (the store, lib/): the app's translation function. */
export const t = i18n.global.t
