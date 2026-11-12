<script setup lang="ts">
import { computed } from 'vue'

/**
 * A few ready colours plus any colour at all: the last swatch opens the
 * system colour picker, and shows the chosen colour once it's not one of the
 * ready ones. Used for text and signature ink.
 */
const { tone = 'light', label = 'Colore' } = defineProps<{
  tone?: 'light' | 'dark'
  label?: string
}>()
const color = defineModel<string>({ required: true })

const presets = [
  { value: '#1c2026', name: 'Nero' },
  { value: '#1a3fb0', name: 'Blu' },
  { value: '#c4261d', name: 'Rosso' },
  { value: '#1f7a45', name: 'Verde' },
]

const custom = computed(() => !presets.some((p) => p.value === color.value.toLowerCase()))
const ring = computed(() => (tone === 'dark' ? 'border-white' : 'border-accent'))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span
      class="text-xs font-semibold"
      :class="tone === 'dark' ? 'text-white/60' : 'text-fg-muted'"
    >
      {{ label }}
    </span>
    <div class="flex items-center gap-1.5" role="radiogroup" :aria-label="label">
      <button
        v-for="preset in presets"
        :key="preset.value"
        class="size-7 cursor-pointer rounded-full border-2 transition-transform hover:scale-110"
        :class="color.toLowerCase() === preset.value ? ring : 'border-transparent'"
        :style="{ backgroundColor: preset.value }"
        role="radio"
        :aria-checked="color.toLowerCase() === preset.value"
        :aria-label="preset.name"
        :title="preset.name"
        @click="color = preset.value"
      />
      <!--
        Any colour: the native picker, under a swatch that shows a rainbow
        until a colour of one's own is picked, then that colour.
      -->
      <label
        class="relative size-7 cursor-pointer rounded-full border-2 transition-transform hover:scale-110"
        :class="custom ? ring : 'border-transparent'"
        :style="{
          background: custom
            ? color
            : 'conic-gradient(#e11d48, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #e11d48)',
        }"
        title="Scegli un altro colore"
      >
        <input
          type="color"
          :value="color"
          class="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label="Scegli un altro colore"
          @input="color = ($event.target as HTMLInputElement).value"
        />
      </label>
      <span
        class="ml-1 font-mono text-xs uppercase"
        :class="tone === 'dark' ? 'text-white/60' : 'text-fg-muted'"
      >
        {{ color }}
      </span>
    </div>
  </div>
</template>
