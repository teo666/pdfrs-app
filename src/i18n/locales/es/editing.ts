/** Spanish messages: editing. */
import type { Messages } from '../it'

export default {
  signaturePad: {
    canvas: 'Área para dibujar la firma',
    placeholder: 'Firma aquí con el ratón o con el dedo',
    ink: 'Tinta',
    clear: 'Borrar',
    use: 'Usar esta firma',
    cancel: 'Cancelar',
  },
  textEditor: {
    text: 'Texto',
    placeholder: 'Escribe aquí (Intro para saltar de línea)',
    unsupported:
      'Algunos caracteres no existen en las fuentes estándar del PDF y aparecerán como «?» (sirven las letras latinas, los acentos, € y «»).',
    font: 'Fuente',
    sansSerif: 'Sin serifa',
    serif: 'Con serifa',
    monospace: 'De máquina de escribir',
    size: 'Tamaño (pt)',
    sizeLabel: 'Tamaño en puntos',
    style: 'Estilo',
    bold: 'Negrita',
    boldShort: 'N',
    italic: 'Cursiva',
    italicShort: 'K',
    align: 'Alineación',
    left: 'Izquierda',
    center: 'Centro',
    right: 'Derecha',
  },
  colorPicker: {
    color: 'Color',
    black: 'Negro',
    blue: 'Azul',
    red: 'Rojo',
    green: 'Verde',
    custom: 'Elegir otro color',
  },
  lockedDocument: {
    section: '{name}, protegido con contraseña',
    explanation:
      'Está protegido con contraseña. Para verlo o editarlo, desbloquéalo: se crea una copia sin contraseña, junto a este.',
    password: 'Contraseña',
    passwordLabel: 'Contraseña del documento',
    wrong: 'Contraseña incorrecta: inténtalo de nuevo.',
    unlock: 'Desbloquear',
    downloadTitle: 'Descarga el PDF protegido, tal como está',
    download: 'Descargar protegido',
  },
  emptyState: {
    drop: 'Arrastra aquí tus PDF o JPEG',
    click: 'o haz clic para elegirlos',
    local: 'Los archivos se quedan en tu ordenador: se procesan en el navegador.',
  },
  themeSwitcher: {
    group: 'Tema',
    auto: 'Tema automático (como el sistema)',
    light: 'Tema claro',
    dark: 'Tema oscuro',
  },
  locale: {
    label: 'Idioma',
  },
} satisfies Messages['editing']
