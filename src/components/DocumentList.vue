<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import IconButton from './IconButton.vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <aside class="flex flex-col gap-1 overflow-y-auto border-r border-line bg-surface px-2.5 py-3.5">
    <div class="flex items-center justify-between px-1.5 pb-1.5">
      <h2 class="text-xs font-semibold tracking-wider text-fg-muted uppercase">Documenti</h2>
      <IconButton icon="plus" label="Apri file" @click="emit('open')" />
    </div>

    <ul v-if="store.documents.length" class="flex flex-col gap-0.5">
      <li
        v-for="doc in store.documents"
        :key="doc.id"
        class="group flex items-center rounded-md"
        :class="doc.id === store.activeId ? 'bg-accent-soft text-accent' : 'hover:bg-surface-muted'"
      >
        <button
          class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pr-1 pl-2 text-left"
          :aria-current="doc.id === store.activeId"
          @click="store.select(doc.id)"
        >
          <AppIcon name="file" />
          <span class="flex-1 truncate" :title="doc.name">{{ doc.name }}</span>
          <span class="flex items-center gap-1.5 text-xs text-fg-muted">
            <span
              v-if="doc.hasPendingChanges"
              class="size-[7px] rounded-full bg-warning"
              title="Modifiche non applicate"
            />
            {{ doc.pages.length }}
          </span>
        </button>
        <IconButton
          icon="close"
          :label="`Chiudi ${doc.name}`"
          size="sm"
          class="mr-1 focus-visible:opacity-100"
          :class="doc.id === store.activeId ? '' : 'opacity-0 group-hover:opacity-100'"
          @click="store.close(doc.id)"
        />
      </li>
    </ul>
    <p v-else class="mx-2 my-1 text-[13px] text-fg-muted">Nessun documento aperto.</p>

    <p v-if="store.loading" class="mx-2 my-1 text-[13px] text-fg-muted">Apertura in corso…</p>
  </aside>
</template>
