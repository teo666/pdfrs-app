<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  layoutText,
  type LabelPosition,
  type PageId,
  type StandardFont,
  type TextContent,
} from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import ColorPicker from './ColorPicker.vue'
import SegmentedControl from './SegmentedControl.vue'
import TextStamp from './TextStamp.vue'
import ToolScope from './ToolScope.vue'
import { mmToPt } from '@/lib/imposition'
import { useEditorStore } from '@/stores/editor'

/**
 * Page numbers, a header or a footer: the same short text on the selected
 * pages (or all of them), with `{n}` and `{total}` filled in page by page in
 * the order the pages are shown, and `{date}` with today's date. Goes into
 * the document at once, like the watermark: the thumbnails show it, and
 * Annulla takes it away.
 */
const store = useEditorStore()
const { t, locale } = useI18n()

type Preset = 'number' | 'pageOf' | 'slash' | 'custom'
const preset = ref<Preset>('pageOf')
const custom = ref(t('tools.pageNumbers.customDefault'))
const position = ref<LabelPosition>('bottom-center')
const font = ref<StandardFont>('helvetica')
const bold = ref(false)
const size = ref(10)
const color = ref('#1c2026')
const marginMm = ref(12)
const start = ref(1)
const skipFirst = ref(false)

const template = computed(() => {
  switch (preset.value) {
    case 'number':
      return '{n}'
    case 'slash':
      return '{n} / {total}'
    case 'pageOf':
      return t('tools.pageNumbers.pageOfTemplate')
    default:
      return custom.value
  }
})
const blank = computed(() => template.value.trim() === '')

/** The pages it goes on: the selected ones, or every page shown, in the order shown. */
const targets = computed<PageId[]>(() => {
  const doc = store.active
  if (!doc) return []
  const shown = doc.pages.filter((p) => !p.markedForDeletion)
  const chosen = doc.selection.size ? shown.filter((p) => doc.selection.has(p.id)) : shown
  return chosen.map((p) => p.id)
})

/** What the first page labelled will read. */
const sample = computed(() => {
  const first = skipFirst.value ? 1 : 0
  const total = targets.value.length + start.value - 1
  const date = new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date())
  return template.value
    .split('{n}')
    .join(String(start.value + first))
    .split('{total}')
    .join(String(total))
    .split('{date}')
    .join(date)
})

/** The page the preview shows: the first one labelled. */
const previewPage = computed(() => targets.value[skipFirst.value ? 1 : 0] ?? null)
const thumbnail = computed(() =>
  store.active && previewPage.value !== null ? store.active.previews[previewPage.value] : undefined,
)
watch(
  [() => store.active?.id, previewPage, thumbnail],
  ([doc, page, url]) => {
    if (doc !== undefined && page !== null && !url) store.requestPreview(doc, page)
  },
  { immediate: true },
)

/** The page's size in points, from its thumbnail (A4 until it's there). */
const page = ref({ width: 595, height: 842 })
function measure(event: Event) {
  const img = event.target as HTMLImageElement
  page.value = {
    width: img.naturalWidth / store.previewScale,
    height: img.naturalHeight / store.previewScale,
  }
}

const align = computed(() =>
  position.value.endsWith('left') ? 'left' : position.value.endsWith('right') ? 'right' : 'center',
)
const content = computed<TextContent>(() => ({
  text: sample.value,
  font: font.value,
  bold: bold.value,
  italic: false,
  color: color.value,
  align: align.value,
}))

/** Where the engine puts it (watermark.rs, page_labels), in fractions of the page. */
const box = computed(() => {
  const layout = layoutText(sample.value, content.value)
  const w = layout.width * size.value
  const h = layout.height * size.value
  const margin = mmToPt(marginMm.value)
  const x =
    align.value === 'left'
      ? margin
      : align.value === 'right'
        ? page.value.width - margin - w
        : (page.value.width - w) / 2
  const y = position.value.startsWith('top') ? margin : page.value.height - margin - h
  return {
    x: x / page.value.width,
    y: y / page.value.height,
    width: w / page.value.width,
    height: h / page.value.height,
  }
})

const POSITIONS: LabelPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

