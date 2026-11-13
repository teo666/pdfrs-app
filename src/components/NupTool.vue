<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PageSize } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import SegmentedControl from './SegmentedControl.vue'
import ToolScope from './ToolScope.vue'
import { mmToPt, nupGrid, nupOrder, type NupCount, type SheetOrientation } from '@/lib/imposition'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { t } = useI18n()

const count = ref<NupCount>(2)
const pageSize = ref<PageSize>('a4')
const orientation = ref<SheetOrientation>('auto')
const direction = ref<'horizontal' | 'vertical'>('horizontal')
const borders = ref(false)
const marginMm = ref(5)
const spacingMm = ref(3.5)
const autoRotate = ref(true)

const grid = computed(() => nupGrid(count.value, orientation.value))
const cells = computed(() => nupOrder(grid.value.cols, grid.value.rows, direction.value))

const scope = ref<InstanceType<typeof ToolScope> | null>(null)
const sheets = computed(() => {
  const pages = scope.value?.scope?.count ?? 0
  return Math.ceil(pages / count.value)
})

function make() {
  void store.impose({
    kind: 'nup',
    options: {
      layout: count.value,
      pageSize: pageSize.value,
      orientation: orientation.value,
      direction: direction.value,
      drawBorders: borders.value,
      margin: mmToPt(marginMm.value),
      spacing: mmToPt(spacingMm.value),
      autoRotate: autoRotate.value,
    },
  })
}

const counts: NupCount[] = [2, 4, 6, 8, 9, 16]
// Paper names stay as they are; only "as the original" is words.
const sizes = computed<{ value: PageSize; label: string }[]>(() => [
  { value: 'a4', label: 'A4' },
  { value: 'a3', label: 'A3' },
  { value: 'a5', label: 'A5' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
  { value: 'native', label: t('tools.nup.native') },
])
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.nup.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.nup.noDocument') }}
  </p>

  <template v-else>
    <ToolScope ref="scope" />

    <div class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">{{ t('tools.nup.perSheet') }}</span>
      <div class="grid grid-cols-3 gap-1.5" role="radiogroup" :aria-label="t('tools.nup.perSheet')">
        <button
          v-for="n in counts"
          :key="n"
          class="cursor-pointer rounded-md border px-2 py-1.5 text-sm transition-colors"
          :class="
            count === n
              ? 'border-accent bg-accent-soft font-semibold text-accent'
              : 'border-line hover:bg-surface-muted'
          "
          role="radio"
          :aria-checked="count === n"
          @click="count = n"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <!-- The sheet as it will come out: its shape and where each page goes. -->
    <figure class="flex flex-col items-center gap-2" :aria-label="t('tools.nup.schema')">
      <div
        class="grid gap-1 rounded-sm bg-white p-1.5 shadow-card ring-1 ring-line"
        :class="grid.landscape ? 'h-28 w-40' : 'h-40 w-28'"
        :style="{
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        }"
        data-sheet
      >
        <span
          v-for="cell in cells"
          :key="cell"
          class="grid place-items-center rounded-[2px] bg-surface-muted text-[10px] font-semibold text-fg-muted"
          :class="{ 'ring-1 ring-fg-muted': borders }"
        >
          {{ cell }}
        </span>
      </div>
      <figcaption class="text-xs text-fg-muted">
        {{
          t(grid.landscape ? 'tools.nup.gridLandscape' : 'tools.nup.gridPortrait', {
            cols: grid.cols,
            rows: grid.rows,
          })
        }}
      </figcaption>
    </figure>

    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">{{ t('tools.nup.sheetSize') }}</span>
      <select
        v-model="pageSize"
        class="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
      >
        <option v-for="size in sizes" :key="size.value" :value="size.value">
          {{ size.label }}
        </option>
      </select>
    </label>

    <SegmentedControl
      v-model="orientation"
      :label="t('tools.nup.orientation')"
      :options="[
        {
          value: 'auto',
          label: t('tools.nup.orientations.auto.label'),
          title: t('tools.nup.orientations.auto.title'),
        },
        { value: 'portrait', label: t('tools.nup.orientations.portrait') },
        { value: 'landscape', label: t('tools.nup.orientations.landscape') },
      ]"
    />

    <SegmentedControl
      v-model="direction"
      :label="t('tools.nup.order')"
      :options="[
        { value: 'horizontal', label: t('tools.nup.byRows'), title: '1 2 / 3 4' },
        { value: 'vertical', label: t('tools.nup.byColumns'), title: '1 3 / 2 4' },
      ]"
    />

    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="borders" type="checkbox" class="size-4 accent-accent" />
      {{ t('tools.common.borders') }}
    </label>

    <details class="text-[13px]">
      <summary class="cursor-pointer text-fg-muted">{{ t('tools.nup.moreOptions') }}</summary>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <label class="flex flex-col gap-1">
          <span class="text-xs text-fg-muted">{{ t('tools.common.margin') }}</span>
          <input
            v-model.number="marginMm"
            type="number"
            min="0"
            step="0.5"
            class="rounded-md border border-line bg-surface px-2 py-1"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs text-fg-muted">{{ t('tools.nup.spacing') }}</span>
          <input
            v-model.number="spacingMm"
            type="number"
            min="0"
            step="0.5"
            class="rounded-md border border-line bg-surface px-2 py-1"
          />
        </label>
        <label class="col-span-2 flex cursor-pointer items-center gap-2">
          <input v-model="autoRotate" type="checkbox" class="size-4 accent-accent" />
          {{ t('tools.nup.autoRotate') }}
        </label>
      </div>
    </details>

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="store.active.busy || sheets === 0"
      @click="make"
    >
      {{ t('tools.nup.submit', sheets) }}
    </AppButton>
  </template>
</template>
