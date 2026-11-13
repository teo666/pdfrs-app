/** French messages: editing. */
import type { Messages } from '../it'

export default {
  signaturePad: {
    canvas: 'Zone pour dessiner la signature',
    placeholder: 'Signez ici avec la souris ou le doigt',
    ink: 'Encre',
    clear: 'Effacer',
    use: 'Utiliser cette signature',
    cancel: 'Annuler',
  },
  textEditor: {
    text: 'Texte',
    placeholder: 'Écrivez ici (Entrée pour aller à la ligne)',
    unsupported:
      'Certains caractères n’existent pas dans les polices standard du PDF et apparaîtront comme « ? » (les lettres latines, les accents, € et «» conviennent).',
    font: 'Police',
    sansSerif: 'Sans empattement',
    serif: 'Avec empattement',
    monospace: 'Machine à écrire',
    size: 'Taille (pt)',
    sizeLabel: 'Taille en points',
    style: 'Style',
    bold: 'Gras',
    boldShort: 'G',
    italic: 'Italique',
    italicShort: 'I',
    align: 'Alignement',
    left: 'Gauche',
    center: 'Centre',
    right: 'Droite',
  },
  colorPicker: {
    color: 'Couleur',
    black: 'Noir',
    blue: 'Bleu',
    red: 'Rouge',
    green: 'Vert',
    custom: 'Choisir une autre couleur',
  },
  lockedDocument: {
    section: '{name}, protégé par mot de passe',
    explanation:
      'Ce document est protégé par mot de passe. Pour l’afficher ou le modifier, déverrouillez-le : une copie sans mot de passe est créée à côté.',
    password: 'Mot de passe',
    passwordLabel: 'Mot de passe du document',
    wrong: 'Mot de passe incorrect : réessayez.',
    unlock: 'Déverrouiller',
    downloadTitle: 'Télécharger le PDF protégé, tel quel',
    download: 'Télécharger (protégé)',
  },
  emptyState: {
    drop: 'Glissez vos PDF ou JPEG ici',
    click: 'ou cliquez pour les choisir',
    local: 'Les fichiers restent sur votre ordinateur : ils sont traités dans le navigateur.',
  },
  themeSwitcher: {
    group: 'Thème',
    auto: 'Thème automatique (comme le système)',
    light: 'Thème clair',
    dark: 'Thème sombre',
  },
  locale: {
    label: 'Langue',
  },
} satisfies Messages['editing']
