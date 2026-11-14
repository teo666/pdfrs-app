/** Spanish messages: tools. */
import type { Messages } from '../it'

export default {
  /** Shared by several tools. */
  common: {
    pages: '1 página | {n} páginas',
    placeOnPage: 'Poner en la página {page}',
    placeNamedOnPage: 'Poner «{name}» en la página {page}',
    removeFromLibrary: 'Quitar «{name}» de la biblioteca',
    removeFromLibraryHint:
      'Quitar de la biblioteca (se queda en las páginas donde ya la has puesto)',
    uploadImage: 'Subir una imagen',
    /** `items` is e.g. "2 firmas", `pages` e.g. "1 página". */
    placed: '{items} en {pages}: pasan al PDF cuando aplicas los cambios o lo descargas.',
    borders: 'Borde alrededor de cada página',
    margin: 'Margen (mm)',
  },

  rail: {
    navLabel: 'Herramientas',
    sign: { label: 'Firmar', hint: 'Firmar: dibuja o sube una firma y ponla en las páginas' },
    image: { label: 'Imagen', hint: 'Imagen: un logotipo, un sello o una foto sobre las páginas' },
    text: {
      label: 'Texto',
      hint: 'Texto: escribe sobre las páginas, con texto real y seleccionable',
    },
    merge: { label: 'Unir', hint: 'Unir varios documentos en uno' },
    split: { label: 'Dividir', hint: 'Dividir el documento en varias partes' },
    nup: {
      label: 'N por hoja',
      hint: 'Varias páginas en cada hoja, para imprimir con menos papel',
    },
    booklet: {
      label: 'Cuadernillo',
      hint: 'Cuadernillo para imprimir a doble cara y doblar por la mitad',
    },
    outline: {
      label: 'Índice',
      hint: 'Índice del documento: los marcadores, para ir a las páginas',
    },
    images: {
      label: 'Imágenes',
      hint: 'Las imágenes que ya están en el PDF: velas, descárgalas, sustitúyelas, quítalas o aligéralas',
    },
    protect: {
      label: 'Proteger',
      hint: 'Proteger con contraseña: una copia que solo se abre con la contraseña',
    },
    properties: {
      label: 'Propiedades',
      hint: 'Propiedades del documento: título, autor, asunto, palabras clave',
    },
    history: { label: 'Historial', hint: 'Historial de cambios: vuelve a cualquier paso' },
  },

  panel: {
    titles: {
      sign: 'Firmar',
      image: 'Imagen',
      text: 'Texto',
      merge: 'Unir documentos',
      split: 'Dividir documento',
      nup: 'Varias páginas por hoja',
      booklet: 'Cuadernillo',
      protect: 'Proteger con contraseña',
      properties: 'Propiedades del documento',
      images: 'Imágenes del documento',
      history: 'Historial de cambios',
      outline: 'Índice del documento',
    },
    close: 'Cerrar el panel',
    locked: '«{name}» está protegido con contraseña: desbloquéalo para usar esta herramienta.',
  },

  scope: {
    /** `target` is one of the two below, shown in bold. */
    appliesTo: 'Se aplica {target}',
    selected: 'a la página seleccionada | a las {n} páginas seleccionadas',
    all: 'a la única página | a todas las {n} páginas',
    hint: '(selecciona algunas páginas para usar solo esas)',
  },

  sign: {
    intro:
      'Dibuja o sube tu firma y luego ponla en una página: la página se abre en grande, donde puedes moverla, cambiar su tamaño, girarla y, si quieres, ponerla igual en todas las páginas.',
    noDocument: 'Abre un documento para firmarlo.',
    yours: 'Tus firmas',
    draw: 'Dibujar una firma',
    placedCount: '1 firma | {n} firmas',
    privacy:
      'Las firmas solo se quedan en esta pestaña del navegador y no se guardan en ningún sitio.',
  },

  image: {
    intro:
      'Un logotipo, un sello o una foto sobre las páginas: súbela y luego ponla en una página. La página se abre en grande, donde puedes moverla, cambiar su tamaño, girarla y, si quieres, ponerla igual en todas las páginas.',
    noDocument: 'Abre un documento para insertar imágenes.',
    yours: 'Tus imágenes',
    formats:
      'PNG, JPEG, WebP o GIF. La transparencia de los PNG se conserva; las imágenes de más de 1600 píxeles se reducen.',
    placedCount: '1 imagen | {n} imágenes',
  },

  text: {
    intro:
      'Texto real sobre las páginas, seleccionable y que se puede buscar en el PDF. Escríbelo aquí y luego ponlo en una página: la página se abre en grande, donde puedes moverlo, cambiar su tamaño, girarlo y, si quieres, ponerlo igual en todas las páginas. Con doble clic lo editas.',
    noDocument: 'Abre un documento para escribir en él.',
    preview: 'Vista previa del texto',
    placedCount: '1 texto | {n} textos',
    fonts:
      'Fuentes estándar del PDF (Helvetica, Times, Courier): no se incrusta ninguna fuente, y los caracteres son los de los idiomas de Europa occidental.',
  },

  merge: {
    intro:
      'Los documentos se unen tal como se ven ahora (con el nuevo orden, los giros, las eliminaciones y las firmas), en el orden de la lista. El resultado se abre como documento nuevo; los originales siguen abiertos.',
    picked: 'Para unir, en este orden',
    empty: 'Ningún documento: añade al menos dos de la lista de abajo.',
    moveUp: 'Subir {name}',
    moveDown: 'Bajar {name}',
    remove: 'Quitar {name} de la unión',
    others: 'Otros documentos abiertos',
    add: 'Añadir {name} a la unión',
    openMore: 'Abrir más archivos para unir',
    pickTwo: 'Elige al menos dos documentos',
    submit: 'Unir {documents} documentos ({pages} páginas)',
  },

  split: {
    intro:
      'Corta el documento en varias partes: cada una se convierte en un documento nuevo, con las páginas tal como se ven ahora. El original no cambia.',
    noDocument: 'Abre un documento para dividirlo.',
    mode: 'Cómo dividir',
    modes: {
      every: { label: 'Cada N', title: 'Partes de N páginas cada una' },
      ranges: { label: 'Intervalos', title: 'Escribe los intervalos, p. ej. 1-3, 4-8' },
      selection: { label: 'Selección', title: 'Cada página seleccionada empieza una parte nueva' },
    },
    size: 'Páginas por parte',
    sizeHint: '1 = un documento por cada página',
    ranges: 'Intervalos, uno por parte',
    rangesPlaceholder: 'p. ej. 1-3, 4-8, 9-{total}',
    rangesLabel: 'Intervalos de páginas',
    rangesHint: 'Números de página como en las miniaturas; una sola página también es una parte.',
    selectionHint:
      'Selecciona las páginas en las que debe empezar cada parte nueva: la primera parte siempre empieza en la página 1.',
    selected: 'Seleccionadas: {pages}.',
    parts: 'Partes',
    partsCount: '1 parte | {n} partes',
    part: 'Parte {number}: {range}',
    onePage: 'página {start}',
    pageRange: 'páginas {start}–{end}',
    more: '… y {count} partes más',
    missing:
      'No quedan en ninguna parte: página {pages}. | No quedan en ninguna parte: páginas {pages}.',
    deletions: 'Las páginas marcadas para eliminar se dejan fuera.',
    submit: 'Crear 1 documento | Dividir en {n} documentos',
    submitNone: 'Indica cómo dividir',
    /** Ranges typed by hand that can't be read (lib/split.ts). */
    errors: {
      notRange: '«{token}» no es un intervalo (p. ej. 1-3 o 5)',
      outOfRange: '«{token}»: el documento tiene las páginas de la 1 a la {total}',
      reversed: '«{token}»: la primera página va después de la última',
    },
  },

  nup: {
    intro:
      'Varias páginas en cada hoja, reducidas: para imprimir un documento largo con menos papel. El resultado es un documento nuevo; el original no cambia.',
    noDocument: 'Abre un documento para maquetarlo.',
    perSheet: 'Páginas por hoja',
    schema: 'Esquema de la hoja',
    gridLandscape: '{cols} × {rows}, hoja horizontal',
    gridPortrait: '{cols} × {rows}, hoja vertical',
    sheetSize: 'Tamaño de la hoja',
    native: 'Como el original',
    orientation: 'Orientación',
    orientations: {
      auto: { label: 'Automática', title: 'La que mejor aprovecha la hoja' },
      portrait: 'Vertical',
      landscape: 'Horizontal',
    },
    order: 'Orden de las páginas',
    byRows: 'Por filas',
    byColumns: 'Por columnas',
    moreOptions: 'Márgenes y otras opciones',
    spacing: 'Espacio entre páginas (mm)',
    autoRotate: 'Girar las páginas si así quedan más grandes',
    submit: 'Crear documento (1 hoja) | Crear documento ({n} hojas)',
  },

  booklet: {
    intro:
      'Un cuadernillo para imprimir a doble cara y doblar por la mitad: las páginas se reordenan para que, una vez dobladas las hojas, se lean en el orden correcto. El resultado es un documento nuevo.',
    noDocument: 'Abre un documento para hacer un cuadernillo.',
    schema: 'Esquema del cuadernillo',
    schemaCaption: 'Cara de la primera hoja: última y primera página a los lados del pliegue',
    sheetSize: 'Hojas en las que imprimir',
    /** `size` is the sheet (A4…), `half` the booklet page it makes (A5…, or one of `halves`). */
    sizeOption: '{size} horizontal → cuadernillo {half}',
    halves: {
      letter: 'media Letter',
      legal: 'media Legal',
      native: 'mitad de la hoja',
    },
    binding: 'Encuadernación',
    bindings: {
      left: { label: 'A la izquierda', title: 'Se hojea de izquierda a derecha' },
      right: {
        label: 'A la derecha',
        title: 'Para textos de derecha a izquierda (árabe, hebreo, manga)',
      },
    },
    duplex: 'Impresión',
    duplexModes: {
      bothSides: { label: 'Doble cara', title: 'Impresora con doble cara automática' },
      frontOnly: { label: 'Solo anversos', title: 'Primera pasada, sin doble cara automática' },
      backOnly: {
        label: 'Solo reversos',
        title: 'Segunda pasada: da la vuelta a las hojas e imprime estas',
      },
    },
    foldLine: 'Línea discontinua en el pliegue',
    margins: 'Márgenes',
    gutter: 'Margen en el pliegue (mm)',
    sheets: '1 hoja para doblar | {n} hojas para doblar',
    blanks:
      '1 página en blanco añadida al final, para llegar a un múltiplo de 4 | {n} páginas en blanco añadidas al final, para llegar a un múltiplo de 4',
    submit: 'Crear cuadernillo',
  },

  protect: {
    intro:
      'Crea una copia del documento que solo se abre con la contraseña (cifrado AES-256). La copia aparece en la lista con un candado; el original queda como está, editable.',
    noDocument: 'Abre un documento para protegerlo.',
    password: 'Contraseña',
    repeat: 'Repite la contraseña',
    mismatch: 'Las dos contraseñas no coinciden.',
    show: 'Mostrar la contraseña',
    note: 'Se incluyen los cambios aún no aplicados. Guarda bien la contraseña: si la pierdes, la copia protegida ya no se podrá abrir.',
    submit: 'Crear copia protegida',
    allowed: 'Quien abra el archivo con la contraseña puede',
    permissions: {
      print: 'Imprimir',
      printHighQuality: 'Imprimir en alta calidad',
      copy: 'Copiar texto e imágenes',
      modify: 'Modificar el contenido',
      annotate: 'Añadir comentarios y rellenar formularios',
      fillForms: 'Rellenar formularios',
      assemble: 'Añadir, girar y eliminar páginas',
    },
    denied: {
      print: 'la impresión',
      printHighQuality: 'la impresión en alta calidad',
      copy: 'la copia de texto e imágenes',
      modify: 'los cambios en el contenido',
      annotate: 'los comentarios',
      fillForms: 'el relleno de formularios',
      assemble: 'añadir, girar y eliminar páginas',
    },
    ownerPassword: 'Contraseña para quitar las restricciones',
    ownerHint: 'Distinta de la de apertura: quien la conoce abre el archivo sin restricciones.',
    ownerSame: 'Debe ser distinta de la contraseña de apertura; si no, las restricciones no sirven.',
    restrictionsNote: 'Las restricciones son una petición a los lectores de PDF: casi todos la respetan, pero no impiden de verdad imprimir o copiar.',
    current: 'Este archivo restringe {list}.',
    currentAdvice: 'Los cambios hechos aquí quitan las restricciones: las casillas de abajo parten de ellas, para volver a ponerlas en la copia protegida.',
  },

  properties: {
    intro:
      'La información que el PDF lleva consigo y que los lectores muestran en las propiedades del archivo. Se escribe con «Aplicar cambios» o al descargar, y se deshace como los demás cambios.',
    noDocument: 'Abre un documento para ver sus propiedades.',
    permissionsAdvice: 'Los cambios hechos aquí quitan las restricciones; para volver a ponerlas, crea una copia con «Proteger».',
    loading: 'Leyendo las propiedades…',
    fields: {
      title: 'Título',
      author: 'Autor',
      subject: 'Asunto',
      keywords: 'Palabras clave',
      creator: 'Creado con',
      producer: 'Producido por',
      creationDate: 'Creado el',
      modDate: 'Modificado el',
    },
    hints: {
      title: 'Los lectores de PDF lo muestran en lugar del nombre del archivo',
      creator: 'La aplicación en la que se creó el documento',
      producer: 'El programa que escribió el PDF',
    },
    keywordsPlaceholder: 'separadas por comas',
    modified: '· modificado',
    inFile: 'En el archivo: {date}',
    clearAll: 'Quitar todas las propiedades',
    clearAllHint: 'Quita todas las propiedades, por ejemplo antes de compartir el archivo',
  },

  images: {
    intro:
      'Las imágenes que el PDF ya contiene: fotos, logotipos, escaneos. Quitarlas es un cambio como los demás: se puede deshacer, y se aplica con «Aplicar cambios» o al descargar. Sustituir una por otra imagen se aplica enseguida, en todas las páginas donde aparece, y también se puede deshacer.',
    noDocument: 'Abre un documento para ver sus imágenes.',
    searching: 'Buscando imágenes…',
    none: 'No hay imágenes en este documento. Los logotipos y gráficos dibujados como formas vectoriales no son imágenes y no aparecen aquí.',
    /** `count` is `count` below, in bold; `size` the bytes, formatted. */
    summary: '{count}, {size} en total',
    count: '1 imagen | {n} imágenes',
    removing: '· {count} por quitar ({size})',
    list: 'Imágenes del documento',
    showOnPage: 'Mostrar en la página {page}',
    toRemove: 'Por quitar',
    /** `pages` is e.g. "página 3" or "páginas 1, 4". */
    downloadOf: 'Descargar la imagen ({pages})',
    download: 'Descargar la imagen',
    restoreOf: 'Restaurar la imagen ({pages})',
    restore: 'Restaurar',
    removeFrom: 'Quitar la imagen ({pages})',
    removeEverywhere: 'Quitar de todas las páginas',
    remove: 'Quitar',
    someOnly:
      'Para quitar una imagen solo de algunas páginas, ábrela: en la página eliges si quitarla ahí o en todas partes.',
    replace: 'Sustituir',
    replaceOf: 'Sustituir la imagen de {pages}',
    replaceEverywhere: 'Sustituir en todas las páginas',
    cannotReplace:
      'Esta imagen está escrita dentro de la página (o es una máscara): no se puede sustituir',
    /** Recompressing the images, into a lighter copy. */
    compress: {
      title: 'Aligerar el archivo',
      intro:
        'Vuelve a comprimir las imágenes y las reduce a la resolución que necesitan donde se dibujan. Crea una copia: el original queda como estaba.',
      level: 'Calidad',
      levels: {
        high: { label: 'Alta calidad', hint: 'Casi igual que el original (220 ppp)' },
        balanced: { label: 'Equilibrada', hint: 'Buena en pantalla y al imprimir (150 ppp)' },
        small: { label: 'Archivo pequeño', hint: 'Para enviarlo o leerlo en pantalla (100 ppp)' },
      },
      submit: 'Comprimir las imágenes',
    },
  },

  outline: {
    intro:
      'Los marcadores del documento. Haz clic en una entrada para ir a su página; con Mayús seleccionas todas las páginas hasta esa, con ⌘/Ctrl la añades a la selección. El índice se conserva aunque elimines, reordenes, extraigas o unas páginas.',
    noDocument: 'Abre un documento para ver su índice.',
    loading: 'Leyendo el índice…',
    none: 'Este documento no tiene índice.',
    tree: 'Índice del documento',
    untitled: 'Sin título',
    deleted: 'por eliminar',
    page: 'p. {page}',
    open: 'Abrir {title}',
    close: 'Cerrar {title}',
    nowhere: 'No lleva a ninguna página de este documento',
  },
} satisfies Messages['tools']
