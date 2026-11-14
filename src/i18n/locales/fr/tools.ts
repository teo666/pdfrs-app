/** French messages: tools. */
import type { Messages } from '../it'

export default {
  /** Shared by several tools. */
  common: {
    pages: '1 page | {n} pages',
    placeOnPage: 'Placer sur la page {page}',
    placeNamedOnPage: 'Placer « {name} » sur la page {page}',
    removeFromLibrary: 'Retirer « {name} » de la bibliothèque',
    removeFromLibraryHint:
      'Retirer de la bibliothèque (elle reste sur les pages où vous l’avez déjà placée)',
    uploadImage: 'Importer une image',
    /** `items` is e.g. "2 signatures", `pages` e.g. "1 page". */
    placed:
      '{items} sur {pages}. Le PDF les inclura quand vous appliquerez les modifications ou le téléchargerez.',
    borders: 'Bordure autour de chaque page',
    margin: 'Marge (mm)',
  },

  rail: {
    navLabel: 'Outils',
    sign: {
      label: 'Signer',
      hint: 'Signer : dessinez ou importez une signature et placez-la sur les pages',
    },
    image: {
      label: 'Image',
      hint: 'Image : un logo, un tampon ou une photo par-dessus les pages',
    },
    text: {
      label: 'Texte',
      hint: 'Texte : écrivez sur les pages, avec du vrai texte sélectionnable',
    },
    watermark: { label: 'Filigrane', hint: 'Filigrane : un texte, comme « BROUILLON », sur toutes les pages ou sur celles sélectionnées' },
    merge: { label: 'Fusionner', hint: 'Fusionner plusieurs documents en un seul' },
    split: { label: 'Diviser', hint: 'Diviser le document en plusieurs parties' },
    nup: {
      label: 'N par feuille',
      hint: 'Plusieurs pages par feuille, pour imprimer avec moins de papier',
    },
    booklet: { label: 'Livret', hint: 'Livret à imprimer en recto verso et à plier en deux' },
    outline: {
      label: 'Signets',
      hint: 'Table des matières du document : les signets, pour aller aux pages',
    },
    images: {
      label: 'Images',
      hint: 'Les images déjà présentes dans le PDF : affichez-les, téléchargez-les, remplacez-les, retirez-les ou allégez-les',
    },
    protect: {
      label: 'Protéger',
      hint: 'Protéger par mot de passe : une copie qui ne s’ouvre qu’avec le mot de passe',
    },
    properties: {
      label: 'Propriétés',
      hint: 'Propriétés du document : titre, auteur, sujet, mots-clés',
    },
    history: {
      label: 'Historique',
      hint: 'Historique des modifications : revenez à n’importe quelle étape',
    },
  },

  panel: {
    titles: {
      sign: 'Signer',
      image: 'Image',
      text: 'Texte',
      merge: 'Fusionner des documents',
      split: 'Diviser le document',
      nup: 'Plusieurs pages par feuille',
      booklet: 'Livret',
      protect: 'Protéger par mot de passe',
      properties: 'Propriétés du document',
      images: 'Images du document',
      history: 'Historique des modifications',
      outline: 'Table des matières',
      watermark: 'Filigrane',
    },
    close: 'Fermer le panneau',
    locked: '« {name} » est protégé par mot de passe : déverrouillez-le pour utiliser cet outil.',
  },

  scope: {
    /** `target` is one of the two below, shown in bold. */
    appliesTo: 'S’applique {target}',
    selected: 'à la page sélectionnée | aux {n} pages sélectionnées',
    all: 'à la seule page | à toutes les {n} pages',
    hint: '(sélectionnez des pages pour n’en utiliser que certaines)',
  },

  sign: {
    intro:
      'Dessinez ou importez votre signature, puis placez-la sur une page : la page s’ouvre en grand, et vous pouvez y déplacer, redimensionner et faire pivoter la signature et, si vous le souhaitez, la reproduire à l’identique sur toutes les pages.',
    noDocument: 'Ouvrez un document pour le signer.',
    yours: 'Vos signatures',
    draw: 'Dessiner une signature',
    placedCount: '1 signature | {n} signatures',
    privacy:
      'Les signatures restent uniquement dans cet onglet du navigateur et ne sont enregistrées nulle part.',
  },

  image: {
    intro:
      'Un logo, un tampon ou une photo par-dessus les pages : importez l’image, puis placez-la sur une page. La page s’ouvre en grand, et vous pouvez y déplacer, redimensionner et faire pivoter l’image et, si vous le souhaitez, la reproduire à l’identique sur toutes les pages.',
    noDocument: 'Ouvrez un document pour y insérer des images.',
    yours: 'Vos images',
    formats:
      'PNG, JPEG, WebP ou GIF. La transparence des PNG est conservée ; les images de plus de 1600 pixels sont réduites.',
    placedCount: '1 image | {n} images',
  },

  watermark: {
    intro: 'Un texte répété sur les pages, comme « BROUILLON » ou « CONFIDENTIEL ». Il entre tout de suite dans le document et les miniatures le montrent tel quel ; Annuler ou l’Historique le retirent.',
    noDocument: 'Ouvrez un document pour y mettre un filigrane.',
    defaultText: 'BROUILLON',
    size: 'Taille',
    sizeFit: 'Adapter à la page',
    sizePoints: 'Fixe',
    sizeLabel: 'Taille en points',
    angle: 'Inclinaison',
    angles: {
      rising: 'En diagonale, montante',
      horizontal: 'Horizontal',
      falling: 'En diagonale, descendante',
      vertical: 'Vertical',
    },
    opacity: 'Opacité',
    position: 'Position',
    positions: {
      top: 'En haut',
      center: 'Au centre',
      bottom: 'En bas',
    },
    layer: 'Plan',
    layers: {
      over: 'Sur le contenu',
      under: 'Sous le contenu',
    },
    underHint: 'Sous le contenu, il ne cache aucun texte, mais il ne se voit pas sur les pages à fond plein, comme les numérisations.',
    preview: 'Aperçu du filigrane sur la page {page}',
    submit: 'Appliquer le filigrane',
  },

  text: {
    intro:
      'Du vrai texte par-dessus les pages, sélectionnable et consultable par recherche dans le PDF. Saisissez-le ici, puis placez-le sur une page : la page s’ouvre en grand, et vous pouvez y déplacer, redimensionner et faire pivoter le texte et, si vous le souhaitez, le reproduire à l’identique sur toutes les pages. Double-cliquez dessus pour le modifier.',
    noDocument: 'Ouvrez un document pour écrire dessus.',
    preview: 'Aperçu du texte',
    placedCount: '1 texte | {n} textes',
    fonts:
      'Polices standard du PDF (Helvetica, Times, Courier) : aucune police n’est incorporée, et les caractères sont ceux des langues d’Europe occidentale.',
  },

  merge: {
    intro:
      'Les documents sont fusionnés tels qu’ils apparaissent maintenant (réorganisations, rotations, suppressions et signatures comprises), dans l’ordre de la liste. Le résultat s’ouvre comme un nouveau document ; les originaux restent ouverts.',
    picked: 'À fusionner, dans cet ordre',
    empty: 'Aucun document : ajoutez-en au moins deux depuis la liste ci-dessous.',
    moveUp: 'Monter {name}',
    moveDown: 'Descendre {name}',
    remove: 'Retirer {name} de la fusion',
    others: 'Autres documents ouverts',
    add: 'Ajouter {name} à la fusion',
    openMore: 'Ouvrir d’autres fichiers à fusionner',
    pickTwo: 'Choisissez au moins deux documents',
    submit: 'Fusionner {documents} documents ({pages} pages)',
  },

  split: {
    intro:
      'Découpez le document en plusieurs parties : chacune devient un nouveau document, avec les pages telles qu’elles apparaissent maintenant. L’original ne change pas.',
    noDocument: 'Ouvrez un document pour le diviser.',
    mode: 'Comment diviser',
    modes: {
      every: { label: 'Toutes les N', title: 'Parties de N pages chacune' },
      ranges: { label: 'Plages', title: 'Saisissez les plages, par ex. 1-3, 4-8' },
      selection: {
        label: 'Sélection',
        title: 'Chaque page sélectionnée commence une nouvelle partie',
      },
    },
    size: 'Pages par partie',
    sizeHint: '1 = un document par page',
    ranges: 'Plages, une par partie',
    rangesPlaceholder: 'par ex. 1-3, 4-8, 9-{total}',
    rangesLabel: 'Plages de pages',
    rangesHint:
      'Numéros des pages comme sur les miniatures ; une page seule compte comme une partie.',
    selectionHint:
      'Sélectionnez les pages par lesquelles commence chaque nouvelle partie : la première partie commence toujours à la page 1.',
    selected: 'Sélectionnées : {pages}.',
    parts: 'Parties',
    partsCount: '1 partie | {n} parties',
    part: 'Partie {number} : {range}',
    onePage: 'page {start}',
    pageRange: 'pages {start}–{end}',
    more: '… et {count} autres parties',
    missing: 'Dans aucune partie : page {pages}. | Dans aucune partie : pages {pages}.',
    deletions: 'Les pages marquées pour suppression sont laissées de côté.',
    submit: 'Créer 1 document | Diviser en {n} documents',
    submitNone: 'Indiquez comment diviser',
    /** Ranges typed by hand that can't be read (lib/split.ts). */
    errors: {
      notRange: '« {token} » n’est pas une plage (par ex. 1-3 ou 5)',
      outOfRange: '« {token} » : le document va de la page 1 à la page {total}',
      reversed: '« {token} » : la première page vient après la dernière',
    },
  },

  nup: {
    intro:
      'Plusieurs pages réduites sur chaque feuille, pour imprimer un long document avec moins de papier. Le résultat est un nouveau document ; l’original ne change pas.',
    noDocument: 'Ouvrez un document pour le mettre en page.',
    perSheet: 'Pages par feuille',
    schema: 'Schéma de la feuille',
    gridLandscape: '{cols} × {rows}, feuille en paysage',
    gridPortrait: '{cols} × {rows}, feuille en portrait',
    sheetSize: 'Format de la feuille',
    native: 'Comme l’original',
    orientation: 'Orientation',
    orientations: {
      auto: { label: 'Automatique', title: 'Celle qui exploite le mieux la feuille' },
      portrait: 'Portrait',
      landscape: 'Paysage',
    },
    order: 'Ordre des pages',
    byRows: 'Par lignes',
    byColumns: 'Par colonnes',
    moreOptions: 'Marges et autres options',
    spacing: 'Espace entre les pages (mm)',
    autoRotate: 'Faire pivoter les pages si elles y sont plus grandes',
    submit: 'Créer le document (1 feuille) | Créer le document ({n} feuilles)',
  },

  booklet: {
    intro:
      'Un livret à imprimer en recto verso et à plier en deux : les pages sont réorganisées pour que, une fois les feuilles pliées, elles se lisent dans le bon ordre. Le résultat est un nouveau document.',
    noDocument: 'Ouvrez un document pour en faire un livret.',
    schema: 'Schéma du livret',
    schemaCaption:
      'Recto de la première feuille : dernière et première page de part et d’autre du pli',
    sheetSize: 'Feuilles sur lesquelles imprimer',
    /** `size` is the sheet (A4…), `half` the booklet page it makes (A5…, or one of `halves`). */
    sizeOption: '{size} paysage → livret {half}',
    halves: {
      letter: 'demi-Letter',
      legal: 'demi-Legal',
      native: 'moitié de feuille',
    },
    binding: 'Reliure',
    bindings: {
      left: { label: 'À gauche', title: 'Se feuillette de gauche à droite' },
      right: {
        label: 'À droite',
        title: 'Pour les textes de droite à gauche (arabe, hébreu, manga)',
      },
    },
    duplex: 'Impression',
    duplexModes: {
      bothSides: { label: 'Recto verso', title: 'Imprimante avec recto verso automatique' },
      frontOnly: {
        label: 'Rectos seuls',
        title: 'Premier passage, sans recto verso automatique',
      },
      backOnly: {
        label: 'Versos seuls',
        title: 'Second passage : retournez les feuilles et imprimez ceux-ci',
      },
    },
    foldLine: 'Ligne pointillée sur le pli',
    margins: 'Marges',
    gutter: 'Marge au pli (mm)',
    sheets: '1 feuille à plier | {n} feuilles à plier',
    blanks:
      '1 page blanche ajoutée à la fin, pour atteindre un multiple de 4 | {n} pages blanches ajoutées à la fin, pour atteindre un multiple de 4',
    submit: 'Créer le livret',
  },

  protect: {
    intro:
      'Crée une copie du document qui ne s’ouvre qu’avec le mot de passe (chiffrement AES-256). La copie apparaît dans la liste avec un cadenas ; l’original reste tel quel, modifiable.',
    noDocument: 'Ouvrez un document pour le protéger.',
    password: 'Mot de passe',
    repeat: 'Confirmez le mot de passe',
    mismatch: 'Les deux mots de passe ne correspondent pas.',
    show: 'Afficher le mot de passe',
    note: 'Les modifications pas encore appliquées sont incluses. Conservez le mot de passe : si vous le perdez, la copie protégée ne pourra plus être ouverte.',
    submit: 'Créer une copie protégée',
    allowed: 'Qui ouvre le fichier avec le mot de passe peut',
    permissions: {
      print: 'Imprimer',
      printHighQuality: 'Imprimer en haute qualité',
      copy: 'Copier le texte et les images',
      modify: 'Modifier le contenu',
      annotate: 'Ajouter des commentaires et remplir les formulaires',
      fillForms: 'Remplir les formulaires',
      assemble: 'Ajouter, faire pivoter et supprimer des pages',
    },
    denied: {
      print: 'l’impression',
      printHighQuality: 'l’impression en haute qualité',
      copy: 'la copie du texte et des images',
      modify: 'les modifications du contenu',
      annotate: 'les commentaires',
      fillForms: 'le remplissage des formulaires',
      assemble: 'l’ajout, la rotation et la suppression de pages',
    },
    ownerPassword: 'Mot de passe pour lever les restrictions',
    ownerHint: 'Différent de celui d’ouverture : qui le connaît ouvre le fichier sans restrictions.',
    ownerSame: 'Il doit être différent du mot de passe d’ouverture, sinon les restrictions ne servent à rien.',
    restrictionsNote: 'Les restrictions sont une demande aux lecteurs PDF : presque tous la respectent, mais elles n’empêchent pas vraiment d’imprimer ou de copier.',
    current: 'Ce fichier restreint {list}.',
    currentAdvice: 'Les modifications faites ici retirent les restrictions : les cases ci-dessous en partent, pour les remettre dans la copie protégée.',
  },

  properties: {
    intro:
      'Les informations que le PDF transporte avec lui et que les lecteurs affichent dans les propriétés du fichier. Elles sont écrites avec « Appliquer les modifications » ou au téléchargement, et s’annulent comme les autres modifications.',
    noDocument: 'Ouvrez un document pour voir ses propriétés.',
    permissionsAdvice: 'Les modifications faites ici retirent les restrictions ; pour les remettre, créez une copie avec « Protéger ».',
    loading: 'Lecture des propriétés…',
    fields: {
      title: 'Titre',
      author: 'Auteur',
      subject: 'Sujet',
      keywords: 'Mots-clés',
      creator: 'Créé avec',
      producer: 'Produit par',
      creationDate: 'Créé le',
      modDate: 'Modifié le',
    },
    hints: {
      title: 'Les lecteurs PDF l’affichent à la place du nom du fichier',
      creator: 'L’application dans laquelle le document a été créé',
      producer: 'Le programme qui a écrit le PDF',
    },
    keywordsPlaceholder: 'séparés par des virgules',
    modified: '· modifié',
    inFile: 'Dans le fichier : {date}',
    clearAll: 'Effacer toutes les propriétés',
    clearAllHint: 'Efface toutes les propriétés, par exemple avant de partager le fichier',
  },

  images: {
    intro:
      'Les images que le PDF contient déjà : photos, logos, numérisations. Les retirer est une modification comme les autres : elle s’annule, et s’applique avec « Appliquer les modifications » ou au téléchargement. Remplacer une image par une autre s’applique tout de suite, sur chaque page où elle apparaît, et s’annule aussi.',
    noDocument: 'Ouvrez un document pour voir ses images.',
    searching: 'Recherche des images…',
    none: 'Aucune image dans ce document. Les logos et graphismes dessinés en formes vectorielles ne sont pas des images et n’apparaissent pas ici.',
    /** `count` is `count` below, in bold; `size` the bytes, formatted. */
    summary: '{count}, {size} au total',
    count: '1 image | {n} images',
    removing: '· {count} à retirer ({size})',
    list: 'Images du document',
    showOnPage: 'Afficher sur la page {page}',
    toRemove: 'À retirer',
    /** `pages` is e.g. "page 3" or "pages 1, 4". */
    downloadOf: 'Télécharger l’image ({pages})',
    download: 'Télécharger l’image',
    restoreOf: 'Restaurer l’image ({pages})',
    restore: 'Restaurer',
    removeFrom: 'Retirer l’image ({pages})',
    removeEverywhere: 'Retirer de toutes les pages',
    remove: 'Retirer',
    someOnly:
      'Pour retirer une image de certaines pages seulement, ouvrez-la : sur la page, vous choisissez de la retirer à cet endroit ou partout.',
    replace: 'Remplacer',
    replaceOf: 'Remplacer l’image de {pages}',
    replaceEverywhere: 'Remplacer sur toutes les pages',
    cannotReplace:
      'Cette image est écrite dans la page (ou c’est un masque) : elle ne peut pas être remplacée',
    /** Recompressing the images, into a lighter copy. */
    compress: {
      title: 'Alléger le fichier',
      intro:
        'Recompresse les images et les réduit à la résolution nécessaire là où elles sont dessinées. Crée une copie : l’original reste inchangé.',
      level: 'Qualité',
      levels: {
        high: { label: 'Haute qualité', hint: 'Presque identique à l’original (220 dpi)' },
        balanced: { label: 'Équilibrée', hint: 'Bonne à l’écran et à l’impression (150 dpi)' },
        small: { label: 'Petit fichier', hint: 'Pour l’envoyer ou le lire à l’écran (100 dpi)' },
      },
      submit: 'Compresser les images',
    },
  },

  outline: {
    intro:
      'Les signets du document. Cliquez sur une entrée pour aller à sa page ; avec Maj vous sélectionnez toutes les pages jusqu’à elle, avec ⌘/Ctrl vous l’ajoutez à la sélection. Vous pouvez ajouter, renommer, déplacer et supprimer des entrées : les modifications s’appliquent avec les autres. La table des matières reste quand vous supprimez, réordonnez, extrayez, déplacez ou fusionnez des pages.',
    noDocument: 'Ouvrez un document pour voir sa table des matières.',
    loading: 'Lecture de la table des matières…',
    none: 'Ce document n’a pas de table des matières.',
    tree: 'Table des matières du document',
    untitled: 'Sans titre',
    deleted: 'à supprimer',
    page: 'p. {page}',
    open: 'Développer {title}',
    close: 'Réduire {title}',
    nowhere: 'Ne mène à aucune page de ce document',
    add: 'Ajouter une entrée pour la page {page}',
    newTitle: 'Page {page}',
    commands: 'Commandes de l’entrée choisie',
    commandsFor: 'Commandes pour « {title} »',
    rename: 'Renommer (F2 ou double-clic)',
    renameLabel: 'Titre de l’entrée',
    moveUp: 'Monter (Alt+↑)',
    moveDown: 'Descendre (Alt+↓)',
    outdent: 'Diminuer le retrait (Alt+←)',
    indent: 'Mettre en retrait sous l’entrée précédente (Alt+→)',
    remove: 'Supprimer, avec les entrées en dessous (Suppr)',
    keys: 'Choisissez une entrée d’un clic, puis utilisez les commandes ci-dessus ou le clavier.',
    link: 'lien',
  },
} satisfies Messages['tools']
