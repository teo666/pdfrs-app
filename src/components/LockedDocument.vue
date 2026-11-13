<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
import { useEditorStore, type DocumentState } from '@/stores/editor'

/**
 * A password-protected document, in place of its pages: there are none to
 * show until a copy is unlocked. It can be downloaded as it is.
 */
const props = defineProps<{ doc: DocumentState }>()
const store = useEditorStore()
const { t } = useI18n()

const password = ref('')
const wrong = ref(false)
const field = ref<HTMLInputElement | null>(null)

// Ready to type into; another locked document shown: start over.
onMounted(() => field.value?.focus())
watch(
  () => props.doc.id,
  () => {
    password.value = ''
    wrong.value = false
    field.value?.focus()
  },
)

async function unlock() {
  if (!password.value) return
  wrong.value = !(await store.unlock(password.value))
  if (wrong.value) {
    await nextTick()
    field.value?.select()
  } else {
    password.value = ''
  }
}
</script>

<template>
  <div class="flex h-full items-center justify-center p-6">
    <section
      class="flex w-full max-w-105 flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-8 text-center"
      :aria-label="t('editing.lockedDocument.section', { name: doc.name })"
    >
      <span class="grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
        <AppIcon name="lock" :size="28" />
      </span>
      <h1 class="max-w-full truncate text-base font-semibold" :title="doc.name">{{ doc.name }}</h1>
      <p class="text-[13px] text-fg-muted">
        {{ t('editing.lockedDocument.explanation') }}
      </p>

      <form class="mt-2 flex w-full flex-col gap-2" @submit.prevent="unlock">
        <input
          ref="field"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :placeholder="t('editing.lockedDocument.password')"
          :aria-label="t('editing.lockedDocument.passwordLabel')"
          class="rounded-md border bg-surface px-3 py-2 text-sm"
          :class="wrong ? 'border-danger' : 'border-line'"
          :aria-invalid="wrong"
          @input="wrong = false"
        />
        <p v-if="wrong" class="text-left text-xs text-danger" role="alert">
          {{ t('editing.lockedDocument.wrong') }}
        </p>
        <AppButton
          variant="primary"
          icon="unlock"
          class="justify-center"
          :disabled="doc.busy || !password"
        >
          {{ t('editing.lockedDocument.unlock') }}
        </AppButton>
      </form>
      <AppButton
        type="button"
        icon="download"
        class="w-full justify-center"
        :title="t('editing.lockedDocument.downloadTitle')"
        :disabled="doc.busy"
        @click="store.download()"
      >
        {{ t('editing.lockedDocument.download') }}
      </AppButton>
    </section>
  </div>
</template>
