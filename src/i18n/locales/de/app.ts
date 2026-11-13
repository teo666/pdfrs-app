import type { Messages } from '../it'

/** German messages: app. */
export default {
  /** The bar at the top, and what floats over the whole window. */
  header: {
    tagline: 'PDF-Editor im Browser',
    thumbSize: 'Größe der Vorschaubilder',
    openFiles: 'Dateien öffnen',
    dropToOpen: 'Zum Öffnen loslassen',
    closeNotice: 'Hinweis schließen',
    closeError: 'Schließen',
  },
  /** The open documents, on the left. */
  documents: {
    title: 'Dokumente',
    openFiles: 'Dateien öffnen',
    newName: 'Neuer Name für {name}',
    locked: 'Passwortgeschützt',
    lockedTitle: '{name} (passwortgeschützt)',
    pending: 'Nicht angewendete Änderungen',
    rename: '{name} umbenennen',
    renameHint: 'Umbenennen (auch per Doppelklick auf den Namen)',
    close: '{name} schließen',
    thumbnails: 'Vorschaubilder von {name}',
    empty: 'Kein Dokument geöffnet.',
    loading: 'Wird verarbeitet…',
    dropHint:
      'Auf einem anderen Dokument loslassen, um die Seiten zu verschieben (⌥/Alt gedrückt halten, um sie zu kopieren)',
  },
  /** The bar above the pages. */
  toolbar: {
    newName: 'Neuer Name für {name}',
    rename: '{name} umbenennen',
    renameHint: 'Umbenennen (auch per Doppelklick auf den Namen)',
    summary: '1 Seite | {n} Seiten',
    summaryDeleted: '1 Seite · {deleted} zu löschen | {n} Seiten · {deleted} zu löschen',
    pending: '· nicht angewendete Änderungen',
    undo: 'Rückgängig',
    undoTitle: 'Rückgängig ({shortcut})',
    redo: 'Wiederholen',
    redoTitle: 'Wiederholen ({shortcut})',
    insert: 'Seiten einfügen',
    insertAfterSelection:
      'Seiten aus einer PDF- oder JPEG-Datei nach der letzten ausgewählten Seite einfügen',
    insertAtEnd: 'Seiten aus einer PDF- oder JPEG-Datei am Ende des Dokuments einfügen',
    apply: 'Änderungen anwenden',
    applyTitle: 'Drehungen, Löschungen und neue Reihenfolge auf das Dokument anwenden',
    download: 'Herunterladen',
    downloadTitle: 'Das PDF mit den Änderungen herunterladen, auch den noch nicht angewendeten',
    selectionActions: 'Aktionen für die ausgewählten Seiten',
    selected: '1 Seite ausgewählt | {n} Seiten ausgewählt',
    selectAll: 'Alle auswählen',
    deselect: 'Auswahl aufheben',
    deselectTitle: 'Auswahl aufheben (Esc)',
    rotateLeft: 'Ausgewählte Seiten nach links drehen',
    rotateRight: 'Ausgewählte Seiten nach rechts drehen',
    delete: 'Löschen',
    deleteTitle: 'Zum Löschen markieren (Entf)',
    restore: 'Wiederherstellen',
    extract: 'In neues Dokument extrahieren',
    extractTitle:
      'Die ausgewählten Seiten so, wie sie jetzt aussehen, in ein neues Dokument kopieren',
  },
  /** The grid of pages. */
  grid: {
    /** Follows the pointer while several pages are dragged. */
    dragCount: '{n} Seiten',
  },
  /** One page's card in the grid. */
  card: {
    page: 'Seite {n}',
    pageMoved: 'Seite {n} (vorher {was})',
    /** The same, inside a sentence. */
    pageInline: 'Seite {n}',
    pageInlineMoved: 'Seite {n} (vorher {was})',
    select: '{page} auswählen',
    open: '{page} in voller Größe öffnen',
    openTitle: 'Seite im Detail ansehen (Eingabetaste oder Doppelklick)',
    toDelete: 'Zu löschen',
    rotateLeft: 'Nach links drehen',
    rotateRight: 'Nach rechts drehen',
    delete: 'Seite löschen',
    restore: 'Seite wiederherstellen',
    originalPosition: 'Ursprüngliche Position',
    was: 'vorher {n}',
    part: 'Teil {n}',
    excluded: 'ausgelassen',
  },
  /** Sizes and page lists (lib/format.ts). */
  format: {
    bytes: '{n} Byte',
    kilobytes: '{n} KB',
    megabytes: '{n} MB',
    pages: 'Seite {ranges} | Seiten {ranges}',
  },
} satisfies Messages['app']
