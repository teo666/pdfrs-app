<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AppIcon from './AppIcon.vue'
import { LOCALES, setLocale, type Locale } from '@/i18n'

/** The app's language: each listed by its own name; remembered. */
const { t, locale } = useI18n()
</script>

<template>
  <label class="flex items-center gap-1.5 text-xs text-fg-muted" :title="t('editing.locale.label')">
    <AppIcon name="globe" :size="14" />
    <select
      :value="locale"
      class="cursor-pointer rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-fg"
      :aria-label="t('editing.locale.label')"
      @change="setLocale(($event.target as HTMLSelectElement).value as Locale)"
    >
      <option v-for="option in LOCALES" :key="option.code" :value="option.code" :lang="option.code">
        {{ option.name }}
      </option>
    </select>
  </label>
</template>
