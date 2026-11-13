/** French messages: store. */
import type { Messages } from '../it'

export default {
  /** What went wrong, as the error bar shows it. */
  errors: {
    notPdfOrJpeg: '{name} : ce n’est ni un PDF ni une image JPEG',
    insertProtected:
      '{name} est protégé par mot de passe : ouvrez-le et déverrouillez-le, puis insérez la copie déverrouillée',
    noDocument: 'aucun document',
    noActiveDocument: 'aucun document actif',
    emptyDocument: 'le document serait vide : annulez au moins une suppression avant de confirmer',
    wrongPassword: 'mot de passe incorrect',
    jpegColorSpace:
      'espace colorimétrique JPEG non pris en charge : {space} (pris en charge : RVB, niveaux de gris)',
    invalidJpeg: 'JPEG non valide : {detail}',
    imageDecode: 'impossible de décoder l’image',
    imageDraw: 'impossible de dessiner l’image',
  },
  /** What just happened, as the notice at the bottom says it. */
  notices: {
    merged: '{n} documents fusionnés : les originaux restent ouverts',
    inserted: '1 page insérée | {n} pages insérées',
    moved: '1 page déplacée dans « {target} » | {n} pages déplacées dans « {target} »',
    copied: '1 page copiée dans « {target} » | {n} pages copiées dans « {target} »',
    created: '« {name} » créé : l’original reste inchangé',
    split: '1 document créé | {n} documents créés : l’original reste inchangé',
    extracted: '1 page dans « {name} » | {n} pages dans « {name} »',
    protected: '« {name} » créé, protégé par mot de passe : l’original reste inchangé',
    unlocked: '« {name} » créé, sans mot de passe',
  },
  /** The buttons on the notices. */
  actions: {
    open: 'Ouvrir',
    backToOriginal: 'Revenir à l’original',
    backToProtected: 'Revenir au document protégé',
  },
  /** Names given to the documents and files the app makes. */
  names: {
    merged: 'Fusion de {n} documents.pdf',
    nup: '{base} ({n} par feuille).pdf',
    booklet: '{base} (livret).pdf',
    part: '{base} (partie {index} sur {total}).pdf',
    extracted: '{base} (extrait).pdf',
    protected: '{base} (protégé).pdf',
    unlocked: '{base} (déverrouillé).pdf',
    image: '{base} - image {n}.{extension}',
    signature: 'Signature {n}',
  },
  /** Adding signatures and images to the library. */
  library: {
    whiteBackground: 'Le fond blanc de l’image a été rendu transparent.',
    unreadable: 'Image illisible : {reason}',
  },
} satisfies Messages['store']
