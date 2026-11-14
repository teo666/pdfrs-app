/** English messages: history. */
import type { Messages } from '../it'

export default {
  // The steps, one per `HistoryAction` type (see lib/historyLabel.ts).
  open: 'Document opened',
  movePage: 'Move page {page} to position {position}',
  rotatePage: 'Rotate page {page} by {degrees}°',
  resetRotation: 'Reset rotation of page {page}',
  resetRotations: 'Reset rotation of 1 page | Reset rotation of {count} pages',
  deletePage: 'Delete page {page}',
  restorePage: 'Restore page {page}',
  rotatePages: 'Rotate {count} pages by {degrees}°',
  deletePages: 'Delete {count} pages',
  restorePages: 'Restore {count} pages',
  movePages: 'Move {count} pages to position {position}',
  insertPages: 'Insert 1 page | Insert {count} pages',
  insertFromDocument:
    'Insert 1 page from another document | Insert {count} pages from another document',
  insertPhoto: 'Insert photo',
  watermark: 'Watermark on page {page} | Watermark on {count} pages',
  blankPage: 'Insert blank page at position {position}',
  moveImage: 'Move image (page {page})',
  resizeImage: 'Resize image (page {page})',
  outlineAdd: 'Add “{title}” to the outline',
  outlineRename: 'Rename “{from}” to “{title}” in the outline',
  outlineRemove: 'Delete “{title}” from the outline | Delete “{title}” from the outline ({count} entries)',
  outlineMoveUp: 'Move “{title}” up in the outline',
  outlineMoveDown: 'Move “{title}” down in the outline',
  outlineIndent: 'Indent “{title}” in the outline',
  outlineOutdent: 'Outdent “{title}” in the outline',
  photoPage: {
    a4: 'Photo on A4 (page {page})',
    letter: 'Photo on Letter (page {page})',
    native: 'Photo at actual size (page {page})',
  },
  addAnnotation: 'Add {what} to page {page}',
  relinkAnnotation: '{What} on page {page} matches the other copies again',
  annotationOnAllPages: '{What} on all pages ({count})',
  detachAnnotation: '{What} editable on page {page} only',
  editAnnotation: 'Edit {what} on page {page} | Edit {what} on {pages} pages',
  rotateAnnotation: 'Rotate {what} on page {page} | Rotate {what} on {pages} pages',
  resizeAnnotation: 'Resize {what} on page {page} | Resize {what} on {pages} pages',
  moveAnnotation: 'Move {what} on page {page} | Move {what} on {pages} pages',
  removeAnnotation: 'Remove {what} from page {page} | Remove {what} from {pages} pages',
  removeImages: {
    onePage: 'Remove image (page {page}) | Remove {count} images (page {page})',
    manyPages: 'Remove image from {pages} pages | Remove {count} images from {pages} pages',
    noPage: 'Remove image | Remove {count} images',
  },
  restoreImages: {
    onePage: 'Restore image (page {page}) | Restore {count} images (page {page})',
    manyPages: 'Restore image on {pages} pages | Restore {count} images on {pages} pages',
    noPage: 'Restore image | Restore {count} images',
  },
  replaceImage: {
    onePage: 'Replace image (page {page})',
    manyPages: 'Replace image on {pages} pages',
    noPage: 'Replace image',
  },
  metadata: 'Edit properties ({fields})',
  commit: 'Apply changes ({pages} pages)',
  encrypt: 'Encrypt document',
  decrypt: 'Decrypt document',

  /** What an annotation is, inside a step. */
  kinds: {
    text: 'text',
    signature: 'signature',
    image: 'image',
  },
  /** The document properties, inside "Edit properties (…)". */
  fields: {
    title: 'title',
    author: 'author',
    subject: 'subject',
    keywords: 'keywords',
    creator: 'creator',
    producer: 'producer',
    creationDate: 'creation date',
    modDate: 'modification date',
  },

  /** The History tool. */
  panel: {
    intro:
      'Every change made to the document, most recent first. Click a step to go back to that point; undone steps stay here until you make a new change.',
    noDocument: 'Open a document to see its history.',
    undone: '1 step undone: it can still be redone. | {n} steps undone: they can still be redone.',
    list: 'Change history',
    current: 'The document is at this point',
    redoTo: 'Redo up to here',
    goTo: 'Go back to this point',
    undoneTag: 'undone',
    shortcuts: 'You can also undo and redo with {shortcuts}. The last 50 steps are kept.',
  },
} satisfies Messages['history']
