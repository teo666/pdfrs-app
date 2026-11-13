<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'

import AppIcon from './AppIcon.vue'
import { useEditorStore } from '@/stores/editor'

/**
 * The active document's history, newest step on top: where it is now,
 * what an undo would take back, what was undone and can still come back.
 * A click goes straight to that step, however many away.
 */
const store = useEditorStore()
const doc = computed(() => store.active)

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const shortcuts = isMac ? '⌘Z / ⇧⌘Z' : 'Ctrl+Z / Ctrl+Y'

const steps = computed(() => [...(doc.value?.history ?? [])].reverse())
const currentIndex = computed(() => doc.value?.history.find((step) => step.current)?.index ?? 0)
const undone = computed(() => steps.value.filter((step) => step.index > currentIndex.value).length)

// The current step stays in view as the history grows or is walked.
const list = useTemplateRef<HTMLElement>('list')
watch(currentIndex, async () => {
  await nextTick()
  list.value?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest' })
})
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    Ogni modifica fatta al documento, dalla più recente. Fai clic su un passo per tornare a quel
    punto; i passi annullati restano qui finché non fai una nuova modifica.
  </p>

  <p v-if="!doc" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    Apri un documento per vederne la cronologia.
  </p>

  <template v-else>
    <p v-if="undone" class="text-xs text-fg-muted">
      {{ undone === 1 ? '1 passo annullato' : `${undone} passi annullati` }}: si possono ancora
      ripetere.
    </p>
    <ol ref="list" class="flex flex-col gap-0.5" aria-label="Cronologia delle modifiche">
      <li v-for="step in steps" :key="step.index">
        <button
          class="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors disabled:cursor-default"
          :class="
            step.current
              ? 'bg-accent-soft font-semibold text-accent'
              : step.index > currentIndex
                ? 'text-fg-muted italic hover:bg-surface-muted'
                : 'hover:bg-surface-muted'
          "
          :aria-current="step.current ? 'step' : undefined"
          :disabled="step.current || doc.busy"
          :title="
            step.current
              ? 'Il documento è a questo punto'
              : step.index > currentIndex
                ? 'Ripeti fino a qui'
                : 'Torna a questo punto'
          "
          @click="store.goToHistory(step.index)"
        >
          <span
            class="size-2 shrink-0 rounded-full"
            :class="
              step.current
                ? 'bg-accent'
                : step.index > currentIndex
                  ? 'border border-fg-muted'
                  : 'bg-fg-muted/50'
            "
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate">{{ step.label }}</span>
          <span v-if="step.index > currentIndex" class="text-xs font-normal not-italic">
            annullato
          </span>
        </button>
      </li>
    </ol>

    <p class="flex items-start gap-1.5 text-xs text-fg-muted">
      <AppIcon name="info" :size="14" class="mt-px" />
      Annulla e ripeti anche con {{ shortcuts }}. Si tengono gli ultimi 50 passi.
    </p>
  </template>
</template>
