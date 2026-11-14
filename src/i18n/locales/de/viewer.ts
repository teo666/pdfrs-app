import type { Messages } from '../it'

/** German messages: viewer. */
export default {
  pageViewer: {
    dialog: 'Seitenvorschau',
    header: {
      page: 'Seite {page} von {total}',
      was: 'vorher {page}',
      markedForDeletion: 'Zu löschen',
      resetRotation: 'Drehung um {degrees}° entfernen',
      sign: 'Unterschrift',
      images: 'Bilder',
      imagesTitle:
        'Die Bilder anzeigen, die schon auf der Seite sind, um sie zu entfernen oder herunterzuladen',
      close: 'Vorschau schließen',
      closeTitle: 'Schließen (Esc)',
    },
    zoom: {
      group: 'Zoom',
      fit: 'Einpassen',
      actual: '100%',
      title: '{label} ({key})',
    },
    pageAlt: 'Seite {page}',
    loading: 'Wird geladen',
    photo: {
      group: 'Seite des Fotos',
      on: 'Foto auf',
      page: 'Seite',
      a4: 'A4',
      letter: 'Letter',
      native: 'Originalgröße',
      margin: 'Rand',
      noMargin: 'Keiner',
      marginCm: '{cm} cm',
      useAsDefault: 'Für nächste Fotos verwenden',
      useAsDefaultTitle:
        'Die nächsten Fotos, die du öffnest oder einfügst, kommen auf diese Seite, mit diesem Rand',
      isDefault: 'Standard für die nächsten Fotos',
    },
    selected: {
      image: 'Ausgewähltes Bild',
      text: 'Ausgewählter Text',
      signature: 'Ausgewählte Unterschrift',
      onAllPages: 'Gleich auf allen Seiten',
      linked: 'Jede Änderung gilt für alle verknüpften Seiten.',
      unlinked:
        'Nur auf dieser Seite geändert: setz das Häkchen wieder, um sie an die anderen Kopien anzugleichen.',
      single: 'Nur auf dieser Seite.',
      editText: 'Text bearbeiten',
      editTextTitle: 'Text, Schrift oder Farbe ändern (auch per Doppelklick auf den Text)',
      resetProportions: 'Originalproportionen',
      resetProportionsTitle: 'Dehnung aufheben: die Höhe folgt wieder der Breite',
      remove: 'Entfernen',
      removeLinked: 'Von {count} Seiten entfernen',
    },
    pdfImage: {
      group: 'Ausgewähltes Bild des Dokuments',
      title: 'Bild',
      details: '{width} × {height} px · {format} · {size} · {pages}',
      removed: 'Zu entfernen',
      restore: 'Wiederherstellen',
      sharedTitle:
        'Gehört zu einem Inhalt, den auch andere Seiten zeichnen: es verschwindet auch dort',
      removeShared: 'Entfernen (auch von {count} anderen Seiten)',
      removeHere: 'Von dieser Seite entfernen',
      removeEverywhere: 'Von allen entfernen ({pages})',
      download: 'Herunterladen',
    },
    textEdit: {
      panel: 'Text bearbeiten',
      apply: 'Anwenden',
      cancel: 'Abbrechen',
    },
    previous: 'Vorherige Seite',
    previousTitle: 'Vorherige Seite (←)',
    next: 'Nächste Seite',
    nextTitle: 'Nächste Seite (→)',
  },
  annotationLayer: {
    image: 'Bild auf der Seite',
    imageSelected: 'Bild auf der Seite (ausgewählt)',
    text: 'Text auf der Seite',
    textSelected: 'Text auf der Seite (ausgewählt)',
    signature: 'Unterschrift auf der Seite',
    signatureSelected: 'Unterschrift auf der Seite (ausgewählt)',
    remove: 'Von der Seite entfernen',
    removeTitle: 'Entfernen (Entf)',
    rotate: 'Drehen',
    rotateTitle:
      '{degrees}° - ziehen zum Drehen (⇧: in 15°-Schritten), Doppelklick zum Geraderichten',
    stretchX: 'Breiter oder schmaler',
    stretchXTitle: 'Ziehen, um nur die Breite zu ändern (⇧: von der Mitte aus)',
    stretchY: 'Höher oder niedriger',
    stretchYTitle: 'Ziehen, um nur die Höhe zu ändern (⇧: von der Mitte aus)',
    resize: 'Größe ändern',
    resizeTitle:
      'Ziehen zum Vergrößern oder Verkleinern, mit gleichen Proportionen (⇧: von der Mitte aus)',
  },
  imageLayer: {
    removed: 'Zu entfernendes Bild',
    onPage: 'Bild in der Seite',
  },
  signaturePanel: {
    title: 'Unterschriften',
    close: 'Bereich der Unterschriften schließen',
    hint: 'Klick auf eine Unterschrift, um sie auf diese Seite zu setzen, und zieh sie dann an die gewünschte Stelle.',
    place: '„{name}“ auf die Seite setzen',
    remove: '„{name}“ aus der Bibliothek entfernen',
    removeTitle:
      'Aus der Bibliothek entfernen (bleibt auf den Seiten, auf die du sie schon gesetzt hast)',
    draw: 'Unterschrift zeichnen',
    upload: 'Bild hochladen',
    privacy:
      'Die Unterschriften bleiben nur in diesem Browser-Tab und werden nirgends gespeichert. Sie kommen ins PDF, wenn du die Änderungen anwendest oder es herunterlädst.',
  },
} satisfies Messages['viewer']
