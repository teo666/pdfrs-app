<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

import type { CompressionLevel } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
import IconButton from './IconButton.vue'
import ImageThumb from './ImageThumb.vue'
import { pickFiles } from '@/lib/files'
import { formatBytes, pagesLabel } from '@/lib/format'
import { REPLACEMENT_FILES } from '@/lib/images'
import { useEditorStore } from '@/stores/editor'

/**
 * The images already in the document: what they are, where, how heavy -
 * taking them away (a pending edit, like the others), downloading them,
 * putting another picture in the place of one (everywhere it's drawn), and
 * a lighter copy of the document with them recompressed. A click on one
 * opens it in the viewer, selected.
 */
const store = useEditorStore()
const { t } = useI18n()
const doc = computed(() => store.active)

watch(
  () => store.active?.id,
  (id) => {
    if (id !== undefined) void store.loadImages(id)
  },
  { immediate: true },
)

const images = computed(() => doc.value?.images ?? null)
const totalBytes = computed(() => (images.value ?? []).reduce((sum, image) => sum + image.bytes, 0))
const removing = computed(() => (images.value ?? []).filter((image) => image.removed))
const removingBytes = computed(() => removing.value.reduce((sum, image) => sum + image.bytes, 0))

/** Inline images (written inside the page) and masks have no picture of their own to swap. */
const replaceable = (image: { inline: boolean; colorSpace?: string | null }) =>
  !image.inline && image.colorSpace !== 'ImageMask'

async function replace(key: string) {
  const [file] = await pickFiles(REPLACEMENT_FILES)
  if (file) await store.replaceImage(key, file)
}

const LEVELS: CompressionLevel[] = ['high', 'balanced', 'small']
const level = ref<CompressionLevel>('balanced')
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.images.intro') }}
  </p>

  <p v-if="!doc" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.images.noDocument') }}
  </p>
  <p v-else-if="images === null" class="text-[13px] text-fg-muted">
    {{ t('tools.images.searching') }}
  </p>
  <p
    v-else-if="images.length === 0"
    class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted"
  >
    {{ t('tools.images.none') }}
  </p>

  <template v-else>
    <p class="text-[13px]" data-testid="images-summary">
      <I18nT keypath="tools.images.summary" scope="global">
        <template #count>
          <strong>{{ t('tools.images.count', images.length) }}</strong>
        </template>
        <template #size>{{ formatBytes(totalBytes) }}</template>
      </I18nT>
      <span v-if="removing.length" class="text-warning">
        {{
          t('tools.images.removing', {
            count: removing.length,
            size: formatBytes(removingBytes),
          })
        }}
      </span>
    </p>

    <ul class="flex flex-col gap-2" :aria-label="t('tools.images.list')">
      <li
        v-for="image in images"
        :key="image.key"
        class="flex items-center gap-3 rounded-md border p-2"
        :class="image.removed ? 'border-danger/40 bg-danger-soft' : 'border-line'"
      >
        <button
          class="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
          :title="t('tools.images.showOnPage', { page: image.pages[0] })"
          @click="store.focusImage(image.key)"
        >
          <ImageThumb :image-key="image.key" :class="{ 'opacity-40': image.removed }" />
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="text-[13px] font-semibold">
              {{ image.width }} × {{ image.height }} px
            </span>
            <span class="text-xs text-fg-muted">
              {{ image.format.toUpperCase() }} · {{ formatBytes(image.bytes) }}
            </span>
            <span class="truncate text-xs text-fg-muted">{{ pagesLabel(image.pages) }}</span>
            <span v-if="image.removed" class="text-xs font-semibold text-danger">
              {{ t('tools.images.toRemove') }}
            </span>
          </span>
        </button>
        <div class="flex shrink-0 flex-col gap-1">
          <IconButton
            icon="download"
            size="sm"
            :label="t('tools.images.downloadOf', { pages: pagesLabel(image.pages) })"
            :title="t('tools.images.download')"
            @click="store.downloadImage(image.key)"
          />
          <IconButton
            icon="upload"
            size="sm"
            :label="t('tools.images.replaceOf', { pages: pagesLabel(image.pages) })"
            :title="
              !replaceable(image)
                ? t('tools.images.cannotReplace')
                : image.pages.length > 1
                  ? t('tools.images.replaceEverywhere')
                  : t('tools.images.replace')
            "
            :disabled="doc.busy || image.removed || !replaceable(image)"
            @click="replace(image.key)"
          />
          <IconButton
            v-if="image.removed"
            icon="restore"
            size="sm"
            :label="t('tools.images.restoreOf', { pages: pagesLabel(image.pages) })"
            :title="t('tools.images.restore')"
            :disabled="doc.busy"
            @click="store.restoreImages(image.placements)"
          />
          <IconButton
            v-else
            icon="trash"
            size="sm"
            variant="danger"
            :label="t('tools.images.removeFrom', { pages: pagesLabel(image.pages) })"
            :title="
              image.pages.length > 1 ? t('tools.images.removeEverywhere') : t('tools.images.remove')
            "
            :disabled="doc.busy"
            @click="store.removeImages(image.placements)"
          />
        </div>
      </li>
    </ul>

    <p class="flex items-start gap-1.5 text-xs text-fg-muted">
      <AppIcon name="info" :size="14" class="mt-px" />
      {{ t('tools.images.someOnly') }}
    </p>

    <section class="flex flex-col gap-2 border-t border-line pt-4" aria-labelledby="compress-title">
      <h3 id="compress-title" class="text-xs font-semibold tracking-wider text-fg-muted uppercase">
        {{ t('tools.images.compress.title') }}
      </h3>
      <p class="text-[13px] text-fg-muted">{{ t('tools.images.compress.intro') }}</p>
      <fieldset class="flex flex-col gap-1.5">
        <legend class="sr-only">{{ t('tools.images.compress.level') }}</legend>
        <label
          v-for="option in LEVELS"
          :key="option"
          class="flex cursor-pointer items-start gap-2 rounded-md border p-2"
          :class="level === option ? 'border-accent bg-accent-soft' : 'border-line'"
        >
          <input
            v-model="level"
            type="radio"
            name="compress-level"
            :value="option"
            class="mt-0.5 size-4 accent-accent"
          />
          <span class="flex flex-col">
            <span class="text-[13px] font-semibold">{{
              t(`tools.images.compress.levels.${option}.label`)
            }}</span>
            <span class="text-xs text-fg-muted">{{
              t(`tools.images.compress.levels.${option}.hint`)
            }}</span>
          </span>
        </label>
      </fieldset>
      <AppButton
        variant="primary"
        icon="file-plus"
        class="justify-center"
        :disabled="doc.busy"
        @click="store.compressImages(level)"
      >
        {{ t('tools.images.compress.submit') }}
      </AppButton>
    </section>
  </template>
</template>
