<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BindingEdge, DuplexMode, PageSize } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import SegmentedControl from './SegmentedControl.vue'
import ToolScope from './ToolScope.vue'
import { bookletSheets, mmToPt } from '@/lib/imposition'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

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
const halves: Record<PageSize, string> = {
  a3: 'A4',
  a4: 'A5',
  a5: 'A6',
  letter: 'mezzo Letter',
  legal: 'mezzo Legal',
  native: 'metà del foglio',
}

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
    Un libretto da stampare fronte e retro e piegare a metà: le pagine vengono riordinate in modo
    che, piegati i fogli, si leggano nell’ordine giusto. Il risultato è un nuovo documento.
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    Apri un documento per farne un libretto.
  </p>

  <template v-else>
    <ToolScope ref="scope" />

    <!-- A folded sheet: two pages side by side around the fold. -->
    <figure class="flex flex-col items-center gap-2" aria-label="Schema del libretto">
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
        Fronte del primo foglio: ultima e prima pagina ai lati della piega
      </figcaption>
    </figure>

    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">Fogli su cui stampare</span>
      <select
        v-model="pageSize"
        class="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
      >
        <option v-for="size in sizes" :key="size.value" :value="size.value">
          {{ size.label }} orizzontale → libretto {{ halves[size.value] }}
        </option>
      </select>
    </label>

    <SegmentedControl
      v-model="binding"
      label="Rilegatura"
      :options="[
        { value: 'left', label: 'A sinistra', title: 'Si sfoglia da sinistra a destra' },
        {
          value: 'right',
          label: 'A destra',
          title: 'Per testi da destra a sinistra (arabo, ebraico, manga)',
        },
      ]"
    />

    <SegmentedControl
      v-model="duplex"
      label="Stampa"
      :options="[
        {
          value: 'bothSides',
          label: 'Fronte e retro',
          title: 'Stampante con fronte/retro automatico',
        },
        {
          value: 'frontOnly',
          label: 'Solo fronti',
          title: 'Primo passaggio, senza fronte/retro automatico',
        },
        {
          value: 'backOnly',
          label: 'Solo retri',
          title: 'Secondo passaggio: rigira i fogli e stampa questi',
        },
      ]"
    />

    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="foldLine" type="checkbox" class="size-4 accent-accent" />
      Linea tratteggiata sulla piega
    </label>
    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="borders" type="checkbox" class="size-4 accent-accent" />
      Bordo attorno a ogni pagina
    </label>

    <details class="text-[13px]">
      <summary class="cursor-pointer text-fg-muted">Margini</summary>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <label class="flex flex-col gap-1">
          <span class="text-xs text-fg-muted">Margine (mm)</span>
          <input
            v-model.number="marginMm"
            type="number"
            min="0"
            step="0.5"
            class="rounded-md border border-line bg-surface px-2 py-1"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-xs text-fg-muted">Margine sulla piega (mm)</span>
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
      {{ plan.sheets === 1 ? '1 foglio' : `${plan.sheets} fogli` }} da piegare
      <template v-if="plan.blanks">
        ·
        {{
          plan.blanks === 1 ? '1 pagina bianca aggiunta' : `${plan.blanks} pagine bianche aggiunte`
        }}
        in fondo, per arrivare a un multiplo di 4
      </template>
    </p>

    <AppButton
      variant="primary"
      class="justify-center"
      :disabled="store.active.busy || plan.sheets === 0"
      @click="make"
    >
      Crea libretto
    </AppButton>
  </template>
</template>
