/** Italian messages: tools. */
export default {
  /** Shared by several tools. */
  common: {
    pages: '1 pagina | {n} pagine',
    placeOnPage: 'Metti su pagina {page}',
    placeNamedOnPage: 'Metti «{name}» sulla pagina {page}',
    removeFromLibrary: 'Togli «{name}» dalla libreria',
    removeFromLibraryHint: 'Togli dalla libreria (resta sulle pagine dove l’hai già messa)',
    uploadImage: 'Carica un’immagine',
    /** `items` is e.g. "2 firme", `pages` e.g. "1 pagina". */
    placed: '{items} su {pages}: finiscono nel PDF quando applichi le modifiche o lo scarichi.',
    borders: 'Bordo attorno a ogni pagina',
    margin: 'Margine (mm)',
  },

  rail: {
    navLabel: 'Strumenti',
    sign: { label: 'Firma', hint: 'Firma: disegna o carica una firma e mettila sulle pagine' },
    image: { label: 'Immagine', hint: 'Immagine: un logo, un timbro o una foto sopra le pagine' },
    text: {
      label: 'Testo',
      hint: 'Testo: scrivi sopra le pagine, con testo vero e selezionabile',
    },
    watermark: { label: 'Filigrana', hint: 'Filigrana: un testo, come «BOZZA», su tutte le pagine o su quelle selezionate' },
    merge: { label: 'Unisci', hint: 'Unisci più documenti in uno' },
    split: { label: 'Dividi', hint: 'Dividi il documento in più parti' },
    nup: { label: 'N per foglio', hint: 'Più pagine su ogni foglio, per stampare con meno carta' },
    booklet: { label: 'Libretto', hint: 'Libretto da stampare fronte e retro e piegare a metà' },
    outline: {
      label: 'Indice',
      hint: 'Indice del documento: i segnalibri, per andare alle pagine',
    },
    images: { label: 'Immagini', hint: 'Le immagini già nel PDF: vedile, scaricale, sostituiscile, rimuovile o alleggeriscile' },
    protect: {
      label: 'Proteggi',
      hint: 'Proteggi con password: una copia che si apre solo con la password',
    },
    properties: {
      label: 'Proprietà',
      hint: 'Proprietà del documento: titolo, autore, oggetto, parole chiave',
    },
    history: { label: 'Cronologia', hint: 'Cronologia delle modifiche: torna a qualsiasi passo' },
  },

  panel: {
    titles: {
      sign: 'Firma',
      image: 'Immagine',
      text: 'Testo',
      merge: 'Unisci documenti',
      split: 'Dividi documento',
      nup: 'Più pagine per foglio',
      booklet: 'Libretto',
      protect: 'Proteggi con password',
      properties: 'Proprietà del documento',
      images: 'Immagini del documento',
      history: 'Cronologia delle modifiche',
      outline: 'Indice del documento',
      watermark: 'Filigrana',
    },
    close: 'Chiudi il pannello',
    locked: '«{name}» è protetto da password: sbloccalo per usare questo strumento.',
  },

  scope: {
    /** `target` is one of the two below, shown in bold. */
    appliesTo: 'Si applica {target}',
    selected: 'alla pagina selezionata | alle {n} pagine selezionate',
    all: 'all’unica pagina | a tutte le {n} pagine',
    hint: '(seleziona delle pagine per usarne solo alcune)',
  },

  sign: {
    intro:
      'Disegna o carica la tua firma, poi mettila su una pagina: si apre la pagina in grande, dove la sposti, la ridimensioni, la ruoti e, se vuoi, la metti uguale su tutte le pagine.',
    noDocument: 'Apri un documento per firmarlo.',
    yours: 'Le tue firme',
    draw: 'Disegna una firma',
    placedCount: '1 firma | {n} firme',
    privacy:
      'Le firme restano solo in questa scheda del browser e non vengono salvate da nessuna parte.',
  },

  image: {
    intro:
      'Un logo, un timbro o una foto sopra le pagine: caricala, poi mettila su una pagina. Si apre la pagina in grande, dove la sposti, la ridimensioni, la ruoti e, se vuoi, la metti uguale su tutte le pagine.',
    noDocument: 'Apri un documento per inserirci delle immagini.',
    yours: 'Le tue immagini',
    formats:
      'PNG, JPEG, WebP o GIF. La trasparenza dei PNG resta; le immagini più grandi di 1600 pixel vengono ridotte.',
    placedCount: '1 immagine | {n} immagini',
  },

  watermark: {
    intro: 'Un testo ripetuto sulle pagine, come «BOZZA» o «RISERVATO». Entra subito nel documento e le miniature lo mostrano com’è; si toglie con Annulla o dalla Cronologia.',
    noDocument: 'Apri un documento per metterci una filigrana.',
    defaultText: 'BOZZA',
    size: 'Dimensione',
    sizeFit: 'Adatta alla pagina',
    sizePoints: 'Fissa',
    sizeLabel: 'Dimensione in punti',
    angle: 'Inclinazione',
    angles: {
      rising: 'In diagonale, verso l’alto',
      horizontal: 'Orizzontale',
      falling: 'In diagonale, verso il basso',
      vertical: 'Verticale',
    },
    opacity: 'Opacità',
    position: 'Posizione',
    positions: {
      top: 'In alto',
      center: 'Al centro',
      bottom: 'In basso',
    },
    layer: 'Livello',
    layers: {
      over: 'Sopra il contenuto',
      under: 'Sotto il contenuto',
    },
    underHint: 'Sotto il contenuto non copre il testo, ma non si vede sulle pagine con uno sfondo pieno, come le scansioni.',
    preview: 'Anteprima della filigrana sulla pagina {page}',
    submit: 'Applica filigrana',
  },

  text: {
    intro:
      'Testo vero sopra le pagine, selezionabile e ricercabile nel PDF. Scrivilo qui, poi mettilo su una pagina: si apre la pagina in grande, dove lo sposti, lo ridimensioni, lo ruoti e, se vuoi, lo metti uguale su tutte le pagine. Con un doppio clic lo modifichi.',
    noDocument: 'Apri un documento per scriverci sopra.',
    preview: 'Anteprima del testo',
    placedCount: '1 testo | {n} testi',
    fonts:
      'Font standard del PDF (Helvetica, Times, Courier): nessun font viene incorporato, e i caratteri sono quelli delle lingue dell’Europa occidentale.',
  },

  merge: {
    intro:
      'I documenti sono uniti così come appaiono ora (riordini, rotazioni, eliminazioni e firme comprese), nell’ordine della lista. Il risultato si apre come nuovo documento; gli originali restano aperti.',
    picked: 'Da unire, in quest’ordine',
    empty: 'Nessun documento: aggiungine almeno due dall’elenco qui sotto.',
    moveUp: 'Sposta su {name}',
    moveDown: 'Sposta giù {name}',
    remove: 'Togli {name} dall’unione',
    others: 'Altri documenti aperti',
    add: 'Aggiungi {name} all’unione',
    openMore: 'Apri altri file da unire',
    pickTwo: 'Scegli almeno due documenti',
    submit: 'Unisci {documents} documenti ({pages} pagine)',
  },

  split: {
    intro:
      'Taglia il documento in più parti: ognuna diventa un nuovo documento, con le pagine così come appaiono ora. L’originale non cambia.',
    noDocument: 'Apri un documento per dividerlo.',
    mode: 'Come dividere',
    modes: {
      every: { label: 'Ogni N', title: 'Parti di N pagine ciascuna' },
      ranges: { label: 'Intervalli', title: 'Scrivi gli intervalli, es. 1-3, 4-8' },
      selection: { label: 'Selezione', title: 'Ogni pagina selezionata inizia una nuova parte' },
    },
    size: 'Pagine per parte',
    sizeHint: '1 = un documento per ogni pagina',
    ranges: 'Intervalli, uno per parte',
    rangesPlaceholder: 'es. 1-3, 4-8, 9-{total}',
    rangesLabel: 'Intervalli di pagine',
    rangesHint: 'Numeri delle pagine come sulle miniature; una pagina sola vale come parte.',
    selectionHint:
      'Seleziona le pagine da cui deve iniziare ogni nuova parte: la prima parte parte sempre da pagina 1.',
    selected: 'Selezionate: {pages}.',
    parts: 'Parti',
    partsCount: '1 parte | {n} parti',
    part: 'Parte {number}: {range}',
    onePage: 'pagina {start}',
    pageRange: 'pagine {start}–{end}',
    more: '… e altre {count} parti',
    missing:
      'Non finiscono in nessuna parte: pagina {pages}. | Non finiscono in nessuna parte: pagine {pages}.',
    deletions: 'Le pagine segnate da eliminare vengono lasciate fuori.',
    submit: 'Crea 1 documento | Dividi in {n} documenti',
    submitNone: 'Indica come dividere',
    /** Ranges typed by hand that can't be read (lib/split.ts). */
    errors: {
      notRange: '«{token}» non è un intervallo (es. 1-3 oppure 5)',
      outOfRange: '«{token}»: il documento ha le pagine da 1 a {total}',
      reversed: '«{token}»: la prima pagina viene dopo l’ultima',
    },
  },

  nup: {
    intro:
      'Più pagine su ogni foglio, rimpicciolite: per stampare un documento lungo con meno carta. Il risultato è un nuovo documento; l’originale non cambia.',
    noDocument: 'Apri un documento per impaginarlo.',
    perSheet: 'Pagine per foglio',
    schema: 'Schema del foglio',
    gridLandscape: '{cols} × {rows}, foglio orizzontale',
    gridPortrait: '{cols} × {rows}, foglio verticale',
    sheetSize: 'Formato del foglio',
    native: 'Come l’originale',
    orientation: 'Orientamento',
    orientations: {
      auto: { label: 'Automatico', title: 'Quello che sfrutta meglio il foglio' },
      portrait: 'Verticale',
      landscape: 'Orizzontale',
    },
    order: 'Ordine delle pagine',
    byRows: 'Per righe',
    byColumns: 'Per colonne',
    moreOptions: 'Margini e altre opzioni',
    spacing: 'Spazio tra pagine (mm)',
    autoRotate: 'Ruota le pagine se così stanno più grandi',
    submit: 'Crea documento (1 foglio) | Crea documento ({n} fogli)',
  },

  booklet: {
    intro:
      'Un libretto da stampare fronte e retro e piegare a metà: le pagine vengono riordinate in modo che, piegati i fogli, si leggano nell’ordine giusto. Il risultato è un nuovo documento.',
    noDocument: 'Apri un documento per farne un libretto.',
    schema: 'Schema del libretto',
    schemaCaption: 'Fronte del primo foglio: ultima e prima pagina ai lati della piega',
    sheetSize: 'Fogli su cui stampare',
    /** `size` is the sheet (A4…), `half` the booklet page it makes (A5…, or one of `halves`). */
    sizeOption: '{size} orizzontale → libretto {half}',
    halves: {
      letter: 'mezzo Letter',
      legal: 'mezzo Legal',
      native: 'metà del foglio',
    },
    binding: 'Rilegatura',
    bindings: {
      left: { label: 'A sinistra', title: 'Si sfoglia da sinistra a destra' },
      right: { label: 'A destra', title: 'Per testi da destra a sinistra (arabo, ebraico, manga)' },
    },
    duplex: 'Stampa',
    duplexModes: {
      bothSides: { label: 'Fronte e retro', title: 'Stampante con fronte/retro automatico' },
      frontOnly: { label: 'Solo fronti', title: 'Primo passaggio, senza fronte/retro automatico' },
      backOnly: { label: 'Solo retri', title: 'Secondo passaggio: rigira i fogli e stampa questi' },
    },
    foldLine: 'Linea tratteggiata sulla piega',
    margins: 'Margini',
    gutter: 'Margine sulla piega (mm)',
    sheets: '1 foglio da piegare | {n} fogli da piegare',
    blanks:
      '1 pagina bianca aggiunta in fondo, per arrivare a un multiplo di 4 | {n} pagine bianche aggiunte in fondo, per arrivare a un multiplo di 4',
    submit: 'Crea libretto',
  },

  protect: {
    intro:
      'Crea una copia del documento che si apre solo con la password (cifratura AES-256). La copia compare nell’elenco con un lucchetto; l’originale resta com’è, modificabile.',
    noDocument: 'Apri un documento per proteggerlo.',
    password: 'Password',
    repeat: 'Ripeti la password',
    mismatch: 'Le due password non coincidono.',
    show: 'Mostra la password',
    note: 'Le modifiche non ancora applicate sono comprese. Conserva la password: se la perdi, la copia protetta non si può più aprire.',
    submit: 'Crea copia protetta',
    allowed: 'Chi apre il file con la password può',
    permissions: {
      print: 'Stampare',
      printHighQuality: 'Stampare in alta qualità',
      copy: 'Copiare testo e immagini',
      modify: 'Modificare il contenuto',
      annotate: 'Aggiungere commenti e compilare i moduli',
      fillForms: 'Compilare i moduli',
      assemble: 'Aggiungere, ruotare ed eliminare pagine',
    },
    denied: {
      print: 'la stampa',
      printHighQuality: 'la stampa in alta qualità',
      copy: 'la copia di testo e immagini',
      modify: 'le modifiche al contenuto',
      annotate: 'i commenti',
      fillForms: 'la compilazione dei moduli',
      assemble: 'l’aggiunta, la rotazione e l’eliminazione di pagine',
    },
    ownerPassword: 'Password per togliere le limitazioni',
    ownerHint: 'Diversa da quella di apertura: chi la conosce apre il file senza limitazioni.',
    ownerSame: 'Deve essere diversa dalla password di apertura, altrimenti le limitazioni non valgono.',
    restrictionsNote: 'Le limitazioni sono una richiesta ai lettori PDF: quasi tutti la rispettano, ma non impediscono davvero di stampare o copiare.',
    current: 'Questo file limita {list}.',
    currentAdvice: 'Le modifiche fatte qui tolgono le limitazioni: le caselle qui sotto partono da queste, per rimetterle nella copia protetta.',
  },

  properties: {
    intro:
      'Le informazioni che il PDF porta con sé e che i lettori mostrano nelle proprietà del file. Si scrivono con «Applica modifiche» o scaricando, e si annullano come le altre modifiche.',
    noDocument: 'Apri un documento per vederne le proprietà.',
    permissionsAdvice: 'Le modifiche fatte qui tolgono le limitazioni; per rimetterle, crea una copia con «Proteggi».',
    loading: 'Lettura delle proprietà…',
    fields: {
      title: 'Titolo',
      author: 'Autore',
      subject: 'Oggetto',
      keywords: 'Parole chiave',
      creator: 'Creato con',
      producer: 'Prodotto da',
      creationDate: 'Creato il',
      modDate: 'Modificato il',
    },
    hints: {
      title: 'I lettori PDF lo mostrano al posto del nome del file',
      creator: 'L’applicazione in cui è nato il documento',
      producer: 'Il programma che ha scritto il PDF',
    },
    keywordsPlaceholder: 'separate da virgole',
    modified: '· modificato',
    inFile: 'Nel file: {date}',
    clearAll: 'Togli tutte le proprietà',
    clearAllHint: 'Toglie tutte le proprietà, per esempio prima di condividere il file',
  },

  images: {
    intro:
      'Le immagini che il PDF contiene già: foto, loghi, scansioni. Rimuoverle è una modifica come le altre: si annulla, e si applica con «Applica modifiche» o scaricando. Sostituirne una con un’altra figura vale subito, in ogni pagina in cui compare, e si annulla anche quello.',
    noDocument: 'Apri un documento per vederne le immagini.',
    searching: 'Ricerca delle immagini…',
    none: 'Nessuna immagine in questo documento. Loghi e grafiche disegnati come forme vettoriali non sono immagini e non compaiono qui.',
    /** `count` is `count` below, in bold; `size` the bytes, formatted. */
    summary: '{count}, {size} in tutto',
    count: '1 immagine | {n} immagini',
    removing: '· {count} da rimuovere ({size})',
    list: 'Immagini del documento',
    showOnPage: 'Mostra nella pagina {page}',
    toRemove: 'Da rimuovere',
    /** `pages` is e.g. "pagina 3" or "pagine 1, 4". */
    downloadOf: 'Scarica l’immagine di {pages}',
    download: 'Scarica l’immagine',
    restoreOf: 'Ripristina l’immagine di {pages}',
    restore: 'Ripristina',
    removeFrom: 'Rimuovi l’immagine da {pages}',
    removeEverywhere: 'Rimuovi da tutte le pagine',
    remove: 'Rimuovi',
    someOnly:
      'Per togliere un’immagine solo da alcune pagine, aprila: nella pagina si sceglie se toglierla lì o ovunque.',
    replace: 'Sostituisci',
    replaceOf: 'Sostituisci l’immagine di {pages}',
    replaceEverywhere: 'Sostituisci in tutte le pagine',
    cannotReplace:
      'Questa immagine è scritta dentro la pagina (o è una maschera): non si può sostituire',
    /** Recompressing the images, into a lighter copy. */
    compress: {
      title: 'Alleggerisci il file',
      intro:
        'Ricomprime le immagini e le riduce alla risoluzione che serve dove sono disegnate. Crea una copia: l’originale resta com’era.',
      level: 'Qualità',
      levels: {
        high: { label: 'Alta qualità', hint: 'Quasi uguale all’originale (220 dpi)' },
        balanced: { label: 'Bilanciata', hint: 'Buona a schermo e in stampa (150 dpi)' },
        small: { label: 'File piccolo', hint: 'Per inviarlo o leggerlo a schermo (100 dpi)' },
      },
      submit: 'Comprimi le immagini',
    },
  },

  outline: {
    intro:
      'I segnalibri del documento. Fai clic su una voce per andare alla sua pagina; con Maiusc selezioni tutte le pagine fino a quella, con ⌘/Ctrl la aggiungi alla selezione. Puoi aggiungere, rinominare, spostare e togliere le voci: le modifiche si applicano con le altre. L’indice resta anche quando elimini, riordini, estrai, sposti o unisci pagine.',
    noDocument: 'Apri un documento per vederne l’indice.',
    loading: 'Lettura dell’indice…',
    none: 'Questo documento non ha un indice.',
    tree: 'Indice del documento',
    untitled: 'Senza titolo',
    deleted: 'da eliminare',
    page: 'p. {page}',
    open: 'Apri {title}',
    close: 'Chiudi {title}',
    nowhere: 'Non porta a una pagina di questo documento',
    add: 'Aggiungi una voce per la pagina {page}',
    newTitle: 'Pagina {page}',
    commands: 'Comandi della voce scelta',
    commandsFor: 'Comandi per «{title}»',
    rename: 'Rinomina (F2 o doppio clic)',
    renameLabel: 'Titolo della voce',
    moveUp: 'Sposta su (Alt+↑)',
    moveDown: 'Sposta giù (Alt+↓)',
    outdent: 'Riduci il rientro (Alt+←)',
    indent: 'Rientra sotto la voce precedente (Alt+→)',
    remove: 'Elimina, con le voci sotto (Canc)',
    keys: 'Scegli una voce con un clic, poi usa i comandi qui sopra o la tastiera.',
    link: 'link',
  },
}
