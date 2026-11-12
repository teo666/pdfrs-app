<script setup lang="ts">
import AppIcon, { type IconName } from './AppIcon.vue'

const { variant = 'default' } = defineProps<{
  variant?: 'default' | 'primary'
  icon?: IconName
}>()
</script>

<template>
  <button
    class="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-md border px-3 whitespace-nowrap transition disabled:cursor-default disabled:opacity-45"
    :class="
      variant === 'primary'
        ? 'border-accent bg-accent text-accent-fg enabled:hover:brightness-110'
        : 'border-line bg-surface enabled:hover:bg-surface-muted'
    "
  >
    <AppIcon v-if="icon" :name="icon" />
    <slot />
  </button>
</template>
