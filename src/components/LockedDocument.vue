<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

import AppButton from './AppButton.vue'
import AppIcon from './AppIcon.vue'
import { useEditorStore, type DocumentState } from '@/stores/editor'

/**
 * A password-protected document, in place of its pages: there are none to
 * show until a copy is unlocked. It can be downloaded as it is.
 */
const props = defineProps<{ doc: DocumentState }>()
const store = useEditorStore()

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
  <div class="grid h-full place-content-center p-6">
    <section
      class="flex w-[min(420px,100%)] flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-8 text-center"
      :aria-label="`${doc.name}, protetto da password`"
    >
      <span class="grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
        <AppIcon name="lock" :size="28" />
      </span>
      <h1 class="max-w-full truncate text-base font-semibold" :title="doc.name">{{ doc.name }}</h1>
      <p class="text-[13px] text-fg-muted">
        È protetto da password. Per vederlo o modificarlo, sbloccalo: ne nasce una copia senza
        password, accanto a questo.
      </p>

      <form class="mt-2 flex w-full flex-col gap-2" @submit.prevent="unlock">
        <input
          ref="field"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Password"
          aria-label="Password del documento"
          class="rounded-md border bg-surface px-3 py-2 text-sm"
          :class="wrong ? 'border-danger' : 'border-line'"
          :aria-invalid="wrong"
          @input="wrong = false"
        />
        <p v-if="wrong" class="text-left text-xs text-danger" role="alert">
          Password errata: riprova.
        </p>
        <AppButton
          variant="primary"
          icon="unlock"
          class="justify-center"
          :disabled="doc.busy || !password"
        >
          Sblocca
        </AppButton>
      </form>
      <AppButton
        type="button"
        icon="download"
        class="w-full justify-center"
        title="Scarica il PDF protetto, così com’è"
        :disabled="doc.busy"
        @click="store.download()"
      >
        Scarica protetto
      </AppButton>
    </section>
  </div>
</template>
