/** English messages: app. */
import type { Messages } from '../it'

export default {
  /** The bar at the top, and what floats over the whole window. */
  header: {
    tagline: 'PDF editor in your browser',
    thumbSize: 'Thumbnail size',
    openFiles: 'Open files',
    dropToOpen: 'Drop to open',
    closeNotice: 'Close notice',
    closeError: 'Close',
  },
  /** The open documents, on the left. */
  documents: {
    title: 'Documents',
    openFiles: 'Open files',
    newName: 'New name for {name}',
    locked: 'Password protected',
    lockedTitle: '{name} (password protected)',
    pending: 'Unapplied changes',
    rename: 'Rename {name}',
    renameHint: 'Rename (or double-click the name)',
    close: 'Close {name}',
    thumbnails: 'Thumbnails of {name}',
    empty: 'No documents open.',
    loading: 'Processing…',
    dropHint: 'Drop on another document to move the pages (hold ⌥/Alt to copy them)',
  },
  /** The bar above the pages. */
  toolbar: {
    newName: 'New name for {name}',
    rename: 'Rename {name}',
    renameHint: 'Rename (or double-click the name)',
    summary: '1 page | {n} pages',
    summaryDeleted: '1 page · {deleted} to delete | {n} pages · {deleted} to delete',
    pending: '· unapplied changes',
    undo: 'Undo',
    undoTitle: 'Undo ({shortcut})',
    redo: 'Redo',
    redoTitle: 'Redo ({shortcut})',
    insert: 'Insert pages',
    insertAfterSelection: 'Add the pages of a PDF or JPEG after the last selected page',
    insertAtEnd: 'Add the pages of a PDF or JPEG at the end of the document',
    apply: 'Apply changes',
    applyTitle: 'Apply rotations, deletions and reordering to the document',
    download: 'Download',
    downloadTitle: 'Download the PDF with the changes, including those not yet applied',
    selectionActions: 'Actions on the selected pages',
    selected: '1 page selected | {n} pages selected',
    selectAll: 'Select all',
    deselect: 'Deselect',
    deselectTitle: 'Deselect (Esc)',
    rotateLeft: 'Rotate the selected pages left',
    rotateRight: 'Rotate the selected pages right',
    delete: 'Delete',
    deleteTitle: 'Mark for deletion (Delete)',
    restore: 'Restore',
    extract: 'Extract to a new document',
    extractTitle: 'Copy the selected pages, as they appear, to a new document',
  },
  /** The grid of pages. */
  grid: {
    /** Follows the pointer while several pages are dragged. */
    dragCount: '{n} pages',
  },
  /** One page's card in the grid. */
  card: {
    page: 'Page {n}',
    pageMoved: 'Page {n} (was {was})',
    /** The same, inside a sentence. */
    pageInline: 'page {n}',
    pageInlineMoved: 'page {n} (was {was})',
    select: 'Select {page}',
    open: 'Open {page} at full size',
    openTitle: 'View the page in detail (Enter, or double-click)',
    toDelete: 'To delete',
    rotateLeft: 'Rotate left',
    rotateRight: 'Rotate right',
    delete: 'Delete page',
    restore: 'Restore page',
    originalPosition: 'Original position',
    was: 'was {n}',
    part: 'Part {n}',
    excluded: 'excluded',
  },
  /** Sizes and page lists (lib/format.ts). */
  format: {
    bytes: '{n} bytes',
    kilobytes: '{n} KB',
    megabytes: '{n} MB',
    pages: 'page {ranges} | pages {ranges}',
  },
} satisfies Messages['app']
