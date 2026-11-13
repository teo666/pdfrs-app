<script setup lang="ts">
import type { PlacementView } from '@/stores/editor'

/**
 * The images already in a page, over its picture: each as its outline (a
 * box clipped to the image's corners, so a turned or slanted image is
 * outlined as it is). In the viewer they can be clicked; on a card only the
 * ones waiting to be removed are shown, struck through. Inside the turned
 * page div, so fractions of the page are all it needs.
 */
const {
  placements,
  interactive = false,
  selectedId = null,
} = defineProps<{
  placements: PlacementView[]
  interactive?: boolean
  selectedId?: string | null
}>()
const emit = defineEmits<{ select: [id: string] }>()

const percent = (value: number) => `${value * 100}%`

/** The corners relative to the box around them, for clip-path. */
function clip(placement: PlacementView) {
  const w = placement.width || 1
  const h = placement.height || 1
  const points = placement.corners.map(
    ([x, y]) => `${((x - placement.x) / w) * 100}% ${((y - placement.y) / h) * 100}%`,
  )
  return `polygon(${points.join(', ')})`
}
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0"
    :data-image-layer="interactive ? 'viewer' : 'card'"
  >
    <template v-for="placement in placements" :key="placement.id">
      <div
        v-if="interactive || placement.removed"
        class="absolute"
        :class="[
          placement.removed ? 'hatch-removed' : '',
          interactive
            ? 'pointer-events-auto cursor-pointer outline-2 -outline-offset-2 transition-colors'
            : '',
          interactive && placement.id === selectedId
            ? 'outline-accent bg-accent/20'
            : interactive
              ? 'outline-accent/70 outline-dashed hover:bg-accent/15'
              : '',
        ]"
        :style="{
          left: percent(placement.x),
          top: percent(placement.y),
          width: percent(placement.width),
          height: percent(placement.height),
          clipPath: clip(placement),
        }"
        :role="interactive ? 'button' : undefined"
        :aria-label="
          interactive
            ? placement.removed
              ? 'Immagine da rimuovere'
              : 'Immagine nella pagina'
            : undefined
        "
        :aria-pressed="interactive ? placement.id === selectedId : undefined"
        :data-placement="placement.id"
        @pointerdown.stop
        @click.stop="emit('select', placement.id)"
      />
    </template>
  </div>
</template>
