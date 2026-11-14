/** English messages: store. */
import type { Messages } from '../it'

export default {
  /** What went wrong, as the error bar shows it. */
  errors: {
    notPdfOrJpeg: '{name}: not a PDF or a JPEG image',
    insertProtected:
      '{name} is password protected: open and unlock it, then insert the unlocked copy',
    noDocument: 'no document',
    noActiveDocument: 'no active document',
    emptyDocument: 'the document would be empty: undo at least one deletion before confirming',
    wrongPassword: 'wrong password',
    jpegColorSpace: 'unsupported JPEG color space: {space} (supported: RGB, grayscale)',
    invalidJpeg: 'not a valid JPEG: {detail}',
    imageDecode: 'couldn’t decode the image',
    imageDraw: 'couldn’t draw the image',
  },
  /** What just happened, as the notice at the bottom says it. */
  notices: {
    merged: 'Merged {n} documents: the originals stay open',
    inserted: 'Inserted 1 page | Inserted {n} pages',
    watermarked: 'Watermark added to 1 page | Watermark added to {n} pages',
    blankPage: 'Blank page inserted at position {position}',
    moved: 'Moved 1 page to “{target}” | Moved {n} pages to “{target}”',
    copied: 'Copied 1 page to “{target}” | Copied {n} pages to “{target}”',
    created: 'Created “{name}”: the original is unchanged',
    split: 'Created 1 document | Created {n} documents: the original is unchanged',
    extracted: '1 page in “{name}” | {n} pages in “{name}”',
    protected: 'Created “{name}”, password protected: the original is unchanged',
    unlocked: 'Created “{name}”, without a password',
    imageReplaced: 'Image replaced | Image replaced on {n} pages',
    /** `before`/`after`: the file's size, formatted. */
    compressed: 'Created “{name}”: from {before} to {after} (−{percent}%)',
    nothingToCompress: 'No image gets lighter at this level: the file stays as it is',
  },
  /** The buttons on the notices. */
  actions: {
    open: 'Open',
    backToOriginal: 'Back to the original',
    backToProtected: 'Back to the protected one',
  },
  /** Names given to the documents and files the app makes. */
  names: {
    merged: 'Merge of {n} documents.pdf',
    nup: '{base} ({n} per sheet).pdf',
    booklet: '{base} (booklet).pdf',
    part: '{base} (part {index} of {total}).pdf',
    extracted: '{base} (extract).pdf',
    protected: '{base} (protected).pdf',
    unlocked: '{base} (unlocked).pdf',
    image: '{base} - image {n}.{extension}',
    signature: 'Signature {n}',
    compressed: '{base} (compressed).pdf',
  },
  /** Adding signatures and images to the library. */
  library: {
    whiteBackground: 'The image’s white background has been made transparent.',
    unreadable: 'Unreadable image: {reason}',
  },
} satisfies Messages['store']
