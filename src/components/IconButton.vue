<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'

const { variant = 'default', size = 'md' } = defineProps<{
  icon: IconName
  /** Accessible name, also shown as a tooltip. */
  label: string
  variant?: 'default' | 'danger'
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <button
    class="inline-grid shrink-0 cursor-pointer place-items-center rounded-md transition disabled:cursor-default disabled:opacity-40"
    :class="[
      size === 'sm' ? 'size-[26px]' : 'size-[30px]',
      variant === 'danger'
        ? 'enabled:hover:bg-danger-soft enabled:hover:text-danger'
        : 'enabled:hover:bg-surface-muted',
    ]"
    :title="label"
    :aria-label="label"
  >
    <AppIcon :name="icon" />
  </button>
</template>
