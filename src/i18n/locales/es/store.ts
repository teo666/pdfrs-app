/** Spanish messages: store. */
import type { Messages } from '../it'

export default {
  /** What went wrong, as the error bar shows it. */
  errors: {
    notPdfOrJpeg: '{name}: no es un PDF ni una imagen JPEG',
    insertProtected:
      '{name} está protegido con contraseña: ábrelo y desbloquéalo, luego inserta la copia desbloqueada',
    noDocument: 'ningún documento',
    noActiveDocument: 'ningún documento activo',
    emptyDocument:
      'el documento quedaría vacío: deshaz al menos una eliminación antes de confirmar',
    wrongPassword: 'contraseña incorrecta',
    jpegColorSpace: 'espacio de color JPEG no admitido: {space} (admitidos: RGB, escala de grises)',
    invalidJpeg: 'no es un JPEG válido: {detail}',
    imageDecode: 'no se puede decodificar la imagen',
    imageDraw: 'no se puede dibujar la imagen',
  },
  /** What just happened, as the notice at the bottom says it. */
  notices: {
    merged: 'Se han unido {n} documentos: los originales siguen abiertos',
    inserted: 'Se ha insertado 1 página | Se han insertado {n} páginas',
    moved: 'Se ha movido 1 página a «{target}» | Se han movido {n} páginas a «{target}»',
    copied: 'Se ha copiado 1 página a «{target}» | Se han copiado {n} páginas a «{target}»',
    created: 'Se ha creado «{name}»: el original queda como estaba',
    split: 'Se ha creado 1 documento | Se han creado {n} documentos: el original queda como estaba',
    extracted: '1 página en «{name}» | {n} páginas en «{name}»',
    protected: 'Se ha creado «{name}», protegido con contraseña: el original queda como estaba',
    unlocked: 'Se ha creado «{name}», sin contraseña',
  },
  /** The buttons on the notices. */
  actions: {
    open: 'Abrir',
    backToOriginal: 'Volver al original',
    backToProtected: 'Volver al protegido',
  },
  /** Names given to the documents and files the app makes. */
  names: {
    merged: 'Unión de {n} documentos.pdf',
    nup: '{base} ({n} por hoja).pdf',
    booklet: '{base} (cuadernillo).pdf',
    part: '{base} (parte {index} de {total}).pdf',
    extracted: '{base} (extracto).pdf',
    protected: '{base} (protegido).pdf',
    unlocked: '{base} (desbloqueado).pdf',
    image: '{base} - imagen {n}.{extension}',
    signature: 'Firma {n}',
  },
  /** Adding signatures and images to the library. */
  library: {
    whiteBackground: 'El fondo blanco de la imagen se ha vuelto transparente.',
    unreadable: 'Imagen ilegible: {reason}',
  },
} satisfies Messages['store']
