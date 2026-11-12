<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isWinAnsi, type TextContent } from 'pdfrs-editor'

import SegmentedControl from './SegmentedControl.vue'

/** The text and its look, as a form. Shared by the Testo tool and the viewer. */
const content = defineModel<TextContent>({ required: true })
/** Font size in points, when the form sets it (placing new text). */
const size = defineModel<number>('size')

const colors = [
  { value: '#1c2026', label: 'Nero' },
  { value: '#1a3fb0', label: 'Blu' },
  { value: '#c4261d', label: 'Rosso' },
  { value: '#1f7a45', label: 'Verde' },
]

// A local copy that's always current: two changes in a row (before the
// parent has passed the first one back down) must build on each other.
const local = ref<TextContent>({ ...content.value })
watch(content, (value) => (local.value = { ...value }))

const unsupported = computed(() => !isWinAnsi(local.value.text))

function set<K extends keyof TextContent>(key: K, value: TextContent[K]) {
  local.value = { ...local.value, [key]: value }
  content.value = local.value
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">Testo</span>
      <textarea
        :value="local.text"
        rows="3"
        class="resize-y rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] text-fg"
        placeholder="Scrivi qui (Invio per andare a capo)"
        aria-label="Testo"
        @input="set('text', ($event.target as HTMLTextAreaElement).value)"
      />
      <span v-if="unsupported" class="text-xs text-warning" role="status">
        Alcuni caratteri non esistono nei font standard del PDF e appariranno come «?» (vanno bene
        le lettere latine, gli accenti, € e «»).
      </span>
    </label>

    <SegmentedControl
      :model-value="local.font"
      label="Carattere"
      :options="[
        { value: 'helvetica', label: 'Helvetica', title: 'Senza grazie' },
        { value: 'times', label: 'Times', title: 'Con grazie' },
        { value: 'courier', label: 'Courier', title: 'Da macchina da scrivere' },
      ]"
      @update:model-value="set('font', $event)"
    />

    <div class="flex flex-wrap items-end gap-3">
      <label v-if="size !== undefined" class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-fg-muted">Dimensione (pt)</span>
        <input
          v-model.number="size"
          type="number"
          min="4"
          max="200"
          class="w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] text-fg"
          aria-label="Dimensione in punti"
        />
      </label>
      <div class="flex gap-1" role="group" aria-label="Stile">
        <button
          class="grid size-8 cursor-pointer place-items-center rounded-md border font-bold"
          :class="local.bold ? 'border-accent bg-accent-soft text-accent' : 'border-line text-fg'"
          :aria-pressed="local.bold"
          aria-label="Grassetto"
          @click="set('bold', !local.bold)"
        >
          G
        </button>
        <button
          class="grid size-8 cursor-pointer place-items-center rounded-md border font-serif italic"
          :class="local.italic ? 'border-accent bg-accent-soft text-accent' : 'border-line text-fg'"
          :aria-pressed="local.italic"
          aria-label="Corsivo"
          @click="set('italic', !local.italic)"
        >
          C
        </button>
      </div>
      <div class="flex items-center gap-1.5" role="radiogroup" aria-label="Colore">
        <button
          v-for="color in colors"
          :key="color.value"
          class="size-6 cursor-pointer rounded-full border-2"
          :class="local.color === color.value ? 'border-accent' : 'border-transparent'"
          :style="{ backgroundColor: color.value }"
          role="radio"
          :aria-checked="local.color === color.value"
          :aria-label="color.label"
          @click="set('color', color.value)"
        />
        <input
          type="color"
          :value="local.color"
          class="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label="Altro colore"
          @input="set('color', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <SegmentedControl
      :model-value="local.align"
      label="Allineamento"
      :options="[
        { value: 'left', label: 'Sinistra' },
        { value: 'center', label: 'Centro' },
        { value: 'right', label: 'Destra' },
      ]"
      @update:model-value="set('align', $event)"
    />
  </div>
</template>
