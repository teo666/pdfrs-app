import type { Messages } from '../it'

/** German messages: editing. */
export default {
  signaturePad: {
    canvas: 'Fläche zum Zeichnen der Unterschrift',
    placeholder: 'Hier mit der Maus oder dem Finger unterschreiben',
    ink: 'Tinte',
    clear: 'Löschen',
    use: 'Diese Unterschrift verwenden',
    cancel: 'Abbrechen',
  },
  textEditor: {
    text: 'Text',
    placeholder: 'Hier schreiben (Eingabetaste für neue Zeile)',
    unsupported:
      'Einige Zeichen gibt es in den Standardschriften von PDF nicht, sie erscheinen als „?“ (lateinische Buchstaben, Akzente, Umlaute, € und „“ gehen).',
    font: 'Schrift',
    sansSerif: 'Serifenlos',
    serif: 'Mit Serifen',
    monospace: 'Schreibmaschine',
    size: 'Größe (pt)',
    sizeLabel: 'Größe in Punkt',
    style: 'Stil',
    bold: 'Fett',
    boldShort: 'F',
    italic: 'Kursiv',
    italicShort: 'K',
    align: 'Ausrichtung',
    left: 'Links',
    center: 'Mitte',
    right: 'Rechts',
  },
  colorPicker: {
    color: 'Farbe',
    black: 'Schwarz',
    blue: 'Blau',
    red: 'Rot',
    green: 'Grün',
    custom: 'Andere Farbe wählen',
  },
  lockedDocument: {
    section: '{name}, passwortgeschützt',
    explanation:
      'Es ist passwortgeschützt. Um es anzusehen oder zu bearbeiten, entsperre es: daraus entsteht eine Kopie ohne Passwort, neben diesem.',
    password: 'Passwort',
    passwordLabel: 'Passwort des Dokuments',
    wrong: 'Falsches Passwort: versuch es noch einmal.',
    unlock: 'Entsperren',
    downloadTitle: 'Das geschützte PDF unverändert herunterladen',
    download: 'Geschützt herunterladen',
  },
  emptyState: {
    drop: 'Zieh deine PDFs oder JPEGs hierher',
    click: 'oder klick, um sie auszuwählen',
    local: 'Die Dateien bleiben auf deinem Computer: sie werden im Browser verarbeitet.',
  },
  themeSwitcher: {
    group: 'Design',
    auto: 'Automatisches Design (wie das System)',
    light: 'Helles Design',
    dark: 'Dunkles Design',
  },
  locale: {
    label: 'Sprache',
  },
} satisfies Messages['editing']
