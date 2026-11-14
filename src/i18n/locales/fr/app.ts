/** French messages: app. */
import type { Messages } from '../it'

export default {
  /** The bar at the top, and what floats over the whole window. */
  header: {
    tagline: 'Éditeur PDF dans le navigateur',
    thumbSize: 'Taille des miniatures',
    openFiles: 'Ouvrir des fichiers',
    dropToOpen: 'Déposez pour ouvrir',
    closeNotice: 'Fermer la notification',
    closeError: 'Fermer',
  },
  /** The open documents, on the left. */
  documents: {
    title: 'Documents',
    openFiles: 'Ouvrir des fichiers',
    newName: 'Nouveau nom pour {name}',
    locked: 'Protégé par mot de passe',
    lockedTitle: '{name} (protégé par mot de passe)',
    pending: 'Modifications non appliquées',
    rename: 'Renommer {name}',
    renameHint: 'Renommer (ou double-cliquez sur le nom)',
    close: 'Fermer {name}',
    thumbnails: 'Miniatures de {name}',
    empty: 'Aucun document ouvert.',
    loading: 'Traitement en cours…',
    dropHint:
      'Déposez sur un autre document pour y déplacer les pages (maintenez ⌥/Alt pour les copier)',
  },
  /** The bar above the pages. */
  toolbar: {
    newName: 'Nouveau nom pour {name}',
    rename: 'Renommer {name}',
    renameHint: 'Renommer (ou double-cliquez sur le nom)',
    summary: '1 page | {n} pages',
    summaryDeleted: '1 page · {deleted} à supprimer | {n} pages · {deleted} à supprimer',
    pending: '· modifications non appliquées',
    undo: 'Annuler',
    undoTitle: 'Annuler ({shortcut})',
    redo: 'Rétablir',
    redoTitle: 'Rétablir ({shortcut})',
    insert: 'Insérer des pages',
    blankPage: 'Page blanche',
    blankPageAfterSelection: 'Insérer une page blanche après les pages sélectionnées, de la taille de la précédente',
    blankPageAtEnd: 'Insérer une page blanche à la fin, de la taille de la dernière',
    insertAfterSelection:
      'Ajouter les pages d’un PDF ou d’un JPEG après la dernière page sélectionnée',
    insertAtEnd: 'Ajouter les pages d’un PDF ou d’un JPEG à la fin du document',
    apply: 'Appliquer les modifications',
    applyTitle:
      'Appliquer au document les rotations, les suppressions et le nouvel ordre des pages',
    download: 'Télécharger',
    downloadTitle:
      'Télécharger le PDF avec les modifications, y compris celles qui ne sont pas encore appliquées',
    selectionActions: 'Actions sur les pages sélectionnées',
    selected: '1 page sélectionnée | {n} pages sélectionnées',
    selectAll: 'Tout sélectionner',
    deselect: 'Désélectionner',
    deselectTitle: 'Désélectionner (Échap)',
    rotateLeft: 'Faire pivoter les pages sélectionnées vers la gauche',
    rotateRight: 'Faire pivoter les pages sélectionnées vers la droite',
    resetRotation: 'Retirer la rotation des pages sélectionnées',
    delete: 'Supprimer',
    deleteTitle: 'Marquer pour suppression (Suppr)',
    restore: 'Restaurer',
    extract: 'Extraire dans un nouveau document',
    extractTitle:
      'Copier les pages sélectionnées, telles qu’elles apparaissent, dans un nouveau document',
  },
  /** The grid of pages. */
  grid: {
    /** Follows the pointer while several pages are dragged. */
    dragCount: '{n} pages',
  },
  /** One page's card in the grid. */
  card: {
    page: 'Page {n}',
    pageMoved: 'Page {n} (auparavant {was})',
    /** The same, inside a sentence. */
    pageInline: 'page {n}',
    pageInlineMoved: 'page {n} (auparavant {was})',
    select: 'Sélectionner la {page}',
    open: 'Ouvrir la {page} en taille réelle',
    openTitle: 'Voir la page en détail (Entrée ou double-clic)',
    toDelete: 'À supprimer',
    rotateLeft: 'Faire pivoter vers la gauche',
    rotateRight: 'Faire pivoter vers la droite',
    resetRotation: 'Retirer la rotation de {degrees}°',
    delete: 'Supprimer la page',
    restore: 'Restaurer la page',
    originalPosition: 'Position d’origine',
    was: 'auparavant {n}',
    part: 'Partie {n}',
    excluded: 'exclue',
  },
  /** Sizes and page lists (lib/format.ts). */
  format: {
    bytes: '{n} octets',
    kilobytes: '{n} Ko',
    megabytes: '{n} Mo',
    pages: 'page {ranges} | pages {ranges}',
  },
} satisfies Messages['app']
