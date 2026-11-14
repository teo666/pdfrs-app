import type { Messages } from '../it'

/** German messages: store. */
export default {
  /** What went wrong, as the error bar shows it. */
  errors: {
    notPdfOrJpeg: '{name}: weder ein PDF noch ein JPEG-Bild',
    insertProtected:
      '{name} ist passwortgeschützt: öffne und entsperre es, dann füge die entsperrte Kopie ein',
    noDocument: 'kein Dokument',
    noActiveDocument: 'kein aktives Dokument',
    emptyDocument:
      'das Dokument wäre leer: mach vor dem Bestätigen mindestens eine Löschung rückgängig',
    wrongPassword: 'falsches Passwort',
    jpegColorSpace: 'JPEG-Farbraum nicht unterstützt: {space} (unterstützt: RGB, Graustufen)',
    invalidJpeg: 'kein gültiges JPEG: {detail}',
    imageDecode: 'das Bild kann nicht dekodiert werden',
    imageDraw: 'das Bild kann nicht gezeichnet werden',
  },
  /** What just happened, as the notice at the bottom says it. */
  notices: {
    merged: '{n} Dokumente verbunden: die Originale bleiben geöffnet',
    inserted: '1 Seite eingefügt | {n} Seiten eingefügt',
    watermarked: 'Wasserzeichen auf 1 Seite gesetzt | Wasserzeichen auf {n} Seiten gesetzt',
    blankPage: 'Leere Seite an Position {position} eingefügt',
    moved: '1 Seite nach „{target}“ verschoben | {n} Seiten nach „{target}“ verschoben',
    copied: '1 Seite nach „{target}“ kopiert | {n} Seiten nach „{target}“ kopiert',
    created: '„{name}“ erstellt: das Original bleibt unverändert',
    split: '1 Dokument erstellt | {n} Dokumente erstellt: das Original bleibt unverändert',
    extracted: '1 Seite in „{name}“ | {n} Seiten in „{name}“',
    protected: '„{name}“ erstellt, passwortgeschützt: das Original bleibt unverändert',
    unlocked: '„{name}“ erstellt, ohne Passwort',
    imageReplaced: 'Bild ersetzt | Bild auf {n} Seiten ersetzt',
    /** `before`/`after`: the file's size, formatted. */
    compressed: '„{name}“ erstellt: von {before} auf {after} (−{percent} %)',
    nothingToCompress: 'Auf dieser Stufe wird kein Bild kleiner: Die Datei bleibt, wie sie ist',
  },
  /** The buttons on the notices. */
  actions: {
    open: 'Öffnen',
    backToOriginal: 'Zurück zum Original',
    backToProtected: 'Zurück zum geschützten',
  },
  /** Names given to the documents and files the app makes. */
  names: {
    merged: '{n} Dokumente verbunden.pdf',
    nup: '{base} ({n} pro Blatt).pdf',
    booklet: '{base} (Broschüre).pdf',
    part: '{base} (Teil {index} von {total}).pdf',
    extracted: '{base} (Auszug).pdf',
    protected: '{base} (geschützt).pdf',
    unlocked: '{base} (entsperrt).pdf',
    image: '{base} - Bild {n}.{extension}',
    signature: 'Unterschrift {n}',
    compressed: '{base} (komprimiert).pdf',
  },
  /** Adding signatures and images to the library. */
  library: {
    whiteBackground: 'Der weiße Hintergrund des Bildes wurde transparent gemacht.',
    unreadable: 'Bild nicht lesbar: {reason}',
  },
} satisfies Messages['store']
