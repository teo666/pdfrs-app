<script setup lang="ts">
export interface DropIndicatorState {
  visible: boolean
  left: number
  top: number
  height: number
}

/**
 * Receives the reactive state object itself and reads its fields here, so
 * moving the bar re-renders only this component. Had the parent read the
 * fields in its own template, every move would re-render the parent's whole
 * list of cards.
 */
defineProps<{ state: DropIndicatorState }>()
</script>

<template>
  <div
    v-if="state.visible"
    class="pointer-events-none absolute w-[3px] rounded-sm bg-accent"
    :style="{ left: `${state.left}px`, top: `${state.top}px`, height: `${state.height}px` }"
  />
</template>
