/** Spanish messages: history. */
import type { Messages } from '../it'

export default {
  // The steps, one per `HistoryAction` type (see lib/historyLabel.ts).
  open: 'Documento abierto',
  movePage: 'Mover página {page} a la posición {position}',
  rotatePage: 'Girar página {page} {degrees}°',
  resetRotation: 'Restablecer giro de la página {page}',
  deletePage: 'Eliminar página {page}',
  restorePage: 'Restaurar página {page}',
  rotatePages: 'Girar {count} páginas {degrees}°',
  deletePages: 'Eliminar {count} páginas',
  restorePages: 'Restaurar {count} páginas',
  movePages: 'Mover {count} páginas a la posición {position}',
  insertPages: 'Insertar 1 página | Insertar {count} páginas',
  insertFromDocument:
    'Insertar 1 página de otro documento | Insertar {count} páginas de otro documento',
  insertPhoto: 'Insertar foto',
  photoPage: {
    a4: 'Foto en A4 (página {page})',
    letter: 'Foto en Letter (página {page})',
    native: 'Foto a tamaño real (página {page})',
  },
  addAnnotation: 'Añadir {what} a la página {page}',
  relinkAnnotation: '{What} de nuevo igual que las otras copias en la página {page}',
  annotationOnAllPages: '{What} en todas las páginas ({count})',
  detachAnnotation: '{What} editable solo en la página {page}',
  editAnnotation: 'Editar {what} en la página {page} | Editar {what} en {pages} páginas',
  rotateAnnotation: 'Girar {what} en la página {page} | Girar {what} en {pages} páginas',
  resizeAnnotation:
    'Cambiar tamaño de {what} en la página {page} | Cambiar tamaño de {what} en {pages} páginas',
  moveAnnotation: 'Mover {what} en la página {page} | Mover {what} en {pages} páginas',
  removeAnnotation: 'Quitar {what} de la página {page} | Quitar {what} de {pages} páginas',
  removeImages: {
    onePage: 'Quitar imagen (página {page}) | Quitar {count} imágenes (página {page})',
    manyPages: 'Quitar imagen de {pages} páginas | Quitar {count} imágenes de {pages} páginas',
    noPage: 'Quitar imagen | Quitar {count} imágenes',
  },
  restoreImages: {
    onePage: 'Restaurar imagen (página {page}) | Restaurar {count} imágenes (página {page})',
    manyPages:
      'Restaurar imagen en {pages} páginas | Restaurar {count} imágenes en {pages} páginas',
    noPage: 'Restaurar imagen | Restaurar {count} imágenes',
  },
  replaceImage: {
    onePage: 'Sustituir imagen (página {page})',
    manyPages: 'Sustituir imagen en {pages} páginas',
    noPage: 'Sustituir imagen',
  },
  metadata: 'Editar metadatos ({fields})',
  commit: 'Aplicar cambios ({pages} páginas)',
  encrypt: 'Cifrar documento',
  decrypt: 'Descifrar documento',

  /** What an annotation is, inside a step. */
  kinds: {
    text: 'texto',
    signature: 'firma',
    image: 'imagen',
  },
  /** The document properties, inside "Editar metadatos (…)". */
  fields: {
    title: 'título',
    author: 'autor',
    subject: 'asunto',
    keywords: 'palabras clave',
    creator: 'creador',
    producer: 'productor',
    creationDate: 'fecha de creación',
    modDate: 'fecha de modificación',
  },

  /** The history tool. */
  panel: {
    intro:
      'Cada cambio hecho en el documento, del más reciente al más antiguo. Haz clic en un paso para volver a ese punto; los pasos deshechos se quedan aquí hasta que hagas un nuevo cambio.',
    noDocument: 'Abre un documento para ver su historial.',
    undone:
      '1 paso deshecho: todavía se puede rehacer. | {n} pasos deshechos: todavía se pueden rehacer.',
    list: 'Historial de cambios',
    current: 'El documento está en este punto',
    redoTo: 'Rehacer hasta aquí',
    goTo: 'Volver a este punto',
    undoneTag: 'deshecho',
    shortcuts: 'Deshaz y rehaz también con {shortcuts}. Se guardan los últimos 50 pasos.',
  },
} satisfies Messages['history']
