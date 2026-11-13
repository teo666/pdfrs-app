<script setup lang="ts" generic="T extends string | number">
/** A row of mutually exclusive buttons - a compact radio group. */
defineProps<{
  label: string
  options: { value: T; label: string; title?: string }[]
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs font-semibold text-fg-muted">{{ label }}</span>
    <div class="flex rounded-md bg-surface-muted p-0.5" role="radiogroup" :aria-label="label">
      <button
        v-for="option in options"
        :key="option.value"
        class="flex-1 cursor-pointer rounded px-2 py-1.5 text-[13px] transition-colors"
        :class="
          model === option.value
            ? 'bg-surface font-semibold shadow-card'
            : 'text-fg-muted hover:text-fg'
        "
        role="radio"
        :aria-checked="model === option.value"
        :title="option.title"
        @click="model = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
