/** French messages: history. */
import type { Messages } from '../it'

export default {
  // The steps, one per `HistoryAction` type (see lib/historyLabel.ts).
  open: 'Document ouvert',
  movePage: 'Déplacer la page {page} en position {position}',
  rotatePage: 'Faire pivoter la page {page} de {degrees}°',
  resetRotation: 'Réinitialiser la rotation de la page {page}',
  resetRotations: 'Annuler la rotation d’une page | Annuler la rotation de {count} pages',
  deletePage: 'Supprimer la page {page}',
  restorePage: 'Restaurer la page {page}',
  rotatePages: 'Faire pivoter {count} pages de {degrees}°',
  deletePages: 'Supprimer {count} pages',
  restorePages: 'Restaurer {count} pages',
  movePages: 'Déplacer {count} pages en position {position}',
  insertPages: 'Insérer 1 page | Insérer {count} pages',
  insertFromDocument:
    'Insérer 1 page d’un autre document | Insérer {count} pages d’un autre document',
  insertPhoto: 'Insérer une photo',
  watermark: 'Filigrane sur la page {page} | Filigrane sur {count} pages',
  blankPage: 'Insérer une page blanche en position {position}',
  moveImage: 'Déplacer l’image (page {page})',
  resizeImage: 'Redimensionner l’image (page {page})',
  outlineAdd: 'Ajouter « {title} » à la table des matières',
  outlineRename: 'Renommer « {from} » en « {title} »',
  outlineRemove: 'Supprimer « {title} » de la table des matières | Supprimer « {title} » de la table des matières ({count} entrées)',
  outlineMoveUp: 'Monter « {title} » dans la table des matières',
  outlineMoveDown: 'Descendre « {title} » dans la table des matières',
  outlineIndent: 'Mettre « {title} » en retrait',
  outlineOutdent: 'Diminuer le retrait de « {title} »',
  photoPage: {
    a4: 'Photo sur A4 (page {page})',
    letter: 'Photo sur Letter (page {page})',
    native: 'Photo en taille réelle (page {page})',
  },
  addAnnotation: 'Ajouter {what} à la page {page}',
  relinkAnnotation: '{What} de nouveau identique aux autres copies (page {page})',
  annotationOnAllPages: '{What} sur toutes les pages ({count})',
  detachAnnotation: '{What} modifiable uniquement sur la page {page}',
  editAnnotation: 'Modifier {what} de la page {page} | Modifier {what} sur {pages} pages',
  rotateAnnotation:
    'Faire pivoter {what} de la page {page} | Faire pivoter {what} sur {pages} pages',
  resizeAnnotation:
    'Redimensionner {what} de la page {page} | Redimensionner {what} sur {pages} pages',
  moveAnnotation: 'Déplacer {what} de la page {page} | Déplacer {what} sur {pages} pages',
  removeAnnotation: 'Retirer {what} de la page {page} | Retirer {what} de {pages} pages',
  removeImages: {
    onePage: 'Retirer l’image (page {page}) | Retirer {count} images (page {page})',
    manyPages: 'Retirer l’image de {pages} pages | Retirer {count} images de {pages} pages',
    noPage: 'Retirer l’image | Retirer {count} images',
  },
  restoreImages: {
    onePage: 'Restaurer l’image (page {page}) | Restaurer {count} images (page {page})',
    manyPages: 'Restaurer l’image sur {pages} pages | Restaurer {count} images sur {pages} pages',
    noPage: 'Restaurer l’image | Restaurer {count} images',
  },
  replaceImage: {
    onePage: 'Remplacer l’image (page {page})',
    manyPages: 'Remplacer l’image sur {pages} pages',
    noPage: 'Remplacer l’image',
  },
  metadata: 'Modifier les métadonnées ({fields})',
  commit: 'Appliquer les modifications ({pages} pages)',
  encrypt: 'Chiffrer le document',
  decrypt: 'Déchiffrer le document',

  /** What an annotation is, inside a step (with its article: the steps don't add one). */
  kinds: {
    text: 'le texte',
    signature: 'la signature',
    image: 'l’image',
  },
  /** The document properties, inside "Modifier les métadonnées (…)". */
  fields: {
    title: 'titre',
    author: 'auteur',
    subject: 'sujet',
    keywords: 'mots-clés',
    creator: 'créateur',
    producer: 'producteur',
    creationDate: 'date de création',
    modDate: 'date de modification',
  },

  /** The Historique tool. */
  panel: {
    intro:
      'Toutes les modifications apportées au document, de la plus récente à la plus ancienne. Cliquez sur une étape pour revenir à ce point ; les étapes annulées restent ici jusqu’à votre prochaine modification.',
    noDocument: 'Ouvrez un document pour voir son historique.',
    undone:
      '1 étape annulée : elle peut encore être rétablie. | {n} étapes annulées : elles peuvent encore être rétablies.',
    list: 'Historique des modifications',
    current: 'Le document en est à cette étape',
    redoTo: 'Rétablir jusqu’ici',
    goTo: 'Revenir à cette étape',
    undoneTag: 'annulée',
    shortcuts:
      'Annulez et rétablissez aussi avec {shortcuts}. Les 50 dernières étapes sont conservées.',
  },
} satisfies Messages['history']
