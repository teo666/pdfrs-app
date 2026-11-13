import { describe, expect, it as test } from 'vitest'

import de from '@/i18n/locales/de'
import en from '@/i18n/locales/en'
import es from '@/i18n/locales/es'
import fr from '@/i18n/locales/fr'
import it from '@/i18n/locales/it'

type Tree = { [key: string]: string | Tree }

/** Every message, by its dotted key. */
function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out.set(path, value)
    else for (const [k, v] of flatten(value, path)) out.set(k, v)
  }
  return out
}

/** The placeholders a message uses ({name}, not literal ones like {'@'}). */
const placeholders = (message: string) =>
  [...message.matchAll(/\{\s*([A-Za-z_]\w*)\s*\}/g)].map((match) => match[1]).sort()

const source = flatten(it as unknown as Tree)

describe.each([
  ['en', en],
  ['es', es],
  ['de', de],
  ['fr', fr],
])('the %s messages', (_code, messages) => {
  const translated = flatten(messages as unknown as Tree)

  test('have exactly the Italian keys', () => {
    expect([...translated.keys()].sort()).toEqual([...source.keys()].sort())
  })

  test('are all filled in', () => {
    const empty = [...translated].filter(([, message]) => message.trim() === '').map(([key]) => key)
    expect(empty).toEqual([])
  })

  test('use the same placeholders and plural forms as the Italian', () => {
    const different = [...source].flatMap(([key, original]) => {
      const message = translated.get(key) ?? ''
      const samePlaceholders = placeholders(message).join() === placeholders(original).join()
      const sameForms = message.split('|').length === original.split('|').length
      return samePlaceholders && sameForms ? [] : [key]
    })
    expect(different).toEqual([])
  })
})
