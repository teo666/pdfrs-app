<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'
import IconButton from './IconButton.vue'
import InlineRename from './InlineRename.vue'
import { pickFiles } from '@/lib/files'
import { useEditorStore, type DocumentState } from '@/stores/editor'

const props = defineProps<{ doc: DocumentState }>()
const { t } = useI18n()
const store = useEditorStore()

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

/** The title is being edited in place. */
const renaming = ref(false)
// Another document opened meanwhile: drop the edit rather than rename the wrong one.
watch(
  () => props.doc.id,
  () => (renaming.value = false),
)

async function insert() {
  const files = await pickFiles()
  if (files.length > 0) await store.insertFiles(files)
}

const selected = computed(() => props.doc.selection.size)
const allSelected = computed(() => selected.value === props.doc.pages.length)
/** The selection's delete button restores instead when every selected page is already marked. */
/** Whether any selected page has a rotation to take away. */
const selectionRotated = computed(() =>
  props.doc.pages.some((p) => props.doc.selection.has(p.id) && p.pendingRotation !== 0),
)

const selectionAllMarked = computed(
  () =>
    selected.value > 0 &&
    props.doc.pages.every((p) => !props.doc.selection.has(p.id) || p.markedForDeletion),
)

const summary = computed(() => {
  const total = props.doc.pages.length
  const deleted = props.doc.pages.filter((p) => p.markedForDeletion).length
  return deleted > 0
    ? t('app.toolbar.summaryDeleted', { deleted }, total)
    : t('app.toolbar.summary', total)
})
</script>

<template>
  <div
    class="sticky top-0 z-10 flex items-center flex-wrap gap-x-4 gap-y-2 border-b border-line bg-canvas/88 px-6 py-3 backdrop-blur-md @max-md:px-4"
  >
    <!-- Wraps on the width of the workspace (the @container in EditorView), not of the window. -->
    <div class="min-w-0 flex-1 @max-2xl:basis-full">
      <InlineRename
        v-if="renaming"
        class="w-full max-w-md text-base font-semibold"
        :value="doc.name"
        :label="t('app.toolbar.newName', { name: doc.name })"
        @save="(name) => (store.rename(doc.id, name), (renaming = false))"
        @cancel="renaming = false"
      />
      <div v-else class="group/title flex min-w-0 items-center gap-1">
        <h1 class="truncate text-base font-semibold" :title="doc.name" @dblclick="renaming = true">
          {{ doc.name }}
        </h1>
        <IconButton
          icon="pen"
          :label="t('app.toolbar.rename', { name: doc.name })"
          size="sm"
          class="opacity-0 group-hover/title:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
          :title="t('app.toolbar.renameHint')"
          @click="renaming = true"
        />
      </div>
      <p class="text-xs text-fg-muted">
        {{ summary }}
        <span v-if="doc.hasPendingChanges" class="text-warning">{{
          t('app.toolbar.pending')
        }}</span>
      </p>
    </div>

    <div class="flex items-center gap-1.5">
      <IconButton
        icon="undo"
        :label="t('app.toolbar.undo')"
        :title="t('app.toolbar.undoTitle', { shortcut: `${mod}Z` })"
        :disabled="!doc.canUndo || doc.busy"
        @click="store.undo()"
      />
      <IconButton
        icon="redo"
        :label="t('app.toolbar.redo')"
        :title="t('app.toolbar.redoTitle', { shortcut: isMac ? '⇧⌘Z' : 'Ctrl+Y' })"
        :disabled="!doc.canRedo || doc.busy"
        @click="store.redo()"
      />
    </div>

    <div class="flex items-center gap-1.5">
      <AppButton
        icon="plus"
        :title="
          doc.selection.size ? t('app.toolbar.insertAfterSelection') : t('app.toolbar.insertAtEnd')
        "
        :disabled="doc.busy"
        @click="insert"
      >
        {{ t('app.toolbar.insert') }}
      </AppButton>
      <AppButton
        icon="check"
        :title="t('app.toolbar.applyTitle')"
        :disabled="!doc.hasPendingChanges || doc.busy"
        @click="store.commit()"
      >
        {{ t('app.toolbar.apply') }}
      </AppButton>
      <AppButton
        variant="primary"
        icon="download"
        :title="t('app.toolbar.downloadTitle')"
        :disabled="doc.busy"
        @click="store.download()"
      >
        {{ t('app.toolbar.download') }}
      </AppButton>
    </div>

    <!-- Actions on the selected pages, while there are any. -->
    <div
      v-if="selected > 0"
      class="flex basis-full flex-wrap items-center gap-x-3 gap-y-2 rounded-card bg-accent-soft px-3 py-2"
      role="toolbar"
      :aria-label="t('app.toolbar.selectionActions')"
    >
      <span class="font-semibold text-accent">
        {{ t('app.toolbar.selected', selected) }}
      </span>
      <button
        v-if="!allSelected"
        class="cursor-pointer text-accent underline-offset-2 hover:underline"
        @click="store.selectAll()"
      >
        {{ t('app.toolbar.selectAll') }}
      </button>
      <button
        class="cursor-pointer text-accent underline-offset-2 hover:underline"
        :title="t('app.toolbar.deselectTitle')"
        @click="store.clearSelection()"
      >
        {{ t('app.toolbar.deselect') }}
      </button>

      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <IconButton
          icon="rotate-left"
          :label="t('app.toolbar.rotateLeft')"
          :disabled="doc.busy"
          @click="store.rotateSelected(-90)"
        />
        <IconButton
          icon="rotate-right"
          :label="t('app.toolbar.rotateRight')"
          :disabled="doc.busy"
          @click="store.rotateSelected(90)"
        />
        <IconButton
          v-if="selectionRotated"
          icon="rotate-reset"
          :label="t('app.toolbar.resetRotation')"
          :disabled="doc.busy"
          @click="store.resetRotationSelected()"
        />
        <AppButton
          :icon="selectionAllMarked ? 'restore' : 'trash'"
          :title="selectionAllMarked ? undefined : t('app.toolbar.deleteTitle')"
          :disabled="doc.busy"
          @click="store.toggleDeleteSelected()"
        >
          {{ selectionAllMarked ? t('app.toolbar.restore') : t('app.toolbar.delete') }}
        </AppButton>
        <AppButton
          icon="file-plus"
          :title="t('app.toolbar.extractTitle')"
          :disabled="doc.busy"
          @click="store.extractSelected()"
        >
          {{ t('app.toolbar.extract') }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
