import type { Messages } from '../it'

/** German messages: history. */
export default {
  // The steps, one per `HistoryAction` type (see lib/historyLabel.ts).
  open: 'Dokument geöffnet',
  movePage: 'Seite {page} an Position {position} verschieben',
  rotatePage: 'Seite {page} um {degrees}° drehen',
  resetRotation: 'Drehung von Seite {page} zurücksetzen',
  deletePage: 'Seite {page} löschen',
  restorePage: 'Seite {page} wiederherstellen',
  rotatePages: '{count} Seiten um {degrees}° drehen',
  deletePages: '{count} Seiten löschen',
  restorePages: '{count} Seiten wiederherstellen',
  movePages: '{count} Seiten an Position {position} verschieben',
  insertPages: '1 Seite einfügen | {count} Seiten einfügen',
  insertFromDocument:
    '1 Seite aus einem anderen Dokument einfügen | {count} Seiten aus einem anderen Dokument einfügen',
  insertPhoto: 'Foto einfügen',
  photoPage: {
    a4: 'Foto auf A4 (Seite {page})',
    letter: 'Foto auf Letter (Seite {page})',
    native: 'Foto in Originalgröße (Seite {page})',
  },
  addAnnotation: '{what} auf Seite {page} hinzufügen',
  relinkAnnotation: '{What} auf Seite {page} wieder wie die anderen Kopien',
  annotationOnAllPages: '{What} auf allen Seiten ({count})',
  detachAnnotation: '{What} nur auf Seite {page} bearbeitbar',
  editAnnotation: '{what} auf Seite {page} bearbeiten | {what} auf {pages} Seiten bearbeiten',
  rotateAnnotation: '{what} auf Seite {page} drehen | {what} auf {pages} Seiten drehen',
  resizeAnnotation:
    'Größe von {what} auf Seite {page} ändern | Größe von {what} auf {pages} Seiten ändern',
  moveAnnotation: '{what} auf Seite {page} verschieben | {what} auf {pages} Seiten verschieben',
  removeAnnotation: '{what} von Seite {page} entfernen | {what} von {pages} Seiten entfernen',
  removeImages: {
    onePage: 'Bild entfernen (Seite {page}) | {count} Bilder entfernen (Seite {page})',
    manyPages: 'Bild von {pages} Seiten entfernen | {count} Bilder von {pages} Seiten entfernen',
    noPage: 'Bild entfernen | {count} Bilder entfernen',
  },
  restoreImages: {
    onePage:
      'Bild wiederherstellen (Seite {page}) | {count} Bilder wiederherstellen (Seite {page})',
    manyPages:
      'Bild auf {pages} Seiten wiederherstellen | {count} Bilder auf {pages} Seiten wiederherstellen',
    noPage: 'Bild wiederherstellen | {count} Bilder wiederherstellen',
  },
  metadata: 'Metadaten bearbeiten ({fields})',
  commit: 'Änderungen anwenden ({pages} Seiten)',
  encrypt: 'Dokument verschlüsseln',
  decrypt: 'Dokument entschlüsseln',

  /** What an annotation is, inside a step. */
  kinds: {
    text: 'Text',
    signature: 'Unterschrift',
    image: 'Bild',
  },
  /** The document properties, inside "Metadaten bearbeiten (…)". */
  fields: {
    title: 'Titel',
    author: 'Autor',
    subject: 'Betreff',
    keywords: 'Stichwörter',
    creator: 'Ersteller',
    producer: 'Producer',
    creationDate: 'Erstellungsdatum',
    modDate: 'Änderungsdatum',
  },

  /** The history tool. */
  panel: {
    intro:
      'Jede Änderung am Dokument, die neueste zuerst. Klick auf einen Schritt, um zu diesem Punkt zurückzukehren; rückgängig gemachte Schritte bleiben hier, bis du eine neue Änderung machst.',
    noDocument: 'Öffne ein Dokument, um seinen Verlauf zu sehen.',
    undone:
      '1 Schritt rückgängig gemacht: er kann noch wiederholt werden. | {n} Schritte rückgängig gemacht: sie können noch wiederholt werden.',
    list: 'Verlauf der Änderungen',
    current: 'Das Dokument ist an diesem Punkt',
    redoTo: 'Bis hierher wiederholen',
    goTo: 'Zu diesem Punkt zurück',
    undoneTag: 'rückgängig',
    shortcuts:
      'Rückgängig und Wiederholen auch mit {shortcuts}. Die letzten 50 Schritte werden behalten.',
  },
} satisfies Messages['history']
