/** Italian messages: history. */
export default {
  // The steps, one per `HistoryAction` type (see lib/historyLabel.ts). They
  // reproduce, word for word, the Italian labels pdfrs-editor gives them.
  open: 'Documento aperto',
  movePage: 'Sposta pagina {page} in posizione {position}',
  rotatePage: 'Ruota pagina {page} di {degrees}°',
  resetRotation: 'Azzera rotazione pagina {page}',
  deletePage: 'Elimina pagina {page}',
  restorePage: 'Ripristina pagina {page}',
  rotatePages: 'Ruota {count} pagine di {degrees}°',
  deletePages: 'Elimina {count} pagine',
  restorePages: 'Ripristina {count} pagine',
  movePages: 'Sposta {count} pagine in posizione {position}',
  insertPages: 'Inserisci 1 pagina | Inserisci {count} pagine',
  insertFromDocument:
    'Inserisci 1 pagina da un altro documento | Inserisci {count} pagine da un altro documento',
  insertPhoto: 'Inserisci foto',
  photoPage: {
    a4: 'Foto su A4 (pagina {page})',
    letter: 'Foto su Letter (pagina {page})',
    native: 'Foto a dimensione reale (pagina {page})',
  },
  addAnnotation: 'Aggiungi {what} a pagina {page}',
  relinkAnnotation: '{What} di nuovo come le altre copie a pagina {page}',
  annotationOnAllPages: '{What} su tutte le pagine ({count})',
  detachAnnotation: '{What} modificabile solo a pagina {page}',
  editAnnotation: 'Modifica {what} a pagina {page} | Modifica {what} su {pages} pagine',
  rotateAnnotation: 'Ruota {what} a pagina {page} | Ruota {what} su {pages} pagine',
  resizeAnnotation: 'Ridimensiona {what} a pagina {page} | Ridimensiona {what} su {pages} pagine',
  moveAnnotation: 'Sposta {what} a pagina {page} | Sposta {what} su {pages} pagine',
  removeAnnotation: 'Rimuovi {what} da pagina {page} | Rimuovi {what} da {pages} pagine',
  removeImages: {
    onePage: 'Rimuovi immagine (pagina {page}) | Rimuovi {count} immagini (pagina {page})',
    manyPages: 'Rimuovi immagine da {pages} pagine | Rimuovi {count} immagini da {pages} pagine',
    noPage: 'Rimuovi immagine | Rimuovi {count} immagini',
  },
  restoreImages: {
    onePage: 'Ripristina immagine (pagina {page}) | Ripristina {count} immagini (pagina {page})',
    manyPages:
      'Ripristina immagine da {pages} pagine | Ripristina {count} immagini da {pages} pagine',
    noPage: 'Ripristina immagine | Ripristina {count} immagini',
  },
  replaceImage: {
    onePage: 'Sostituisci immagine (pagina {page})',
    manyPages: 'Sostituisci immagine su {pages} pagine',
    noPage: 'Sostituisci immagine',
  },
  metadata: 'Modifica metadati ({fields})',
  commit: 'Applica modifiche ({pages} pagine)',
  encrypt: 'Cifra documento',
  decrypt: 'Decifra documento',

  /** What an annotation is, inside a step. */
  kinds: {
    text: 'testo',
    signature: 'firma',
    image: 'immagine',
  },
  /** The document properties, inside "Modifica metadati (…)". */
  fields: {
    title: 'titolo',
    author: 'autore',
    subject: 'oggetto',
    keywords: 'parole chiave',
    creator: 'creatore',
    producer: 'producer',
    creationDate: 'data creazione',
    modDate: 'data modifica',
  },

  /** The Cronologia tool. */
  panel: {
    intro:
      'Ogni modifica fatta al documento, dalla più recente. Fai clic su un passo per tornare a quel punto; i passi annullati restano qui finché non fai una nuova modifica.',
    noDocument: 'Apri un documento per vederne la cronologia.',
    undone:
      '1 passo annullato: si possono ancora ripetere. | {n} passi annullati: si possono ancora ripetere.',
    list: 'Cronologia delle modifiche',
    current: 'Il documento è a questo punto',
    redoTo: 'Ripeti fino a qui',
    goTo: 'Torna a questo punto',
    undoneTag: 'annullato',
    shortcuts: 'Annulla e ripeti anche con {shortcuts}. Si tengono gli ultimi 50 passi.',
  },
}
