<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import type { PageInfo } from 'pdfrs-editor'

import AppIcon from './AppIcon.vue'
import type { DropSide } from '@/lib/reorder'

const props = defineProps<{
  page: PageInfo
  /** 1-based position in the current display order. */
  position: number
  previewUrl?: string
  disabled?: boolean
  dragging?: boolean
  dropSide?: DropSide | null
}>()

const emit = defineEmits<{
  rotate: [degrees: number]
  toggleDelete: []
  /** The card is on screen and has no thumbnail yet. */
  needPreview: []
}>()

const root = useTemplateRef<HTMLElement>('root')
const visible = ref(false)
let observer: IntersectionObserver | null = null

function askIfNeeded() {
  if (visible.value && !props.previewUrl) emit('needPreview')
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      visible.value = entry?.isIntersecting ?? false
      askIfNeeded()
    },
    // Start rendering a little before the card actually scrolls in.
    { rootMargin: '300px 0px' },
  )
  if (root.value) observer.observe(root.value)
})

onUnmounted(() => observer?.disconnect())

// After a commit the thumbnails are thrown away while the card stays on
// screen - no intersection change will fire, so ask again from here.
watch(() => props.previewUrl, askIfNeeded)

const label = computed(() =>
  props.page.id === props.position
    ? `Pagina ${props.position}`
    : `Pagina ${props.position} (era ${props.page.id})`,
)
</script>

<template>
  <article
    ref="root"
    class="card"
    :class="{
      'card--deleted': page.markedForDeletion,
      'card--dragging': dragging,
      'card--drop-before': dropSide === 'before',
      'card--drop-after': dropSide === 'after',
    }"
    :aria-label="label"
    :data-page-id="page.id"
  >
    <div class="thumb">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="label"
        :style="{ transform: `rotate(${page.pendingRotation}deg)` }"
        draggable="false"
      />
      <div v-else class="skeleton" aria-hidden="true" />

      <div v-if="page.markedForDeletion" class="deleted-badge">Da eliminare</div>

      <div class="actions">
        <template v-if="!page.markedForDeletion">
          <button
            class="icon-btn"
            title="Ruota a sinistra"
            :disabled="disabled"
            @click="emit('rotate', -90)"
          >
            <AppIcon name="rotate-left" />
          </button>
          <button
            class="icon-btn"
            title="Ruota a destra"
            :disabled="disabled"
            @click="emit('rotate', 90)"
          >
            <AppIcon name="rotate-right" />
          </button>
          <button
            class="icon-btn icon-btn--danger"
            title="Elimina pagina"
            :disabled="disabled"
            @click="emit('toggleDelete')"
          >
            <AppIcon name="trash" />
          </button>
        </template>
        <button
          v-else
          class="icon-btn"
          title="Ripristina pagina"
          :disabled="disabled"
          @click="emit('toggleDelete')"
        >
          <AppIcon name="restore" />
        </button>
      </div>
    </div>

    <footer class="caption">
      <span class="position">{{ position }}</span>
      <span v-if="page.id !== position" class="origin" title="Posizione originale">
        era {{ page.id }}
      </span>
      <span v-if="page.pendingRotation" class="tag">{{ page.pendingRotation }}°</span>
    </footer>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
  cursor: grab;
  transition:
    box-shadow 0.15s,
    transform 0.15s,
    opacity 0.15s;
}

.card:hover {
  box-shadow: var(--shadow-lift);
}

.card--dragging {
  opacity: 0.35;
}

.card--drop-before::before,
.card--drop-after::after {
  content: '';
  position: absolute;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 2px;
  background: var(--accent);
}

.card--drop-before::before {
  left: -9px;
}

.card--drop-after::after {
  right: -9px;
}

.thumb {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
}

/*
 * Absolutely positioned so the percentage limits resolve against the square
 * box (a grid item's percentage height wouldn't). Since the box is square, a
 * page rotated a quarter turn still fits it without rescaling.
 */
.thumb img,
.skeleton {
  position: absolute;
  inset: 0;
  margin: auto;
}

.thumb img {
  max-width: calc(100% - 20px);
  max-height: calc(100% - 20px);
  box-shadow:
    0 0 0 1px var(--border),
    0 2px 6px #0000001a;
  background: #fff;
  transition: transform 0.2s ease;
}

.skeleton {
  width: 64%;
  height: 88%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--surface-2), var(--border), var(--surface-2));
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

.card--deleted .thumb img,
.card--deleted .skeleton {
  opacity: 0.3;
  filter: grayscale(1);
}

.deleted-badge {
  position: absolute;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.actions {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  box-shadow: var(--shadow);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.card:hover .actions,
.card:focus-within .actions,
.card--deleted .actions {
  opacity: 1;
  transform: none;
}

.icon-btn--danger:hover:not(:disabled) {
  background: var(--danger-soft);
  color: var(--danger);
}

.caption {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 20px;
  font-size: 12px;
  color: var(--text-muted);
}

.position {
  font-weight: 600;
  color: var(--text);
}

.tag {
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

@media (hover: none) {
  .actions {
    opacity: 1;
    transform: none;
  }
}
</style>
