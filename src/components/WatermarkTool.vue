<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  layoutText,
  type ImageAsset,
  type ImageWatermarkOptions,
  type PageId,
  type TextContent,
  type WatermarkOptions,
} from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import SegmentedControl from './SegmentedControl.vue'
import TextEditor from './TextEditor.vue'
import TextStamp from './TextStamp.vue'
import ToolScope from './ToolScope.vue'
import { pickFiles } from '@/lib/files'
import { assetToUrl, imageFileToAsset, MAX_IMAGE_SIZE } from '@/lib/images'
import { watermarkBox } from '@/lib/watermark'
import { useEditorStore } from '@/stores/editor'

/**
 * A text watermark ("BOZZA" across the page...) on the selected pages, or
 * on all of them. Unlike signatures and texts it goes into the document at
 * once - it can sit under the page's content, which no overlay can show -
 * so the thumbnails show it as it comes out; Annulla takes it away.
 *
 * The preview draws it, with the engine's geometry, on the first page it
 * goes on. It can be an image instead of text: a logo, a stamp, its
 * transparency kept.
 */
const store = useEditorStore()
const { t } = useI18n()

const content = ref<TextContent>({
  text: t('tools.watermark.defaultText'),
  font: 'helvetica',
  bold: true,
  italic: false,
  color: '#808080',
  align: 'center',
})
/** A text, or a picture. */
const kind = ref<'text' | 'image'>('text')
const picture = ref<{ asset: ImageAsset; url: string } | null>(null)
/** The picture's width, as a share of the page's, when not fitting the page. */
const share = ref(40)
const sizeMode = ref<'fit' | 'points'>('fit')
const points = ref(72)
const angle = ref(45)
const opacity = ref(30)
const position = ref<NonNullable<WatermarkOptions['position']>>('center')
const layer = ref<NonNullable<WatermarkOptions['layer']>>('over')

const options = computed<WatermarkOptions>(() => ({
  ...content.value,
  size: sizeMode.value === 'fit' ? 'fit' : Math.max(4, points.value || 4),
  angle: angle.value,
  opacity: opacity.value / 100,
  position: position.value,
  layer: layer.value,
}))
const blank = computed(() =>
  kind.value === 'image' ? picture.value === null : content.value.text.trim() === '',
)

// A text reads best on the diagonal, a logo upright.
watch(kind, (now) => (angle.value = now === 'image' ? 0 : 45))

async function choosePicture() {
  const [file] = await pickFiles('image/png,image/jpeg,image/webp,image/gif')
  if (!file) return
  const asset = await imageFileToAsset(file, MAX_IMAGE_SIZE)
  picture.value = { asset, url: await assetToUrl(asset) }
}

const imageOptions = computed<ImageWatermarkOptions>(() => ({
  size: sizeMode.value === 'fit' ? 'fit' : share.value / 100,
  angle: angle.value,
  opacity: opacity.value / 100,
  position: position.value,
  layer: layer.value,
}))

function apply() {
  if (blank.value) return
  if (kind.value === 'image' && picture.value) {
    void store.addImageWatermark(picture.value.asset, imageOptions.value)
  } else {
    void store.addWatermark(options.value)
  }
}

/** The page the preview shows: the first selected one, or the first one shown. */
const target = computed<{ id: PageId; position: number } | null>(() => {
  const doc = store.active
  if (!doc) return null
  const index = doc.pages.findIndex((p) =>
    doc.selection.size ? doc.selection.has(p.id) : !p.markedForDeletion,
  )
  const page = doc.pages[index]
  return page ? { id: page.id, position: index + 1 } : null
})
const thumbnail = computed(() =>
  store.active && target.value ? store.active.previews[target.value.id] : undefined,
)
watch(
  [() => store.active?.id, () => target.value?.id, thumbnail],
  ([doc, page, url]) => {
    if (doc !== undefined && page !== undefined && !url) store.requestPreview(doc, page)
  },
  { immediate: true },
)

/** The page's size in points, from its thumbnail (A4 until it's there). */
const page = ref({ width: 595, height: 842 })
function measure(event: Event) {
  const img = event.target as HTMLImageElement
  const scale = store.previewScale
  page.value = { width: img.naturalWidth / scale, height: img.naturalHeight / scale }
}

const box = computed(() => {
  if (kind.value === 'image' && picture.value) {
    // As a "text" one unit wide: its size is then points of width.
    const { width, height } = picture.value.asset
    return watermarkBox({ width: 1, height: height / width }, page.value, {
      ...imageOptions.value,
      size: sizeMode.value === 'fit' ? 'fit' : (share.value / 100) * page.value.width,
    })
  }
  const layout = layoutText(content.value.text, content.value)
  return watermarkBox(layout, page.value, options.value)
})

