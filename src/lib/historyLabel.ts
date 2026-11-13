import type { HistoryAction } from 'pdfrs-editor'

import { t } from '@/i18n'

const KINDS = ['text', 'signature', 'image']
const FIELDS = [
  'title',
  'author',
  'subject',
  'keywords',
  'creator',
  'producer',
  'creationDate',
  'modDate',
]
const PAGE_SIZES = ['a4', 'letter', 'native']

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/** "+90", "-90": a turn with its sign, as the steps show it. */
const signed = (degrees: number) => `${degrees > 0 ? '+' : ''}${degrees}`

/**
 * A history step in the app's language: its `action` translated through the
 * `history` messages, or the model's own (Italian) `label` for a step the
 * app doesn't know.
 */
export function historyLabel(entry: { label: string; action?: HistoryAction }): string {
  const action = entry.action
  if (!action) return entry.label
  const { type, params } = action
  const num = (name: string) => Number(params[name] ?? 0)
  const page = num('page')
  const count = num('count')
  const pages = num('pages')

  /** The annotation the step is about, lower case and capitalized; null if unknown. */
  const kind = () => {
    const value = String(params.kind ?? '')
    if (!KINDS.includes(value)) return null
    const what = t(`history.kinds.${value}`)
    return { what, What: capitalize(what) }
  }

  switch (type) {
    case 'open':
    case 'insertPhoto':
    case 'encrypt':
    case 'decrypt':
      return t(`history.${type}`)
    case 'movePage':
      return t('history.movePage', { page, position: num('position') })
    case 'rotatePage':
      return t('history.rotatePage', { page, degrees: signed(num('degrees')) })
    case 'resetRotation':
    case 'deletePage':
    case 'restorePage':
      return t(`history.${type}`, { page })
    case 'rotatePages':
      return t('history.rotatePages', { count, degrees: signed(num('degrees')) }, count)
    case 'deletePages':
    case 'restorePages':
      return t(`history.${type}`, { count }, count)
    case 'movePages':
      return t('history.movePages', { count, position: num('position') }, count)
    case 'insertPages':
    case 'insertFromDocument':
      return t(`history.${type}`, { count }, count)
    case 'photoPage': {
      const size = String(params.pageSize ?? '')
      if (!PAGE_SIZES.includes(size)) return entry.label
      return t(`history.photoPage.${size}`, { page })
    }
    case 'addAnnotation':
    case 'relinkAnnotation':
    case 'detachAnnotation': {
      const names = kind()
      return names ? t(`history.${type}`, { ...names, page }) : entry.label
    }
    case 'annotationOnAllPages': {
      const names = kind()
      return names ? t('history.annotationOnAllPages', { ...names, count }, count) : entry.label
    }
    case 'editAnnotation':
    case 'rotateAnnotation':
    case 'resizeAnnotation':
    case 'moveAnnotation':
    case 'removeAnnotation': {
      const names = kind()
      // One page, or the linked copies on several: the plural follows the pages.
      return names ? t(`history.${type}`, { ...names, page, pages }, pages) : entry.label
    }
    case 'removeImages':
    case 'restoreImages': {
      const where = pages === 1 ? 'onePage' : pages > 1 ? 'manyPages' : 'noPage'
      return t(`history.${type}.${where}`, { count, page, pages }, count)
    }
    case 'replaceImage': {
      const where = pages === 1 ? 'onePage' : pages > 1 ? 'manyPages' : 'noPage'
      return t(`history.replaceImage.${where}`, { page, pages })
    }
    case 'metadata': {
      const fields = String(params.fields ?? '')
        .split(',')
        .filter(Boolean)
      if (fields.length === 0 || fields.some((field) => !FIELDS.includes(field))) return entry.label
      return t('history.metadata', {
        fields: fields.map((field) => t(`history.fields.${field}`)).join(', '),
      })
    }
    case 'commit':
      return t('history.commit', { pages }, pages)
    default:
      return entry.label
  }
}
