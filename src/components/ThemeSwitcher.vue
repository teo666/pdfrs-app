<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AppIcon, { type IconName } from './AppIcon.vue'
import { useTheme, type ThemeChoice } from '@/composables/useTheme'

/** Light, dark, or following the system: three buttons, the current one pressed. */
const { choice } = useTheme()
const { t } = useI18n()

/** `label` is a message key. */
const options: { value: ThemeChoice; icon: IconName; label: string }[] = [
  { value: 'auto', icon: 'monitor', label: 'editing.themeSwitcher.auto' },
  { value: 'light', icon: 'sun', label: 'editing.themeSwitcher.light' },
  { value: 'dark', icon: 'moon', label: 'editing.themeSwitcher.dark' },
]
</script>

<template>
  <div
    class="flex rounded-md border border-line p-0.5"
    role="radiogroup"
    :aria-label="t('editing.themeSwitcher.group')"
  >
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
      :aria-label="t(option.label)"
      :title="t(option.label)"
      @click="choice = option.value"
    >
      <AppIcon :name="option.icon" :size="15" />
    </button>
  </div>
</template>