const angles = computed(() => [
  { value: 45, label: '↗', title: t('tools.watermark.angles.rising') },
  { value: 0, label: '→', title: t('tools.watermark.angles.horizontal') },
  { value: -45, label: '↘', title: t('tools.watermark.angles.falling') },
  { value: 90, label: '↑', title: t('tools.watermark.angles.vertical') },
])
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.watermark.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.watermark.noDocument') }}
  </p>

  <template v-else>
    <SegmentedControl
      v-model="kind"
      :label="t('tools.watermark.kind')"
      :options="[
        { value: 'text', label: t('tools.watermark.kinds.text') },
        { value: 'image', label: t('tools.watermark.kinds.image') },
      ]"
    />

    <TextEditor v-if="kind === 'text'" v-model="content" />
    <div v-else class="flex items-center gap-3">
      <img
        v-if="picture"
        :src="picture.url"
        alt=""
        class="size-14 rounded-md bg-surface-muted object-contain ring-1 ring-line"
      />
      <AppButton icon="upload" @click="choosePicture">
        {{ picture ? t('tools.watermark.changeImage') : t('tools.watermark.chooseImage') }}
      </AppButton>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <SegmentedControl
        v-model="sizeMode"
        class="grow"
        :label="t('tools.watermark.size')"
        :options="[
          { value: 'fit', label: t('tools.watermark.sizeFit') },
          {
            value: 'points',
            label: kind === 'image' ? t('tools.watermark.sizeShare') : t('tools.watermark.sizePoints'),
          },
        ]"
      />
      <label v-if="sizeMode === 'points' && kind === 'image'" class="flex items-center gap-2">
        <input
          v-model.number="share"
          type="range"
          min="5"
          max="100"
          step="5"
          class="w-24 accent-accent"
          :aria-label="t('tools.watermark.shareLabel')"
        />
        <output class="w-9 text-xs tabular-nums">{{ share }}%</output>
      </label>
      <input
        v-else-if="sizeMode === 'points'"
        v-model.number="points"
        type="number"
        min="4"
        max="400"
        class="w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] text-fg"
        :aria-label="t('tools.watermark.sizeLabel')"
      />
    </div>

    <SegmentedControl v-model="angle" :label="t('tools.watermark.angle')" :options="angles" />

    <label class="flex flex-col gap-1.5">
      <span class="flex justify-between text-xs font-semibold text-fg-muted">
        {{ t('tools.watermark.opacity') }}
        <output class="font-normal tabular-nums">{{ opacity }}%</output>
      </span>
      <input v-model.number="opacity" type="range" min="5" max="100" step="5" class="accent-accent" />
    </label>

    <SegmentedControl
      v-model="position"
      :label="t('tools.watermark.position')"
      :options="[
        { value: 'top', label: t('tools.watermark.positions.top') },
        { value: 'center', label: t('tools.watermark.positions.center') },
        { value: 'bottom', label: t('tools.watermark.positions.bottom') },
      ]"
    />

    <SegmentedControl
      v-model="layer"
      :label="t('tools.watermark.layer')"
      :options="[
        { value: 'over', label: t('tools.watermark.layers.over') },
        { value: 'under', label: t('tools.watermark.layers.under') },
      ]"
    />
    <p v-if="layer === 'under'" class="text-xs text-fg-muted">{{ t('tools.watermark.underHint') }}</p>

    <figure
      v-if="target && !blank"
      class="flex justify-center rounded-md bg-surface-muted p-3"
      :aria-label="t('tools.watermark.preview', { page: target.position })"
    >
      <div class="relative overflow-hidden bg-white shadow-card ring-1 ring-line">
        <img
          v-if="thumbnail"
          :src="thumbnail"
          alt=""
          class="block max-h-56 w-auto"
          @load="measure"
        />
        <div v-else class="h-56" :style="{ aspectRatio: `${page.width} / ${page.height}` }" />
        <div
          class="pointer-events-none absolute"
          :style="{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
            transform: `rotate(${box.rotation}deg)`,
            opacity: options.opacity,
          }"
        >
          <img v-if="kind === 'image' && picture" :src="picture.url" alt="" class="block size-full" />
          <TextStamp v-else :content="content" />
        </div>
      </div>
    </figure>

    <ToolScope />

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="blank || store.active.busy"
      @click="apply"
    >
      {{ t('tools.watermark.submit') }}
    </AppButton>
  </template>
</template>
