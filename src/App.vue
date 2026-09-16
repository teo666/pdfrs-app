<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { createWorkerPool } from './worker-pool.js'

interface Page {
  index: number
  url: string
}

const pool = createWorkerPool(5)
onUnmounted(() => pool.terminate())

const pages = ref<Page[]>([])
const sortedPages = computed(() => [...pages.value].sort((a, b) => a.index - b.index))
const loading = ref(false)
const error = ref('')
const renderMs = ref<number | null>(null) // tempo totale dell'ultimo rendering completo, in ms

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  error.value = ''
  renderMs.value = null
  pages.value.forEach((p) => URL.revokeObjectURL(p.url))
  pages.value = []
  loading.value = true

  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const count = await pool.pageCount(bytes)

    // Il cronometro parte da qui: page_count non fa parte della "preview",
    // misuriamo solo il rendering vero e proprio delle pagine.
    const start = performance.now()

    // Ogni pagina è un task indipendente: il pool li smista ai worker liberi,
    // così più pagine vengono renderizzate in parallelo invece che una alla
    // volta, e il thread principale resta libero per tutta la durata.
    const tasks = Array.from({ length: count }, (_, i) => i + 1).map(async (page) => {
      const png = await pool.renderPage(bytes, page, 0.4)
      pages.value.push({
        index: page,
        url: URL.createObjectURL(new Blob([png], { type: 'image/png' })),
      })
    })

    await Promise.all(tasks)
    renderMs.value = performance.now() - start
  } catch (err) {
    error.value = String(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main>
    <h1>pdfrs — anteprima PDF</h1>
    <p>
      Carica un PDF: ogni pagina viene renderizzata in PNG via
      <code>render_page_preview</code>, distribuito su un pool di Web Worker
      (<code>src/worker-pool.js</code>) così il thread principale non si blocca mai e più pagine si
      renderizzano in parallelo.
    </p>

    <input type="file" accept="application/pdf" @change="onFileChange" />

    <p v-if="loading">Rendering in corso…</p>
    <p v-if="error" style="color: crimson">{{ error }}</p>
    <p v-if="renderMs !== null" class="perf">
      {{ sortedPages.length }} pagine renderizzate in
      <strong>{{ renderMs.toFixed(1) }} ms</strong>
      ({{ (renderMs / sortedPages.length).toFixed(1) }} ms/pagina)
    </p>

    <div class="pages">
      <figure v-for="p in sortedPages" :key="p.index">
        <img :src="p.url" :alt="`pagina ${p.index}`" />
        <figcaption>{{ p.index }}</figcaption>
      </figure>
    </div>
  </main>
</template>

<style>
.pages {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.pages img {
  max-width: 160px;
  border: 1px solid #ccc;
  display: block;
}
figcaption {
  text-align: center;
  font-size: 12px;
  color: #666;
}
.perf {
  font-family: monospace;
}
</style>
