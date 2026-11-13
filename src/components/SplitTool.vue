<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'
import SegmentedControl from './SegmentedControl.vue'
import { leftOut, parseRanges, partColor, splitAtStarts, splitEvery, type Part } from '@/lib/split'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { t } = useI18n()

type Mode = 'every' | 'ranges' | 'selection'
const mode = ref<Mode>('every')
const size = ref(1)
const rangesText = ref('')

/** Pages in the grid, as they're numbered on the cards. */
const total = computed(() => store.active?.pages.length ?? 0)

/** Where each selected page sits in the grid: each one starts a new part. */
const selectedPositions = computed(() => {
  const doc = store.active
  if (!doc) return []
  return doc.pages.flatMap((p, index) => (doc.selection.has(p.id) ? [index + 1] : []))
})

const parsed = computed(() => parseRanges(rangesText.value, total.value))

const parts = computed<Part[]>(() => {
  if (mode.value === 'every') return splitEvery(size.value, total.value)
  if (mode.value === 'ranges') return parsed.value.parts
  return selectedPositions.value.length ? splitAtStarts(selectedPositions.value, total.value) : []
})

const error = computed(() => (mode.value === 'ranges' ? parsed.value.error : null))

/** Pages each part will really have: the ones marked for deletion don't count. */
function kept({ start, end }: Part) {
  return store.active?.pages.slice(start - 1, end).filter((p) => !p.markedForDeletion).length ?? 0
}
const usable = computed(() => parts.value.filter((part) => kept(part) > 0))
const missing = computed(() => (mode.value === 'ranges' ? leftOut(parts.value, total.value) : []))
const hasDeletions = computed(() => store.active?.pages.some((p) => p.markedForDeletion) ?? false)

// The cards show the cut as it's being set up: each page takes its part's
// colour. Gone as soon as the tool closes.
// Until there's a valid part (a typo, nothing selected yet) the cards stay as
// they are, rather than all showing as left out.
watch(usable, (value) => store.previewSplit(value.length ? value : null), { immediate: true })
onUnmounted(() => store.previewSplit(null))

/** At most this many parts are listed; the rest is summed up. */
const LISTED = 8

const describe = ({ start, end }: Part) =>
  start === end ? t('tools.split.onePage', { start }) : t('tools.split.pageRange', { start, end })
const pages = (count: number) => t('tools.common.pages', count)
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.split.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.split.noDocument') }}
  </p>

  <template v-else>
    <SegmentedControl
      v-model="mode"
      :label="t('tools.split.mode')"
      :options="[
        {
          value: 'every',
          label: t('tools.split.modes.every.label'),
          title: t('tools.split.modes.every.title'),
        },
        {
          value: 'ranges',
          label: t('tools.split.modes.ranges.label'),
          title: t('tools.split.modes.ranges.title'),
        },
        {
          value: 'selection',
          label: t('tools.split.modes.selection.label'),
          title: t('tools.split.modes.selection.title'),
        },
      ]"
    />

    <label v-if="mode === 'every'" class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">{{ t('tools.split.size') }}</span>
      <input
        v-model.number="size"
        type="number"
        min="1"
        :max="total"
        class="w-24 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
        :aria-label="t('tools.split.size')"
      />
      <span class="text-xs text-fg-muted">{{ t('tools.split.sizeHint') }}</span>
    </label>

    <label v-else-if="mode === 'ranges'" class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">{{ t('tools.split.ranges') }}</span>
      <input
        v-model="rangesText"
        type="text"
        :placeholder="t('tools.split.rangesPlaceholder', { total })"
        class="rounded-md border bg-surface px-2 py-1.5 text-[13px]"
        :class="error ? 'border-danger' : 'border-line'"
        :aria-label="t('tools.split.rangesLabel')"
        spellcheck="false"
      />
      <span v-if="error" class="text-xs text-danger" role="alert">{{ error }}</span>
      <span v-else class="text-xs text-fg-muted">
        {{ t('tools.split.rangesHint') }}
      </span>
    </label>

    <p v-else class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
      {{ t('tools.split.selectionHint') }}
      <template v-if="selectedPositions.length">
        {{ t('tools.split.selected', { pages: selectedPositions.join(', ') }) }}
      </template>
    </p>

    <section
      v-if="usable.length"
      class="flex flex-col gap-1.5"
      :aria-label="t('tools.split.parts')"
    >
      <h3 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">
        {{ t('tools.split.partsCount', usable.length) }}
      </h3>
      <ol class="flex flex-col gap-1 text-[13px]">
        <li
          v-for="(part, index) in usable.slice(0, LISTED)"
          :key="index"
          class="flex justify-between gap-2 rounded-md bg-surface-muted px-2.5 py-1.5"
        >
          <span class="flex items-center gap-2">
            <span
              class="size-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: partColor(index + 1) }"
              aria-hidden="true"
            />
            {{ t('tools.split.part', { number: index + 1, range: describe(part) }) }}
          </span>
          <span class="text-fg-muted">{{ pages(kept(part)) }}</span>
        </li>
        <li v-if="usable.length > LISTED" class="px-2.5 text-xs text-fg-muted">
          {{ t('tools.split.more', { count: usable.length - LISTED }) }}
        </li>
      </ol>
    </section>

    <p v-if="missing.length" class="text-xs text-fg-muted">
      {{ t('tools.split.missing', { pages: missing.join(', ') }, missing.length) }}
    </p>
    <p v-if="hasDeletions" class="text-xs text-fg-muted">
      {{ t('tools.split.deletions') }}
    </p>

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="store.active.busy || usable.length === 0 || !!error"
      @click="store.split(usable)"
    >
      {{ usable.length > 0 ? t('tools.split.submit', usable.length) : t('tools.split.submitNone') }}
    </AppButton>
  </template>
</template>
