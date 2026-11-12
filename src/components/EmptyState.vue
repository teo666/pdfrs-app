<script setup lang="ts">
import AppIcon from './AppIcon.vue'

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <div class="grid h-full place-content-center justify-items-center gap-3.5 p-6">
    <button
      class="flex w-[min(460px,100%)] cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-line bg-surface px-6 py-12 transition-colors hover:border-accent hover:bg-accent-soft focus-visible:border-accent focus-visible:bg-accent-soft focus-visible:outline-none"
      @click="emit('open')"
    >
      <AppIcon name="upload" :size="36" class="mb-1.5 text-accent" />
      <strong class="text-base">Trascina qui i tuoi PDF o JPEG</strong>
      <span class="text-fg-muted">oppure clicca per sceglierli</span>
    </button>
    <p class="text-xs text-fg-muted">
      I file restano sul tuo computer: vengono elaborati nel browser.
    </p>
  </div>
</template>
