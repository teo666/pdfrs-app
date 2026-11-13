/** English messages: tools. */
import type { Messages } from '../it'

export default {
  /** Shared by several tools. */
  common: {
    pages: '1 page | {n} pages',
    placeOnPage: 'Put on page {page}',
    placeNamedOnPage: 'Put “{name}” on page {page}',
    removeFromLibrary: 'Remove “{name}” from the library',
    removeFromLibraryHint:
      'Remove from the library (it stays on the pages where you already put it)',
    uploadImage: 'Upload an image',
    /** `items` is e.g. "2 signatures", `pages` e.g. "1 page". */
    placed:
      '{items} on {pages}: they’re added to the PDF when you apply the changes or download it.',
    borders: 'Border around each page',
    margin: 'Margin (mm)',
  },

  rail: {
    navLabel: 'Tools',
    sign: { label: 'Sign', hint: 'Sign: draw or upload a signature and put it on the pages' },
    image: { label: 'Image', hint: 'Image: a logo, a stamp or a photo on top of the pages' },
    text: {
      label: 'Text',
      hint: 'Text: write on top of the pages, with real, selectable text',
    },
    merge: { label: 'Merge', hint: 'Merge several documents into one' },
    split: { label: 'Split', hint: 'Split the document into several parts' },
    nup: { label: 'N-up', hint: 'Several pages on each sheet, to print with less paper' },
    booklet: { label: 'Booklet', hint: 'A booklet to print double-sided and fold in half' },
    outline: {
      label: 'Outline',
      hint: 'Document outline: the bookmarks, to jump to pages',
    },
    images: {
      label: 'Images',
      hint: 'The images already in the PDF: view, download or remove them',
    },
    protect: {
      label: 'Protect',
      hint: 'Password protect: a copy that opens only with the password',
    },
    properties: {
      label: 'Properties',
      hint: 'Document properties: title, author, subject, keywords',
    },
    history: { label: 'History', hint: 'Change history: go back to any step' },
  },

  panel: {
    titles: {
      sign: 'Sign',
      image: 'Image',
      text: 'Text',
      merge: 'Merge documents',
      split: 'Split document',
      nup: 'Multiple pages per sheet',
      booklet: 'Booklet',
      protect: 'Password protect',
      properties: 'Document properties',
      images: 'Document images',
      history: 'Change history',
      outline: 'Document outline',
    },
    close: 'Close the panel',
    locked: '“{name}” is password protected: unlock it to use this tool.',
  },

  scope: {
    /** `target` is one of the two below, shown in bold. */
    appliesTo: 'Applies to {target}',
    selected: 'the selected page | the {n} selected pages',
    all: 'the only page | all {n} pages',
    hint: '(select some pages to use only those)',
  },

  sign: {
    intro:
      'Draw or upload your signature, then put it on a page: the page opens full size, where you can move, resize and rotate it and, if you like, put the same one on every page.',
    noDocument: 'Open a document to sign it.',
    yours: 'Your signatures',
    draw: 'Draw a signature',
    placedCount: '1 signature | {n} signatures',
    privacy: 'Signatures stay only in this browser tab and aren’t saved anywhere.',
  },

  image: {
    intro:
      'A logo, a stamp or a photo on top of the pages: upload it, then put it on a page. The page opens full size, where you can move, resize and rotate it and, if you like, put the same one on every page.',
    noDocument: 'Open a document to add images to it.',
    yours: 'Your images',
    formats:
      'PNG, JPEG, WebP or GIF. PNG transparency is kept; images larger than 1600 pixels are scaled down.',
    placedCount: '1 image | {n} images',
  },

  text: {
    intro:
      'Real text on top of the pages, selectable and searchable in the PDF. Type it here, then put it on a page: the page opens full size, where you can move, resize and rotate it and, if you like, put the same one on every page. Double-click it to edit it.',
    noDocument: 'Open a document to write on it.',
    preview: 'Text preview',
    placedCount: '1 text | {n} texts',
    fonts:
      'Standard PDF fonts (Helvetica, Times, Courier): no font is embedded, and the characters are those of Western European languages.',
  },

  merge: {
    intro:
      'The documents are merged as they appear now (reordering, rotations, deletions and signatures included), in the order of the list. The result opens as a new document; the originals stay open.',
    picked: 'To merge, in this order',
    empty: 'No documents: add at least two from the list below.',
    moveUp: 'Move {name} up',
    moveDown: 'Move {name} down',
    remove: 'Remove {name} from the merge',
    others: 'Other open documents',
    add: 'Add {name} to the merge',
    openMore: 'Open more files to merge',
    pickTwo: 'Choose at least two documents',
    submit: 'Merge {documents} documents ({pages} pages)',
  },

  split: {
    intro:
      'Cut the document into several parts: each becomes a new document, with the pages as they appear now. The original doesn’t change.',
    noDocument: 'Open a document to split it.',
    mode: 'How to split',
    modes: {
      every: { label: 'Every N', title: 'Parts of N pages each' },
      ranges: { label: 'Ranges', title: 'Type the ranges, e.g. 1-3, 4-8' },
      selection: { label: 'Selection', title: 'Each selected page starts a new part' },
    },
    size: 'Pages per part',
    sizeHint: '1 = one document per page',
    ranges: 'Ranges, one per part',
    rangesPlaceholder: 'e.g. 1-3, 4-8, 9-{total}',
    rangesLabel: 'Page ranges',
    rangesHint: 'Page numbers as on the thumbnails; a single page counts as a part.',
    selectionHint:
      'Select the pages where each new part should start: the first part always starts at page 1.',
    selected: 'Selected: {pages}.',
    parts: 'Parts',
    partsCount: '1 part | {n} parts',
    part: 'Part {number}: {range}',
    onePage: 'page {start}',
    pageRange: 'pages {start}–{end}',
    more: '… and {count} more parts',
    missing: 'Not in any part: page {pages}. | Not in any part: pages {pages}.',
    deletions: 'Pages marked for deletion are left out.',
    submit: 'Create 1 document | Split into {n} documents',
    submitNone: 'Choose how to split',
    /** Ranges typed by hand that can't be read (lib/split.ts). */
    errors: {
      notRange: '“{token}” isn’t a range (e.g. 1-3 or 5)',
      outOfRange: '“{token}”: the document has pages 1 to {total}',
      reversed: '“{token}”: the first page comes after the last',
    },
  },

  nup: {
    intro:
      'Several pages on each sheet, scaled down: to print a long document with less paper. The result is a new document; the original doesn’t change.',
    noDocument: 'Open a document to lay it out.',
    perSheet: 'Pages per sheet',
    schema: 'Sheet layout',
    gridLandscape: '{cols} × {rows}, landscape sheet',
    gridPortrait: '{cols} × {rows}, portrait sheet',
    sheetSize: 'Sheet size',
    native: 'Same as the original',
    orientation: 'Orientation',
    orientations: {
      auto: { label: 'Automatic', title: 'Whichever makes the best use of the sheet' },
      portrait: 'Portrait',
      landscape: 'Landscape',
    },
    order: 'Page order',
    byRows: 'By rows',
    byColumns: 'By columns',
    moreOptions: 'Margins and more options',
    spacing: 'Space between pages (mm)',
    autoRotate: 'Rotate pages if that makes them larger',
    submit: 'Create document (1 sheet) | Create document ({n} sheets)',
  },

  booklet: {
    intro:
      'A booklet to print double-sided and fold in half: the pages are reordered so that, once the sheets are folded, they read in the right order. The result is a new document.',
    noDocument: 'Open a document to make a booklet of it.',
    schema: 'Booklet layout',
    schemaCaption: 'Front of the first sheet: last and first page on either side of the fold',
    sheetSize: 'Sheets to print on',
    /** `size` is the sheet (A4…), `half` the booklet page it makes (A5…, or one of `halves`). */
    sizeOption: '{size} landscape → {half} booklet',
    halves: {
      letter: 'half-Letter',
      legal: 'half-Legal',
      native: 'half-sheet',
    },
    binding: 'Binding',
    bindings: {
      left: { label: 'Left', title: 'Pages turn from left to right' },
      right: { label: 'Right', title: 'For right-to-left text (Arabic, Hebrew, manga)' },
    },
    duplex: 'Printing',
    duplexModes: {
      bothSides: { label: 'Double-sided', title: 'Printer with automatic double-sided printing' },
      frontOnly: {
        label: 'Fronts only',
        title: 'First pass, without automatic double-sided printing',
      },
      backOnly: { label: 'Backs only', title: 'Second pass: flip the sheets over and print these' },
    },
    foldLine: 'Dashed line on the fold',
    margins: 'Margins',
    gutter: 'Margin at the fold (mm)',
    sheets: '1 sheet to fold | {n} sheets to fold',
    blanks:
      '1 blank page added at the end, to reach a multiple of 4 | {n} blank pages added at the end, to reach a multiple of 4',
    submit: 'Create booklet',
  },

  protect: {
    intro:
      'Create a copy of the document that opens only with the password (AES-256 encryption). The copy appears in the list with a padlock; the original stays as it is, editable.',
    noDocument: 'Open a document to protect it.',
    password: 'Password',
    repeat: 'Repeat the password',
    mismatch: 'The two passwords don’t match.',
    show: 'Show the password',
    note: 'Changes not yet applied are included. Keep the password safe: if you lose it, the protected copy can no longer be opened.',
    submit: 'Create protected copy',
  },

  properties: {
    intro:
      'The information the PDF carries with it, which readers show in the file’s properties. It’s written with “Apply changes” or by downloading, and can be undone like any other change.',
    noDocument: 'Open a document to see its properties.',
    loading: 'Reading the properties…',
    fields: {
      title: 'Title',
      author: 'Author',
      subject: 'Subject',
      keywords: 'Keywords',
      creator: 'Created with',
      producer: 'Produced by',
      creationDate: 'Created on',
      modDate: 'Modified on',
    },
    hints: {
      title: 'PDF readers show it instead of the file name',
      creator: 'The application the document was created in',
      producer: 'The program that wrote the PDF',
    },
    keywordsPlaceholder: 'comma-separated',
    modified: '· modified',
    inFile: 'In the file: {date}',
    clearAll: 'Remove all properties',
    clearAllHint: 'Removes all properties, for example before sharing the file',
  },

  images: {
    intro:
      'The images the PDF already contains: photos, logos, scans. Removing them is a change like any other: it can be undone, and it’s applied with “Apply changes” or by downloading.',
    noDocument: 'Open a document to see its images.',
    searching: 'Looking for images…',
    none: 'No images in this document. Logos and graphics drawn as vector shapes aren’t images and don’t appear here.',
    /** `count` is `count` below, in bold; `size` the bytes, formatted. */
    summary: '{count}, {size} in total',
    count: '1 image | {n} images',
    removing: '· {count} to remove ({size})',
    list: 'Document images',
    showOnPage: 'Show on page {page}',
    toRemove: 'To remove',
    /** `pages` is e.g. "page 3" or "pages 1, 4". */
    downloadOf: 'Download the image on {pages}',
    download: 'Download the image',
    restoreOf: 'Restore the image on {pages}',
    restore: 'Restore',
    removeFrom: 'Remove the image from {pages}',
    removeEverywhere: 'Remove from all pages',
    remove: 'Remove',
    someOnly:
      'To remove an image from only some pages, open it: on the page you choose whether to remove it there or everywhere.',
  },

  outline: {
    intro:
      'The document’s bookmarks. Click an entry to go to its page; with Shift you select all the pages up to it, with ⌘/Ctrl you add it to the selection. The outline is kept even when you delete, reorder, extract or merge pages.',
    noDocument: 'Open a document to see its outline.',
    loading: 'Reading the outline…',
    none: 'This document has no outline.',
    tree: 'Document outline',
    untitled: 'Untitled',
    deleted: 'to delete',
    page: 'p. {page}',
    open: 'Expand {title}',
    close: 'Collapse {title}',
    nowhere: 'Doesn’t lead to a page in this document',
  },
} satisfies Messages['tools']
