<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BindingEdge, DuplexMode, PageSize } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import SegmentedControl from './SegmentedControl.vue'
import ToolScope from './ToolScope.vue'
import { bookletSheets, mmToPt } from '@/lib/imposition'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { t } = useI18n()

const pageSize = ref<PageSize>('a4')
const binding = ref<BindingEdge>('left')
const duplex = ref<DuplexMode>('bothSides')
const foldLine = ref(true)
const borders = ref(false)
const marginMm = ref(5)
const gutterMm = ref(3.5)

const scope = ref<InstanceType<typeof ToolScope> | null>(null)
const plan = computed(() => bookletSheets(scope.value?.scope?.count ?? 0))

/** On a folded sheet the halves are a page each: A4 sheets make an A5 booklet. */
const halves = computed<Record<PageSize, string>>(() => ({
  a3: 'A4',
  a4: 'A5',
  a5: 'A6',
  letter: t('tools.booklet.halves.letter'),
  legal: t('tools.booklet.halves.legal'),
  native: t('tools.booklet.halves.native'),
}))

function make() {
  void store.impose({
    kind: 'booklet',
    options: {
      pageSize: pageSize.value,
      orientation: 'landscape',
      binding: binding.value,
      duplex: duplex.value,
      drawFoldLine: foldLine.value,
      drawBorders: borders.value,
      margin: mmToPt(marginMm.value),
      gutter: mmToPt(gutterMm.value),
    },
  })
}

const sizes: { value: PageSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'a3', label: 'A3' },
  { value: 'a5', label: 'A5' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
]
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.booklet.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.booklet.noDocument') }}
  </p>

  <template v-else>
    <ToolScope ref="scope" />

    <!-- A folded sheet: two pages side by side around the fold. -->
    <figure class="flex flex-col items-center gap-2" :aria-label="t('tools.booklet.schema')">
      <div class="flex h-24 w-36 rounded-sm bg-white p-1.5 shadow-card ring-1 ring-line" data-sheet>
        <span
          class="grid flex-1 place-items-center rounded-xs bg-surface-muted text-[10px] font-semibold text-fg-muted"
        >
          {{ binding === 'left' ? plan.sheets * 4 : 1 }}
        </span>
        <span
          class="mx-1 w-0 self-stretch"
          :class="foldLine ? 'border-l border-dashed border-fg-muted' : ''"
        />
        <span
          class="grid flex-1 place-items-center rounded-xs bg-surface-muted text-[10px] font-semibold text-fg-muted"
        >
          {{ binding === 'left' ? 1 : plan.sheets * 4 }}
        </span>
      </div>
      <figcaption class="text-center text-xs text-fg-muted">
        {{ t('tools.booklet.schemaCaption') }}
      </figcaption>
    </figure>

    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">{{ t('tools.booklet.sheetSize') }}</span>
      <select
        v-model="pageSize"
        class="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
      >
        <option v-for="size in sizes" :key="size.value" :value="size.value">
          {{ t('tools.booklet.sizeOption', { size: size.label, half: halves[size.value] }) }}
        </option>
      </select>
    </label>

    <SegmentedControl
      v-model="binding"
      :label="t('tools.booklet.binding')"
      :options="[
        {
          value: 'left',
          label: t('tools.booklet.bindings.left.label'),
          title: t('tools.booklet.bindings.left.title'),
        },
        {
          value: 'right',
          label: t('tools.booklet.bindings.right.label'),
          title: t('tools.booklet.bindings.right.title'),
        },
      ]"
    />

    <SegmentedControl
      v-model="duplex"
      :label="t('tools.booklet.duplex')"
      :options="[
        {
          value: 'bothSides',
          label: t('tools.booklet.duplexModes.bothSides.label'),
          title: t('tools.booklet.duplexModes.bothSides.title'),
        },
        {
          value: 'frontOnly',
          label: t('tools.booklet.duplexModes.frontOnly.label'),
          title: t('tools.booklet.duplexModes.frontOnly.title'),
        },
        {
          value: 'backOnly',
          label: t('tools.booklet.duplexModes.backOnly.label'),
          title: t('tools.booklet.duplexModes.backOnly.title'),
        },
      ]"
    />

    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="foldLine" type="checkbox" class="size-4 accent-accent" />
      {{ t('tools.booklet.foldLine') }}
    </label>
    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="borders" type="checkbox" class="size-4 accent-accent" />
      {{ t('tools.common.borders') }}
    </label>

    <details class="text-[13px]">
      <summary class="cursor-pointer text-fg-muted">{{ t('tools.booklet.margins') }}</summary>
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
          <span class="text-xs text-fg-muted">{{ t('tools.booklet.gutter') }}</span>
          <input
            v-model.number="gutterMm"
            type="number"
            min="0"
            step="0.5"
            class="rounded-md border border-line bg-surface px-2 py-1"
          />
        </label>
      </div>
    </details>

    <p class="text-xs text-fg-muted">
      {{ t('tools.booklet.sheets', plan.sheets) }}
      <template v-if="plan.blanks">
        ·
        {{ t('tools.booklet.blanks', plan.blanks) }}
      </template>
    </p>

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="store.active.busy || plan.sheets === 0"
      @click="make"
    >
      {{ t('tools.booklet.submit') }}
    </AppButton>
  </template>
</template>
