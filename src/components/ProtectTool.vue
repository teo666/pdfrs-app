<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from './AppButton.vue'
import { useEditorStore } from '@/stores/editor'

/**
 * Makes a password-protected copy of the active document. The password is
 * typed twice (a typo would lock the copy for good) and goes straight to
 * the engine: nothing keeps it.
 */
const store = useEditorStore()

const password = ref('')
const confirm = ref('')
const visible = ref(false)

const mismatch = computed(() => confirm.value !== '' && confirm.value !== password.value)
const ready = computed(() => password.value !== '' && confirm.value === password.value)

async function make() {
  if (!ready.value) return
  await store.protect(password.value)
  password.value = confirm.value = ''
}
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    Crea una copia del documento che si apre solo con la password (cifratura AES-256). La copia
    compare nell’elenco con un lucchetto; l’originale resta com’è, modificabile.
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    Apri un documento per proteggerlo.
  </p>

  <form v-else class="flex flex-col gap-3" @submit.prevent="make">
    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">Password</span>
      <input
        v-model="password"
        :type="visible ? 'text' : 'password'"
        autocomplete="new-password"
        class="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
      />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">Ripeti la password</span>
      <input
        v-model="confirm"
        :type="visible ? 'text' : 'password'"
        autocomplete="new-password"
        class="rounded-md border bg-surface px-2 py-1.5 text-[13px]"
        :class="mismatch ? 'border-danger' : 'border-line'"
        :aria-invalid="mismatch"
      />
    </label>
    <p v-if="mismatch" class="text-xs text-danger" role="alert">Le due password non coincidono.</p>
    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="visible" type="checkbox" class="size-4 accent-accent" />
      Mostra la password
    </label>

    <p class="rounded-md bg-surface-muted p-3 text-xs text-fg-muted">
      Le modifiche non ancora applicate sono comprese. Conserva la password: se la perdi, la copia
      protetta non si può più aprire.
    </p>

    <AppButton
      variant="primary"
      icon="lock"
      class="justify-center"
      :disabled="store.active.busy || !ready"
    >
      Crea copia protetta
    </AppButton>
  </form>
</template>
