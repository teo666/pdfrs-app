import type { Messages } from '../it'

/** German messages: tools. */
export default {
  /** Shared by several tools. */
  common: {
    pages: '1 Seite | {n} Seiten',
    placeOnPage: 'Auf Seite {page} setzen',
    placeNamedOnPage: '„{name}“ auf Seite {page} setzen',
    removeFromLibrary: '„{name}“ aus der Bibliothek entfernen',
    removeFromLibraryHint:
      'Aus der Bibliothek entfernen (bleibt auf den Seiten, auf die du es schon gesetzt hast)',
    uploadImage: 'Bild hochladen',
    /** `items` is e.g. "2 Unterschriften", `pages` e.g. "1 Seite". */
    placed:
      '{items} auf {pages}: sie kommen ins PDF, wenn du die Änderungen anwendest oder es herunterlädst.',
    borders: 'Rahmen um jede Seite',
    margin: 'Rand (mm)',
  },

  rail: {
    navLabel: 'Werkzeuge',
    sign: {
      label: 'Signieren',
      hint: 'Unterschrift: zeichne oder lade eine Unterschrift hoch und setz sie auf die Seiten',
    },
    image: { label: 'Bild', hint: 'Bild: ein Logo, ein Stempel oder ein Foto auf den Seiten' },
    text: {
      label: 'Text',
      hint: 'Text: auf die Seiten schreiben, mit echtem, auswählbarem Text',
    },
    watermark: { label: 'Wasserzeichen', hint: 'Wasserzeichen: ein Text wie „ENTWURF“ auf allen oder den ausgewählten Seiten' },
    merge: { label: 'Verbinden', hint: 'Mehrere Dokumente zu einem verbinden' },
    split: { label: 'Aufteilen', hint: 'Das Dokument in mehrere Teile aufteilen' },
    nup: {
      label: 'N pro Blatt',
      hint: 'Mehrere Seiten auf jedem Blatt, um mit weniger Papier zu drucken',
    },
    booklet: {
      label: 'Broschüre',
      hint: 'Broschüre zum beidseitigen Drucken und Falten in der Mitte',
    },
    outline: {
      label: 'Inhalt',
      hint: 'Inhaltsverzeichnis des Dokuments: die Lesezeichen, um zu den Seiten zu springen',
    },
    images: {
      label: 'Bilder',
      hint: 'Die Bilder, die schon im PDF sind: ansehen, herunterladen, ersetzen, entfernen oder komprimieren',
    },
    protect: {
      label: 'Schützen',
      hint: 'Mit Passwort schützen: eine Kopie, die sich nur mit dem Passwort öffnet',
    },
    properties: {
      label: 'Details',
      hint: 'Eigenschaften des Dokuments: Titel, Autor, Betreff, Stichwörter',
    },
    history: {
      label: 'Verlauf',
      hint: 'Verlauf der Änderungen: zu jedem beliebigen Schritt zurück',
    },
  },

  panel: {
    titles: {
      sign: 'Unterschrift',
      image: 'Bild',
      text: 'Text',
      merge: 'Dokumente verbinden',
      split: 'Dokument aufteilen',
      nup: 'Mehrere Seiten pro Blatt',
      booklet: 'Broschüre',
      protect: 'Mit Passwort schützen',
      properties: 'Dokumenteigenschaften',
      images: 'Bilder des Dokuments',
      history: 'Verlauf der Änderungen',
      outline: 'Inhaltsverzeichnis',
      watermark: 'Wasserzeichen',
    },
    close: 'Bereich schließen',
    locked: '„{name}“ ist passwortgeschützt: entsperre es, um dieses Werkzeug zu verwenden.',
  },

  scope: {
    /** `target` is one of the two below, shown in bold. */
    appliesTo: 'Gilt für {target}',
    selected: 'die ausgewählte Seite | die {n} ausgewählten Seiten',
    all: 'die einzige Seite | alle {n} Seiten',
    hint: '(wähle Seiten aus, um nur einige davon zu verwenden)',
  },

  sign: {
    intro:
      'Zeichne deine Unterschrift oder lade sie hoch, dann setz sie auf eine Seite: die Seite öffnet sich groß, und dort kannst du sie verschieben, ihre Größe ändern, sie drehen und, wenn du willst, gleich auf alle Seiten setzen.',
    noDocument: 'Öffne ein Dokument, um es zu unterschreiben.',
    yours: 'Deine Unterschriften',
    draw: 'Unterschrift zeichnen',
    placedCount: '1 Unterschrift | {n} Unterschriften',
    privacy:
      'Die Unterschriften bleiben nur in diesem Browser-Tab und werden nirgends gespeichert.',
  },

  image: {
    intro:
      'Ein Logo, ein Stempel oder ein Foto auf den Seiten: lade es hoch, dann setz es auf eine Seite. Die Seite öffnet sich groß, und dort kannst du es verschieben, seine Größe ändern, es drehen und, wenn du willst, gleich auf alle Seiten setzen.',
    noDocument: 'Öffne ein Dokument, um Bilder einzufügen.',
    yours: 'Deine Bilder',
    formats:
      'PNG, JPEG, WebP oder GIF. Die Transparenz von PNGs bleibt erhalten; Bilder über 1600 Pixel werden verkleinert.',
    placedCount: '1 Bild | {n} Bilder',
  },

  watermark: {
    intro: 'Ein Text quer über die Seiten, etwa „ENTWURF“ oder „VERTRAULICH“. Er kommt sofort ins Dokument, die Miniaturen zeigen ihn, wie er wird; Rückgängig oder der Verlauf entfernen ihn.',
    noDocument: 'Öffne ein Dokument, um ein Wasserzeichen hinzuzufügen.',
    defaultText: 'ENTWURF',
    size: 'Größe',
    sizeFit: 'An Seite anpassen',
    sizePoints: 'Fest',
    sizeLabel: 'Größe in Punkt',
    angle: 'Neigung',
    angles: {
      rising: 'Diagonal, steigend',
      horizontal: 'Waagerecht',
      falling: 'Diagonal, fallend',
      vertical: 'Senkrecht',
    },
    opacity: 'Deckkraft',
    position: 'Position',
    positions: {
      top: 'Oben',
      center: 'Mitte',
      bottom: 'Unten',
    },
    layer: 'Ebene',
    layers: {
      over: 'Über dem Inhalt',
      under: 'Unter dem Inhalt',
    },
    underHint: 'Unter dem Inhalt verdeckt es keinen Text, ist aber auf Seiten mit vollem Hintergrund, etwa Scans, nicht zu sehen.',
    preview: 'Vorschau des Wasserzeichens auf Seite {page}',
    submit: 'Wasserzeichen anwenden',
  },

  text: {
    intro:
      'Echter Text auf den Seiten, im PDF auswählbar und durchsuchbar. Schreib ihn hier und setz ihn dann auf eine Seite: die Seite öffnet sich groß, und dort kannst du ihn verschieben, seine Größe ändern, ihn drehen und, wenn du willst, gleich auf alle Seiten setzen. Per Doppelklick bearbeitest du ihn.',
    noDocument: 'Öffne ein Dokument, um darauf zu schreiben.',
    preview: 'Textvorschau',
    placedCount: '1 Text | {n} Texte',
    fonts:
      'Standardschriften von PDF (Helvetica, Times, Courier): keine Schrift wird eingebettet, und die Zeichen sind die der westeuropäischen Sprachen.',
  },

  merge: {
    intro:
      'Die Dokumente werden so verbunden, wie sie jetzt aussehen (mit neuer Reihenfolge, Drehungen, Löschungen und Unterschriften), in der Reihenfolge der Liste. Das Ergebnis öffnet sich als neues Dokument; die Originale bleiben geöffnet.',
    picked: 'Zu verbinden, in dieser Reihenfolge',
    empty: 'Kein Dokument: füge mindestens zwei aus der Liste unten hinzu.',
    moveUp: '{name} nach oben',
    moveDown: '{name} nach unten',
    remove: '{name} aus der Verbindung entfernen',
    others: 'Andere geöffnete Dokumente',
    add: '{name} zur Verbindung hinzufügen',
    openMore: 'Weitere Dateien zum Verbinden öffnen',
    pickTwo: 'Wähle mindestens zwei Dokumente',
    submit: '{documents} Dokumente verbinden ({pages} Seiten)',
  },

  split: {
    intro:
      'Teilt das Dokument in mehrere Teile: jeder wird ein neues Dokument, mit den Seiten so, wie sie jetzt aussehen. Das Original ändert sich nicht.',
    noDocument: 'Öffne ein Dokument, um es aufzuteilen.',
    mode: 'Wie aufteilen',
    modes: {
      every: { label: 'Alle N', title: 'Teile mit je N Seiten' },
      ranges: { label: 'Bereiche', title: 'Bereiche eingeben, z. B. 1-3, 4-8' },
      selection: { label: 'Auswahl', title: 'Jede ausgewählte Seite beginnt einen neuen Teil' },
    },
    size: 'Seiten pro Teil',
    sizeHint: '1 = ein Dokument pro Seite',
    ranges: 'Bereiche, einer pro Teil',
    rangesPlaceholder: 'z. B. 1-3, 4-8, 9-{total}',
    rangesLabel: 'Seitenbereiche',
    rangesHint: 'Seitenzahlen wie auf den Vorschaubildern; eine einzelne Seite zählt als Teil.',
    selectionHint:
      'Wähle die Seiten aus, mit denen jeder neue Teil beginnen soll: der erste Teil beginnt immer mit Seite 1.',
    selected: 'Ausgewählt: {pages}.',
    parts: 'Teile',
    partsCount: '1 Teil | {n} Teile',
    part: 'Teil {number}: {range}',
    onePage: 'Seite {start}',
    pageRange: 'Seiten {start}–{end}',
    more: '… und {count} weitere Teile',
    missing: 'In keinem Teil enthalten: Seite {pages}. | In keinem Teil enthalten: Seiten {pages}.',
    deletions: 'Die zum Löschen markierten Seiten werden weggelassen.',
    submit: '1 Dokument erstellen | In {n} Dokumente aufteilen',
    submitNone: 'Gib an, wie aufgeteilt wird',
    /** Ranges typed by hand that can't be read (lib/split.ts). */
    errors: {
      notRange: '„{token}“ ist kein Bereich (z. B. 1-3 oder 5)',
      outOfRange: '„{token}“: das Dokument hat die Seiten 1 bis {total}',
      reversed: '„{token}“: die erste Seite kommt nach der letzten',
    },
  },

  nup: {
    intro:
      'Mehrere verkleinerte Seiten auf jedem Blatt: um ein langes Dokument mit weniger Papier zu drucken. Das Ergebnis ist ein neues Dokument; das Original ändert sich nicht.',
    noDocument: 'Öffne ein Dokument, um es anzuordnen.',
    perSheet: 'Seiten pro Blatt',
    schema: 'Schema des Blatts',
    gridLandscape: '{cols} × {rows}, Blatt im Querformat',
    gridPortrait: '{cols} × {rows}, Blatt im Hochformat',
    sheetSize: 'Blattformat',
    native: 'Wie das Original',
    orientation: 'Ausrichtung',
    orientations: {
      auto: { label: 'Automatisch', title: 'Die, die das Blatt am besten ausnutzt' },
      portrait: 'Hochformat',
      landscape: 'Querformat',
    },
    order: 'Reihenfolge der Seiten',
    byRows: 'Zeilenweise',
    byColumns: 'Spaltenweise',
    moreOptions: 'Ränder und weitere Optionen',
    spacing: 'Abstand zwischen Seiten (mm)',
    autoRotate: 'Seiten drehen, wenn sie so größer werden',
    submit: 'Dokument erstellen (1 Blatt) | Dokument erstellen ({n} Blätter)',
  },

  booklet: {
    intro:
      'Eine Broschüre zum beidseitigen Drucken und Falten in der Mitte: die Seiten werden so umsortiert, dass sie nach dem Falten der Blätter in der richtigen Reihenfolge zu lesen sind. Das Ergebnis ist ein neues Dokument.',
    noDocument: 'Öffne ein Dokument, um daraus eine Broschüre zu machen.',
    schema: 'Schema der Broschüre',
    schemaCaption:
      'Vorderseite des ersten Blatts: letzte und erste Seite links und rechts vom Falz',
    sheetSize: 'Blätter zum Drucken',
    /** `size` is the sheet (A4…), `half` the booklet page it makes (A5…, or one of `halves`). */
    sizeOption: '{size} quer → Broschüre {half}',
    halves: {
      letter: 'halbes Letter',
      legal: 'halbes Legal',
      native: 'halbes Blatt',
    },
    binding: 'Bindung',
    bindings: {
      left: { label: 'Links', title: 'Wird von links nach rechts geblättert' },
      right: {
        label: 'Rechts',
        title: 'Für Texte von rechts nach links (Arabisch, Hebräisch, Manga)',
      },
    },
    duplex: 'Druck',
    duplexModes: {
      bothSides: { label: 'Beidseitig', title: 'Drucker mit automatischem Duplexdruck' },
      frontOnly: {
        label: 'Nur Vorderseiten',
        title: 'Erster Durchgang, ohne automatischen Duplexdruck',
      },
      backOnly: {
        label: 'Nur Rückseiten',
        title: 'Zweiter Durchgang: die Blätter wenden und diese drucken',
      },
    },
    foldLine: 'Gestrichelte Linie am Falz',
    margins: 'Ränder',
    gutter: 'Rand am Falz (mm)',
    sheets: '1 Blatt zum Falten | {n} Blätter zum Falten',
    blanks:
      '1 leere Seite am Ende hinzugefügt, um auf ein Vielfaches von 4 zu kommen | {n} leere Seiten am Ende hinzugefügt, um auf ein Vielfaches von 4 zu kommen',
    submit: 'Broschüre erstellen',
  },

  protect: {
    intro:
      'Erstellt eine Kopie des Dokuments, die sich nur mit dem Passwort öffnet (AES-256-Verschlüsselung). Die Kopie erscheint in der Liste mit einem Schloss; das Original bleibt, wie es ist, und bearbeitbar.',
    noDocument: 'Öffne ein Dokument, um es zu schützen.',
    password: 'Passwort',
    repeat: 'Passwort wiederholen',
    mismatch: 'Die beiden Passwörter stimmen nicht überein.',
    show: 'Passwort anzeigen',
    note: 'Noch nicht angewendete Änderungen sind enthalten. Bewahr das Passwort gut auf: wenn du es verlierst, lässt sich die geschützte Kopie nicht mehr öffnen.',
    submit: 'Geschützte Kopie erstellen',
    allowed: 'Wer die Datei mit dem Passwort öffnet, darf',
    permissions: {
      print: 'Drucken',
      printHighQuality: 'In hoher Qualität drucken',
      copy: 'Text und Bilder kopieren',
      modify: 'Inhalt ändern',
      annotate: 'Kommentieren und Formulare ausfüllen',
      fillForms: 'Formulare ausfüllen',
      assemble: 'Seiten hinzufügen, drehen und löschen',
    },
    denied: {
      print: 'das Drucken',
      printHighQuality: 'das Drucken in hoher Qualität',
      copy: 'das Kopieren von Text und Bildern',
      modify: 'Änderungen am Inhalt',
      annotate: 'Kommentare',
      fillForms: 'das Ausfüllen von Formularen',
      assemble: 'das Hinzufügen, Drehen und Löschen von Seiten',
    },
    ownerPassword: 'Passwort zum Aufheben der Einschränkungen',
    ownerHint: 'Anders als das Öffnungspasswort: Wer es kennt, öffnet die Datei ohne Einschränkungen.',
    ownerSame: 'Es muss sich vom Öffnungspasswort unterscheiden, sonst gelten die Einschränkungen nicht.',
    restrictionsNote: 'Einschränkungen sind eine Bitte an PDF-Programme: Fast alle halten sich daran, aber sie verhindern Drucken oder Kopieren nicht wirklich.',
    current: 'Diese Datei schränkt {list} ein.',
    currentAdvice: 'Änderungen hier heben die Einschränkungen auf: Die Kästchen unten übernehmen sie, um sie in der geschützten Kopie wieder zu setzen.',
  },

  properties: {
    intro:
      'Die Informationen, die das PDF mit sich trägt und die PDF-Reader in den Dateieigenschaften anzeigen. Sie werden mit „Änderungen anwenden“ oder beim Herunterladen geschrieben und lassen sich wie die anderen Änderungen rückgängig machen.',
    noDocument: 'Öffne ein Dokument, um seine Eigenschaften zu sehen.',
    permissionsAdvice: 'Änderungen hier heben die Einschränkungen auf; um sie wieder zu setzen, erstelle eine Kopie mit „Schützen“.',
    loading: 'Eigenschaften werden gelesen…',
    fields: {
      title: 'Titel',
      author: 'Autor',
      subject: 'Betreff',
      keywords: 'Stichwörter',
      creator: 'Erstellt mit',
      producer: 'Erzeugt von',
      creationDate: 'Erstellt am',
      modDate: 'Geändert am',
    },
    hints: {
      title: 'PDF-Reader zeigen ihn anstelle des Dateinamens an',
      creator: 'Die Anwendung, in der das Dokument entstanden ist',
      producer: 'Das Programm, das das PDF geschrieben hat',
    },
    keywordsPlaceholder: 'durch Kommas getrennt',
    modified: '· geändert',
    inFile: 'In der Datei: {date}',
    clearAll: 'Alle Eigenschaften entfernen',
    clearAllHint: 'Entfernt alle Eigenschaften, zum Beispiel vor dem Teilen der Datei',
  },

  images: {
    intro:
      'Die Bilder, die das PDF schon enthält: Fotos, Logos, Scans. Sie zu entfernen ist eine Änderung wie die anderen: sie lässt sich rückgängig machen und wird mit „Änderungen anwenden“ oder beim Herunterladen übernommen. Ein Bild durch ein anderes zu ersetzen gilt sofort, auf jeder Seite, auf der es vorkommt, und lässt sich ebenfalls rückgängig machen.',
    noDocument: 'Öffne ein Dokument, um seine Bilder zu sehen.',
    searching: 'Bilder werden gesucht…',
    none: 'Keine Bilder in diesem Dokument. Logos und Grafiken, die als Vektorformen gezeichnet sind, sind keine Bilder und erscheinen hier nicht.',
    /** `count` is `count` below, in bold; `size` the bytes, formatted. */
    summary: '{count}, insgesamt {size}',
    count: '1 Bild | {n} Bilder',
    removing: '· {count} zu entfernen ({size})',
    list: 'Bilder des Dokuments',
    showOnPage: 'Auf Seite {page} anzeigen',
    toRemove: 'Zu entfernen',
    /** `pages` is e.g. "Seite 3" or "Seiten 1, 4". */
    downloadOf: 'Bild von {pages} herunterladen',
    download: 'Bild herunterladen',
    restoreOf: 'Bild von {pages} wiederherstellen',
    restore: 'Wiederherstellen',
    removeFrom: 'Bild von {pages} entfernen',
    removeEverywhere: 'Von allen Seiten entfernen',
    remove: 'Entfernen',
    someOnly:
      'Um ein Bild nur von einigen Seiten zu entfernen, öffne es: auf der Seite wählst du, ob es nur dort oder überall entfernt wird.',
    replace: 'Ersetzen',
    replaceOf: 'Bild auf {pages} ersetzen',
    replaceEverywhere: 'Auf allen Seiten ersetzen',
    cannotReplace:
      'Dieses Bild steht direkt in der Seite (oder ist eine Maske): Es lässt sich nicht ersetzen',
    /** Recompressing the images, into a lighter copy. */
    compress: {
      title: 'Datei verkleinern',
      intro:
        'Komprimiert die Bilder neu und verkleinert sie auf die Auflösung, die sie dort brauchen, wo sie gezeichnet werden. Erstellt eine Kopie: Das Original bleibt unverändert.',
      level: 'Qualität',
      levels: {
        high: { label: 'Hohe Qualität', hint: 'Fast wie das Original (220 dpi)' },
        balanced: { label: 'Ausgewogen', hint: 'Gut am Bildschirm und im Druck (150 dpi)' },
        small: { label: 'Kleine Datei', hint: 'Zum Versenden oder Lesen am Bildschirm (100 dpi)' },
      },
      submit: 'Bilder komprimieren',
    },
  },

  outline: {
    intro:
      'Die Lesezeichen des Dokuments. Klick auf einen Eintrag, um zu seiner Seite zu springen; mit Umschalt wählst du alle Seiten bis dorthin aus, mit ⌘/Strg fügst du sie der Auswahl hinzu. Das Inhaltsverzeichnis bleibt erhalten, auch wenn du Seiten löschst, umsortierst, extrahierst oder verbindest.',
    noDocument: 'Öffne ein Dokument, um sein Inhaltsverzeichnis zu sehen.',
    loading: 'Inhaltsverzeichnis wird gelesen…',
    none: 'Dieses Dokument hat kein Inhaltsverzeichnis.',
    tree: 'Inhaltsverzeichnis des Dokuments',
    untitled: 'Ohne Titel',
    deleted: 'zu löschen',
    page: 'S. {page}',
    open: '{title} aufklappen',
    close: '{title} zuklappen',
    nowhere: 'Führt zu keiner Seite dieses Dokuments',
  },
} satisfies Messages['tools']
