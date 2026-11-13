/** English messages: editing. */
import type { Messages } from '../it'

export default {
  signaturePad: {
    canvas: 'Signature drawing area',
    placeholder: 'Sign here with your mouse or finger',
    ink: 'Ink',
    clear: 'Clear',
    use: 'Use this signature',
    cancel: 'Cancel',
  },
  textEditor: {
    text: 'Text',
    placeholder: 'Type here (Enter for a new line)',
    unsupported:
      'Some characters don’t exist in the standard PDF fonts and will appear as “?” (Latin letters, accents, € and «» are fine).',
    font: 'Font',
    sansSerif: 'Sans serif',
    serif: 'Serif',
    monospace: 'Typewriter',
    size: 'Size (pt)',
    sizeLabel: 'Size in points',
    style: 'Style',
    bold: 'Bold',
    boldShort: 'B',
    italic: 'Italic',
    italicShort: 'I',
    align: 'Alignment',
    left: 'Left',
    center: 'Center',
    right: 'Right',
  },
  colorPicker: {
    color: 'Color',
    black: 'Black',
    blue: 'Blue',
    red: 'Red',
    green: 'Green',
    custom: 'Pick another color',
  },
  lockedDocument: {
    section: '{name}, password protected',
    explanation:
      'It’s password protected. To view or edit it, unlock it: this creates a copy without a password, next to this one.',
    password: 'Password',
    passwordLabel: 'Document password',
    wrong: 'Wrong password: try again.',
    unlock: 'Unlock',
    downloadTitle: 'Download the protected PDF as it is',
    download: 'Download protected',
  },
  emptyState: {
    drop: 'Drag your PDFs or JPEGs here',
    click: 'or click to choose them',
    local: 'Your files stay on your computer: they’re processed in the browser.',
  },
  themeSwitcher: {
    group: 'Theme',
    auto: 'Automatic theme (same as the system)',
    light: 'Light theme',
    dark: 'Dark theme',
  },
  locale: {
    label: 'Language',
  },
} satisfies Messages['editing']
