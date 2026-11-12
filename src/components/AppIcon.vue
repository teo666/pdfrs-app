<script setup lang="ts">
// Small inline stroke icons, so the app doesn't pull in an icon library for a dozen glyphs.
const paths = {
  'rotate-left': ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
  'rotate-right': ['M21 12a9 9 0 1 1-3-6.7L21 8', 'M21 3v5h-5'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'],
  restore: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  redo: ['m15 14 5-5-5-5', 'M20 9H9.5a5.5 5.5 0 0 0 0 11H13'],
  check: ['M20 6 9 17l-5-5'],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  plus: ['M12 5v14', 'M5 12h14'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  file: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6'],
  'file-plus': [
    'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z',
    'M14 3v6h6',
    'M12 12v6',
    'M9 15h6',
  ],
  pen: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  upload: ['M12 15V3', 'm7 8 5-5 5 5', 'M5 21h14'],
  'zoom-in': ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.3-4.3', 'M11 8v6', 'M8 11h6'],
  merge: ['M8 6h10', 'M8 12h10', 'M8 18h10', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  'merge-arrows': ['m8 6 4-4 4 4', 'M12 2v10.3a4 4 0 0 1-1.2 2.8L4 22', 'm20 22-5-5'],
  grip: ['M9 6h.01', 'M15 6h.01', 'M9 12h.01', 'M15 12h.01', 'M9 18h.01', 'M15 18h.01'],
  'arrow-up': ['m5 12 7-7 7 7', 'M12 19V5'],
  'arrow-down': ['M12 5v14', 'm19 12-7 7-7-7'],
  'layout-grid': ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  book: ['M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z', 'M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  alert: [
    'M12 9v4',
    'M12 17h.01',
    'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  ],
} as const

export type IconName = keyof typeof paths

const { size = 18 } = defineProps<{ name: IconName; size?: number }>()
</script>

<template>
  <svg
    class="shrink-0"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="d in paths[name]" :key="d" :d="d" />
  </svg>
</template>
