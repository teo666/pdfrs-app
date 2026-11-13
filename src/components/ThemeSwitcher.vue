<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'
import { useTheme, type ThemeChoice } from '@/composables/useTheme'

/** Light, dark, or following the system: three buttons, the current one pressed. */
const { choice } = useTheme()

const options: { value: ThemeChoice; icon: IconName; label: string }[] = [
  { value: 'auto', icon: 'monitor', label: 'Tema automatico (come il sistema)' },
  { value: 'light', icon: 'sun', label: 'Tema chiaro' },
  { value: 'dark', icon: 'moon', label: 'Tema scuro' },
]
</script>

<template>
  <div class="flex rounded-md border border-line p-0.5" role="radiogroup" aria-label="Tema">
    <button
      v-for="option in options"
      :key="option.value"
      class="grid size-7 cursor-pointer place-items-center rounded transition-colors"
      :class="
        choice === option.value
          ? 'bg-accent-soft text-accent'
          : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
      "
      role="radio"
      :aria-checked="choice === option.value"
      :aria-label="option.label"
      :title="option.label"
      @click="choice = option.value"
    >
      <AppIcon :name="option.icon" :size="15" />
    </button>
  </div>
</template>
