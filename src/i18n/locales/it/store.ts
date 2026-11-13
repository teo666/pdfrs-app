/** Italian messages: store. */
export default {
  /** What went wrong, as the error bar shows it. */
  errors: {
    notPdfOrJpeg: "{name}: non è un PDF né un'immagine JPEG",
    insertProtected:
      '{name} è protetto da password: aprilo e sbloccalo, poi inserisci la copia sbloccata',
    noDocument: 'nessun documento',
    noActiveDocument: 'nessun documento attivo',
    emptyDocument:
      "il documento risulterebbe vuoto: annulla almeno un'eliminazione prima di confermare",
    wrongPassword: 'password errata',
    jpegColorSpace: 'spazio colore JPEG non supportato: {space} (supportati: RGB, scala di grigi)',
    invalidJpeg: 'non è un JPEG valido: {detail}',
    imageDecode: 'impossibile decodificare l’immagine',
    imageDraw: 'impossibile disegnare l’immagine',
  },
  /** What just happened, as the notice at the bottom says it. */
  notices: {
    merged: 'Uniti {n} documenti: gli originali restano aperti',
    inserted: 'Inserita 1 pagina | Inserite {n} pagine',
    moved: 'Spostata 1 pagina in «{target}» | Spostate {n} pagine in «{target}»',
    copied: 'Copiata 1 pagina in «{target}» | Copiate {n} pagine in «{target}»',
    created: 'Creato «{name}»: l’originale resta com’era',
    split: 'Creato 1 documento | Creati {n} documenti: l’originale resta com’era',
    extracted: '1 pagina in «{name}» | {n} pagine in «{name}»',
    protected: 'Creato «{name}», protetto da password: l’originale resta com’era',
    unlocked: 'Creato «{name}», senza password',
    imageReplaced: 'Immagine sostituita | Immagine sostituita in {n} pagine',
    /** `before`/`after`: the file's size, formatted. */
    compressed: 'Creato «{name}»: da {before} a {after} (−{percent}%)',
    nothingToCompress: 'Nessuna immagine si alleggerisce a questo livello: il file resta com’è',
  },
  /** The buttons on the notices. */
  actions: {
    open: 'Apri',
    backToOriginal: 'Torna all’originale',
    backToProtected: 'Torna al protetto',
  },
  /** Names given to the documents and files the app makes. */
  names: {
    merged: 'Unione di {n} documenti.pdf',
    nup: '{base} ({n} per foglio).pdf',
    booklet: '{base} (libretto).pdf',
    part: '{base} (parte {index} di {total}).pdf',
    extracted: '{base} (estratto).pdf',
    protected: '{base} (protetto).pdf',
    unlocked: '{base} (sbloccato).pdf',
    image: '{base} - immagine {n}.{extension}',
    signature: 'Firma {n}',
    compressed: '{base} (compresso).pdf',
  },
  /** Adding signatures and images to the library. */
  library: {
    whiteBackground: 'Lo sfondo bianco dell’immagine è stato reso trasparente.',
    unreadable: 'Immagine non leggibile: {reason}',
  },
}
