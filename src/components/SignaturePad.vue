<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'
import type { ImageAsset } from 'pdfrs-editor'

import { cropToInk } from '@/lib/images'

/** "dark" on the viewer's black backdrop, "light" in the app's tool panel. */
const { tone = 'dark' } = defineProps<{ tone?: 'dark' | 'light' }>()
const emit = defineEmits<{ done: [image: ImageAsset]; cancel: [] }>()

const styles = {
  dark: {
    muted: 'text-white/60',
    chosen: 'border-white',
    quiet: 'text-white/75 hover:text-white',
    primary: 'bg-white text-black',
    secondary: 'text-white/80 hover:bg-white/10',
  },
  light: {
    muted: 'text-fg-muted',
    chosen: 'border-fg',
    quiet: 'text-fg-muted hover:text-fg',
    primary: 'bg-accent text-accent-fg',
    secondary: 'text-fg-muted hover:bg-surface-muted',
  },
}[tone]

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const inks = { Nero: '#111111', Blu: '#1a3fb0' } as const
const ink = ref<keyof typeof inks>('Nero')
const empty = ref(true)

/** Drawn at twice the screen density, so the signature stays sharp when enlarged on the page. */
const DENSITY = Math.max(2, window.devicePixelRatio || 1)
const LINE_WIDTH = 2.6

let drawing = false
let last: { x: number; y: number } | null = null
let mid: { x: number; y: number } | null = null

function point(event: PointerEvent) {
  const rect = canvas.value!.getBoundingClientRect()
  return { x: (event.clientX - rect.left) * DENSITY, y: (event.clientY - rect.top) * DENSITY }
}

function context() {
  const ctx = canvas.value!.getContext('2d')!
  ctx.lineWidth = LINE_WIDTH * DENSITY
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = inks[ink.value]
  return ctx
}

function onDown(event: PointerEvent) {
  event.preventDefault()
  try {
    canvas.value!.setPointerCapture(event.pointerId)
  } catch {
    /* not capturable (synthetic pointer): drawing works without it */
  }
  drawing = true
  last = point(event)
  mid = last
  // A dot, so a single tap leaves a mark (e.g. the dot of an "i").
  const ctx = context()
  ctx.beginPath()
  ctx.arc(last.x, last.y, (LINE_WIDTH * DENSITY) / 2, 0, Math.PI * 2)
  ctx.fillStyle = inks[ink.value]
  ctx.fill()
  empty.value = false
}

// Smooth strokes: each segment is a quadratic curve through the midpoints
// of consecutive samples, instead of a polyline with visible corners.
function onMove(event: PointerEvent) {
  if (!drawing || !last || !mid) return
  const ctx = context()
  // Coalesced samples give smoother lines on fast moves; synthetic events
  // have none, so fall back to the event itself.
  const coalesced = event.getCoalescedEvents?.() ?? []
  for (const sample of coalesced.length > 0 ? coalesced : [event]) {
    const p = point(sample)
    const nextMid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 }
    ctx.beginPath()
    ctx.moveTo(mid.x, mid.y)
    ctx.quadraticCurveTo(last.x, last.y, nextMid.x, nextMid.y)
    ctx.stroke()
    last = p
    mid = nextMid
  }
}

function onUp() {
  drawing = false
  last = mid = null
}

function clear() {
  const el = canvas.value!
  el.getContext('2d')!.clearRect(0, 0, el.width, el.height)
  empty.value = true
}

function save() {
  const image = cropToInk(canvas.value!)
  if (image) emit('done', image)
}

onMounted(() => {
  const el = canvas.value!
  const rect = el.getBoundingClientRect()
  el.width = Math.round(rect.width * DENSITY)
  el.height = Math.round(rect.height * DENSITY)
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="relative">
      <canvas
        ref="canvas"
        class="block h-36 w-full cursor-crosshair touch-none rounded-md bg-white"
        :class="{ 'ring-1 ring-line': tone === 'light' }"
        aria-label="Area per disegnare la firma"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      />
      <!-- The line to sign on: only a guide, it's not part of the image. -->
      <div
        class="pointer-events-none absolute inset-x-4 bottom-8 border-b border-dashed border-black/25"
      />
      <p
        v-if="empty"
        class="pointer-events-none absolute inset-0 grid place-items-center text-sm text-black/40"
      >
        Firma qui con il mouse o con il dito
      </p>
    </div>
    <div class="flex items-center gap-1.5 text-xs">
      <span :class="styles.muted">Inchiostro</span>
      <button
        v-for="(color, name) in inks"
        :key="name"
        class="size-5 cursor-pointer rounded-full border-2"
        :class="ink === name ? styles.chosen : 'border-transparent'"
        :style="{ background: color }"
        :aria-label="`Inchiostro ${name.toLowerCase()}`"
        :aria-pressed="ink === name"
        @click="ink = name"
      />
      <button class="ml-auto cursor-pointer px-2 py-1" :class="styles.quiet" @click="clear">
        Cancella
      </button>
    </div>
    <div class="flex gap-1.5">
      <button
        class="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold disabled:cursor-default disabled:opacity-40"
        :class="styles.primary"
        :disabled="empty"
        @click="save"
      >
        Usa questa firma
      </button>
      <button
        class="cursor-pointer rounded-md px-3 py-1.5 text-sm"
        :class="styles.secondary"
        @click="emit('cancel')"
      >
        Annulla
      </button>
    </div>
  </div>
</template>
