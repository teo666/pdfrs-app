/** Spanish messages: app. */
import type { Messages } from '../it'

export default {
  /** The bar at the top, and what floats over the whole window. */
  header: {
    tagline: 'Editor de PDF en el navegador',
    thumbSize: 'Tamaño de las miniaturas',
    openFiles: 'Abrir archivos',
    dropToOpen: 'Suelta para abrir',
    closeNotice: 'Cerrar aviso',
    closeError: 'Cerrar',
  },
  /** The open documents, on the left. */
  documents: {
    title: 'Documentos',
    openFiles: 'Abrir archivos',
    newName: 'Nuevo nombre para {name}',
    locked: 'Protegido con contraseña',
    lockedTitle: '{name} (protegido con contraseña)',
    pending: 'Cambios sin aplicar',
    rename: 'Cambiar nombre de {name}',
    renameHint: 'Cambiar nombre (también con doble clic en el nombre)',
    close: 'Cerrar {name}',
    thumbnails: 'Miniaturas de {name}',
    empty: 'No hay ningún documento abierto.',
    loading: 'Procesando…',
    dropHint:
      'Suelta sobre otro documento para mover las páginas (mantén pulsado ⌥/Alt para copiarlas)',
  },
  /** The bar above the pages. */
  toolbar: {
    newName: 'Nuevo nombre para {name}',
    rename: 'Cambiar nombre de {name}',
    renameHint: 'Cambiar nombre (también con doble clic en el nombre)',
    summary: '1 página | {n} páginas',
    summaryDeleted: '1 página · {deleted} por eliminar | {n} páginas · {deleted} por eliminar',
    pending: '· cambios sin aplicar',
    undo: 'Deshacer',
    undoTitle: 'Deshacer ({shortcut})',
    redo: 'Rehacer',
    redoTitle: 'Rehacer ({shortcut})',
    insert: 'Insertar páginas',
    blankPage: 'Página en blanco',
    blankPageAfterSelection: 'Insertar una página en blanco después de las seleccionadas, del tamaño de la anterior',
    blankPageAtEnd: 'Insertar una página en blanco al final, del tamaño de la última',
    insertAfterSelection:
      'Añade las páginas de un PDF o JPEG después de la última página seleccionada',
    insertAtEnd: 'Añade las páginas de un PDF o JPEG al final del documento',
    apply: 'Aplicar cambios',
    applyTitle: 'Aplica al documento los giros, las eliminaciones y el nuevo orden',
    download: 'Descargar',
    downloadTitle: 'Descarga el PDF con los cambios, también los que aún no se han aplicado',
    selectionActions: 'Acciones sobre las páginas seleccionadas',
    selected: '1 página seleccionada | {n} páginas seleccionadas',
    selectAll: 'Seleccionar todas',
    deselect: 'Deseleccionar',
    deselectTitle: 'Deseleccionar (Esc)',
    rotateLeft: 'Girar a la izquierda las páginas seleccionadas',
    rotateRight: 'Girar a la derecha las páginas seleccionadas',
    resetRotation: 'Quitar el giro de las páginas seleccionadas',
    delete: 'Eliminar',
    deleteTitle: 'Marcar para eliminar (Supr)',
    restore: 'Restaurar',
    extract: 'Extraer a un documento nuevo',
    extractTitle: 'Copia las páginas seleccionadas, tal como se ven, en un documento nuevo',
  },
  /** The grid of pages. */
  grid: {
    /** Follows the pointer while several pages are dragged. */
    dragCount: '{n} páginas',
  },
  /** One page's card in the grid. */
  card: {
    page: 'Página {n}',
    pageMoved: 'Página {n} (era la {was})',
    /** The same, inside a sentence. */
    pageInline: 'página {n}',
    pageInlineMoved: 'página {n} (era la {was})',
    select: 'Seleccionar {page}',
    open: 'Abrir {page} a tamaño real',
    openTitle: 'Ver la página en detalle (Intro, o doble clic)',
    toDelete: 'Por eliminar',
    rotateLeft: 'Girar a la izquierda',
    rotateRight: 'Girar a la derecha',
    resetRotation: 'Quitar el giro de {degrees}°',
    delete: 'Eliminar página',
    restore: 'Restaurar página',
    originalPosition: 'Posición original',
    was: 'era la {n}',
    part: 'Parte {n}',
    excluded: 'excluida',
  },
  /** Sizes and page lists (lib/format.ts). */
  format: {
    bytes: '{n} bytes',
    kilobytes: '{n} KB',
    megabytes: '{n} MB',
    pages: 'página {ranges} | páginas {ranges}',
  },
} satisfies Messages['app']
