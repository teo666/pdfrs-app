<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from './AppIcon.vue'
import { historyLabel } from '@/lib/historyLabel'
import { useEditorStore } from '@/stores/editor'

/**
 * The active document's history, newest step on top: where it is now,
 * what an undo would take back, what was undone and can still come back.
 * A click goes straight to that step, however many away.
 */
const { t } = useI18n()
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
    {{ t('history.panel.intro') }}
  </p>

  <p v-if="!doc" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('history.panel.noDocument') }}
  </p>

  <template v-else>
    <p v-if="undone" class="text-xs text-fg-muted">
      {{ t('history.panel.undone', undone) }}
    </p>
    <ol ref="list" class="flex flex-col gap-0.5" :aria-label="t('history.panel.list')">
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
              ? t('history.panel.current')
              : step.index > currentIndex
                ? t('history.panel.redoTo')
                : t('history.panel.goTo')
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
          <span class="min-w-0 flex-1 truncate">{{ historyLabel(step) }}</span>
          <span v-if="step.index > currentIndex" class="text-xs font-normal not-italic">
            {{ t('history.panel.undoneTag') }}
          </span>
        </button>
      </li>
    </ol>

    <p class="flex items-start gap-1.5 text-xs text-fg-muted">
      <AppIcon name="info" :size="14" class="mt-px" />
      {{ t('history.panel.shortcuts', { shortcuts }) }}
    </p>
  </template>
</template>
