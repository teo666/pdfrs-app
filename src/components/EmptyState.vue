<script setup lang="ts">
import AppIcon from './AppIcon.vue'

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <div class="empty">
    <button class="dropzone" @click="emit('open')">
      <AppIcon name="upload" class="big" />
      <strong>Trascina qui i tuoi PDF o JPEG</strong>
      <span>oppure clicca per sceglierli</span>
    </button>
    <p class="note">I file restano sul tuo computer: vengono elaborati nel browser.</p>
  </div>
</template>

<style scoped>
.empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  height: 100%;
  padding: 24px;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: min(460px, 100%);
  padding: 48px 24px;
  border: 2px dashed var(--border);
  border-radius: 16px;
  background: var(--surface);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.dropzone:hover,
.dropzone:focus-visible {
  border-color: var(--accent);
  background: var(--accent-soft);
  outline: none;
}

.big {
  width: 36px;
  height: 36px;
  margin-bottom: 6px;
  color: var(--accent);
}

strong {
  font-size: 16px;
}

span {
  color: var(--text-muted);
}

.note {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
