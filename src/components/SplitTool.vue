<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import AppButton from './AppButton.vue'
import SegmentedControl from './SegmentedControl.vue'
import { leftOut, parseRanges, partColor, splitAtStarts, splitEvery, type Part } from '@/lib/split'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

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
  start === end ? `pagina ${start}` : `pagine ${start}–${end}`
const pages = (count: number) => (count === 1 ? '1 pagina' : `${count} pagine`)
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    Taglia il documento in più parti: ognuna diventa un nuovo documento, con le pagine così come
    appaiono ora. L’originale non cambia.
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    Apri un documento per dividerlo.
  </p>

  <template v-else>
    <SegmentedControl
      v-model="mode"
      label="Come dividere"
      :options="[
        { value: 'every', label: 'Ogni N', title: 'Parti di N pagine ciascuna' },
        { value: 'ranges', label: 'Intervalli', title: 'Scrivi gli intervalli, es. 1-3, 4-8' },
        {
          value: 'selection',
          label: 'Selezione',
          title: 'Ogni pagina selezionata inizia una nuova parte',
        },
      ]"
    />

    <label v-if="mode === 'every'" class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">Pagine per parte</span>
      <input
        v-model.number="size"
        type="number"
        min="1"
        :max="total"
        class="w-24 rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
        aria-label="Pagine per parte"
      />
      <span class="text-xs text-fg-muted">1 = un documento per ogni pagina</span>
    </label>

    <label v-else-if="mode === 'ranges'" class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">Intervalli, uno per parte</span>
      <input
        v-model="rangesText"
        type="text"
        :placeholder="`es. 1-3, 4-8, 9-${total}`"
        class="rounded-md border bg-surface px-2 py-1.5 text-[13px]"
        :class="error ? 'border-danger' : 'border-line'"
        aria-label="Intervalli di pagine"
        spellcheck="false"
      />
      <span v-if="error" class="text-xs text-danger" role="alert">{{ error }}</span>
      <span v-else class="text-xs text-fg-muted">
        Numeri delle pagine come sulle miniature; una pagina sola vale come parte.
      </span>
    </label>

    <p v-else class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
      Seleziona le pagine da cui deve iniziare ogni nuova parte: la prima parte parte sempre da
      pagina 1.
      <template v-if="selectedPositions.length">
        Selezionate: {{ selectedPositions.join(', ') }}.
      </template>
    </p>

    <section v-if="usable.length" class="flex flex-col gap-1.5" aria-label="Parti">
      <h3 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">
        {{ usable.length === 1 ? '1 parte' : `${usable.length} parti` }}
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
            Parte {{ index + 1 }}: {{ describe(part) }}
          </span>
          <span class="text-fg-muted">{{ pages(kept(part)) }}</span>
        </li>
        <li v-if="usable.length > LISTED" class="px-2.5 text-xs text-fg-muted">
          … e altre {{ usable.length - LISTED }} parti
        </li>
      </ol>
    </section>

    <p v-if="missing.length" class="text-xs text-fg-muted">
      Non finiscono in nessuna parte: {{ missing.length === 1 ? 'pagina' : 'pagine' }}
      {{ missing.join(', ') }}.
    </p>
    <p v-if="hasDeletions" class="text-xs text-fg-muted">
      Le pagine segnate da eliminare vengono lasciate fuori.
    </p>

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="store.active.busy || usable.length === 0 || !!error"
      @click="store.split(usable)"
    >
      {{
        usable.length > 1
          ? `Dividi in ${usable.length} documenti`
          : usable.length === 1
            ? 'Crea 1 documento'
            : 'Indica come dividere'
      }}
    </AppButton>
  </template>
</template>
