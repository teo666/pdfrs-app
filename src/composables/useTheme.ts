import { computed, ref, watch } from 'vue'

/** The theme chosen in the header: follow the system, or always light or dark. */
export type ThemeChoice = 'auto' | 'light' | 'dark'
const THEMES: ThemeChoice[] = ['auto', 'light', 'dark']
const THEME_KEY = 'pdfrs.theme'

function savedTheme(): ThemeChoice {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeChoice | null
    if (saved && THEMES.includes(saved)) return saved
  } catch {
    /* no storage: automatic */
  }
  return 'auto'
}

const systemQuery =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

// One state for the whole app: the header's switcher and anything reading it.
const choice = ref<ThemeChoice>(savedTheme())
const systemDark = ref(systemQuery?.matches ?? false)
systemQuery?.addEventListener('change', (event) => (systemDark.value = event.matches))

/** The theme in use: the choice, or the system's when automatic. */
const effective = computed<'light' | 'dark'>(() =>
  choice.value === 'auto' ? (systemDark.value ? 'dark' : 'light') : choice.value,
)

watch(
  effective,
  (theme) => {
    if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme
  },
  { immediate: true },
)
watch(choice, (value) => {
  try {
    localStorage.setItem(THEME_KEY, value)
  } catch {
    /* not kept: fine */
  }
})

/** Light or dark, chosen or following the system; remembered. See public/theme-boot.js. */
export function useTheme() {
  return { choice, effective, themes: THEMES }
}