function apply() {
  if (blank.value) return
  void store.addPageLabels({
    template: template.value,
    start: start.value,
    skipFirst: skipFirst.value,
    position: position.value,
    size: size.value,
    font: font.value,
    bold: bold.value,
    color: color.value,
    margin: mmToPt(marginMm.value),
  })
}
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.pageNumbers.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.pageNumbers.noDocument') }}
  </p>

  <template v-else>
    <fieldset class="flex flex-col gap-1.5">
      <legend class="mb-1.5 text-xs font-semibold text-fg-muted">
        {{ t('tools.pageNumbers.text') }}
      </legend>
      <label
        v-for="option in ['number', 'pageOf', 'slash', 'custom'] as Preset[]"
        :key="option"
        class="flex cursor-pointer items-center gap-2 text-[13px]"
      >
        <input v-model="preset" type="radio" :value="option" class="size-4 accent-accent" />
        {{ t(`tools.pageNumbers.presets.${option}`) }}
      </label>
      <template v-if="preset === 'custom'">
        <input
          v-model="custom"
          class="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
          :aria-label="t('tools.pageNumbers.customLabel')"
        />
        <span class="text-xs text-fg-muted">{{ t('tools.pageNumbers.tokens') }}</span>
      </template>
    </fieldset>

    <div class="flex flex-col gap-1.5">
      <span id="label-position" class="text-xs font-semibold text-fg-muted">
        {{ t('tools.pageNumbers.position') }}
      </span>
      <div
        class="grid grid-cols-3 gap-1 rounded-md bg-surface-muted p-1"
        role="radiogroup"
        aria-labelledby="label-position"
      >
        <button
          v-for="option in POSITIONS"
          :key="option"
          type="button"
          class="grid h-9 cursor-pointer place-items-center rounded transition-colors"
          :class="
            position === option
              ? 'bg-surface font-semibold shadow-card'
              : 'text-fg-muted hover:text-fg'
          "
          role="radio"
          :aria-checked="position === option"
          :aria-label="t(`tools.pageNumbers.positions.${option}`)"
          :title="t(`tools.pageNumbers.positions.${option}`)"
          @click="position = option"
        >
          <!-- A little page, with the label where this option puts it. -->
          <svg viewBox="0 0 16 20" class="h-6 w-5" aria-hidden="true">
            <rect x="0.75" y="0.75" width="14.5" height="18.5" rx="1.5" class="fill-none stroke-current" stroke-width="1.5" />
            <rect
              :x="option.endsWith('left') ? 3 : option.endsWith('right') ? 8 : 5.5"
              :y="option.startsWith('top') ? 3 : 15"
              width="5"
              height="2"
              rx="1"
              class="fill-current"
            />
          </svg>
        </button>
      </div>
    </div>

    <SegmentedControl
      v-model="font"
      :label="t('editing.textEditor.font')"
      :options="[
        { value: 'helvetica', label: 'Helvetica' },
        { value: 'times', label: 'Times' },
        { value: 'courier', label: 'Courier' },
      ]"
    />

    <div class="flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-fg-muted">{{ t('tools.pageNumbers.size') }}</span>
        <input
          v-model.number="size"
          type="number"
          min="4"
          max="72"
          class="w-16 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
        />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-fg-muted">{{ t('tools.pageNumbers.margin') }}</span>
        <input
          v-model.number="marginMm"
          type="number"
          min="0"
          max="100"
          class="w-16 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
        />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-fg-muted">{{ t('tools.pageNumbers.start') }}</span>
        <input
          v-model.number="start"
          type="number"
          min="0"
          class="w-16 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
        />
      </label>
      <label class="flex cursor-pointer items-center gap-2 pb-1.5 text-[13px]">
        <input v-model="bold" type="checkbox" class="size-4 accent-accent" />
        {{ t('editing.textEditor.bold') }}
      </label>
    </div>

    <ColorPicker v-model="color" />

    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="skipFirst" type="checkbox" class="size-4 accent-accent" />
      {{ t('tools.pageNumbers.skipFirst') }}
    </label>

    <figure
      v-if="previewPage !== null && !blank"
      class="flex justify-center rounded-md bg-surface-muted p-3"
      :aria-label="t('tools.pageNumbers.preview')"
    >
      <div class="relative overflow-hidden bg-white shadow-card ring-1 ring-line">
        <img v-if="thumbnail" :src="thumbnail" alt="" class="block max-h-56 w-auto" @load="measure" />
        <div v-else class="h-56" :style="{ aspectRatio: `${page.width} / ${page.height}` }" />
        <div
          class="pointer-events-none absolute"
          :style="{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
          }"
        >
          <TextStamp :content="content" />
        </div>
      </div>
      <figcaption class="sr-only">{{ sample }}</figcaption>
    </figure>

    <ToolScope />

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="blank || store.active.busy || targets.length === 0"
      @click="apply"
    >
      {{ t('tools.pageNumbers.submit') }}
    </AppButton>
  </template>
</template>
