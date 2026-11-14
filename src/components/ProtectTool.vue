<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PdfPermissions } from 'pdfrs-editor'

import AppButton from './AppButton.vue'
import PermissionsNote from './PermissionsNote.vue'
import { ALL_ALLOWED, PERMISSIONS } from '@/lib/permissions'
import { useEditorStore } from '@/stores/editor'

/**
 * Makes a password-protected copy of the active document. The password is
 * typed twice (a typo would lock the copy for good) and goes straight to
 * the engine: nothing keeps it.
 *
 * It can also restrict what that password allows (printing, copying...).
 * Restrictions need a second password, different from the first, which
 * opens the file with everything allowed: with the same one for both they
 * would mean nothing. They start as the file's own, when it has any.
 */
const store = useEditorStore()
const { t } = useI18n()

const password = ref('')
const confirm = ref('')
const ownerPassword = ref('')
const visible = ref(false)
const allowed = reactive<PdfPermissions>({ ...ALL_ALLOWED })

watch(
  () => store.active?.id,
  (id) => {
    if (id !== undefined) void store.loadPermissions(id)
  },
  { immediate: true },
)
// The file's own restrictions, once known, are where the boxes start.
watch(
  () => store.active?.permissions,
  (permissions) => Object.assign(allowed, permissions ?? ALL_ALLOWED),
  { immediate: true },
)

// No printing means no high-quality printing either: the box says so, and
// comes back on with printing.
watch(
  () => allowed.print,
  (print) => (allowed.printHighQuality = print),
)

const restricted = computed(() => PERMISSIONS.some((key) => !allowed[key]))
const mismatch = computed(() => confirm.value !== '' && confirm.value !== password.value)
const ownerSame = computed(() => ownerPassword.value !== '' && ownerPassword.value === password.value)
const ready = computed(
  () =>
    password.value !== '' &&
    confirm.value === password.value &&
    (!restricted.value || (ownerPassword.value !== '' && !ownerSame.value)),
)

async function make() {
  if (!ready.value) return
  await store.protect(
    password.value,
    restricted.value ? { ownerPassword: ownerPassword.value, permissions: { ...allowed } } : {},
  )
  password.value = confirm.value = ownerPassword.value = ''
}
</script>

<template>
  <p class="text-[13px] text-fg-muted">
    {{ t('tools.protect.intro') }}
  </p>

  <p v-if="!store.active" class="rounded-md bg-surface-muted p-3 text-[13px] text-fg-muted">
    {{ t('tools.protect.noDocument') }}
  </p>

  <form v-else class="flex flex-col gap-3" @submit.prevent="make">
    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">{{ t('tools.protect.password') }}</span>
      <input
        v-model="password"
        :type="visible ? 'text' : 'password'"
        autocomplete="new-password"
        class="rounded-md border border-line bg-surface px-2 py-1.5 text-[13px]"
      />
    </label>
    <label class="flex flex-col gap-1.5">
      <span class="text-xs font-semibold text-fg-muted">{{ t('tools.protect.repeat') }}</span>
      <input
        v-model="confirm"
        :type="visible ? 'text' : 'password'"
        autocomplete="new-password"
        class="rounded-md border bg-surface px-2 py-1.5 text-[13px]"
        :class="mismatch ? 'border-danger' : 'border-line'"
        :aria-invalid="mismatch"
      />
    </label>
    <p v-if="mismatch" class="text-xs text-danger" role="alert">
      {{ t('tools.protect.mismatch') }}
    </p>
    <label class="flex cursor-pointer items-center gap-2 text-[13px]">
      <input v-model="visible" type="checkbox" class="size-4 accent-accent" />
      {{ t('tools.protect.show') }}
    </label>

    <PermissionsNote :permissions="store.active.permissions" :advice="t('tools.protect.currentAdvice')" />

    <fieldset class="flex flex-col gap-1.5">
      <legend class="mb-1.5 text-xs font-semibold text-fg-muted">
        {{ t('tools.protect.allowed') }}
      </legend>
      <label
        v-for="key in PERMISSIONS"
        :key="key"
        class="flex cursor-pointer items-center gap-2 text-[13px] has-disabled:cursor-default has-disabled:text-fg-muted"
        :class="key === 'printHighQuality' ? 'pl-6' : ''"
      >
        <input
          v-model="allowed[key]"
          type="checkbox"
          class="size-4 accent-accent"
          :disabled="key === 'printHighQuality' && !allowed.print"
        />
        {{ t(`tools.protect.permissions.${key}`) }}
      </label>
    </fieldset>

    <template v-if="restricted">
      <label class="flex flex-col gap-1.5">
        <span class="text-xs font-semibold text-fg-muted">{{ t('tools.protect.ownerPassword') }}</span>
        <input
          v-model="ownerPassword"
          :type="visible ? 'text' : 'password'"
          autocomplete="new-password"
          class="rounded-md border bg-surface px-2 py-1.5 text-[13px]"
          :class="ownerSame ? 'border-danger' : 'border-line'"
          :aria-invalid="ownerSame"
          :aria-describedby="ownerSame ? 'owner-same' : 'owner-hint'"
        />
      </label>
      <p v-if="ownerSame" id="owner-same" class="text-xs text-danger" role="alert">
        {{ t('tools.protect.ownerSame') }}
      </p>
      <p v-else id="owner-hint" class="text-xs text-fg-muted">{{ t('tools.protect.ownerHint') }}</p>
      <p class="rounded-md bg-surface-muted p-3 text-xs text-fg-muted">
        {{ t('tools.protect.restrictionsNote') }}
      </p>
    </template>

    <p class="rounded-md bg-surface-muted p-3 text-xs text-fg-muted">
      {{ t('tools.protect.note') }}
    </p>

    <AppButton
      variant="primary"
      icon="lock"
      class="justify-center"
      :disabled="store.active.busy || !ready"
    >
      {{ t('tools.protect.submit') }}
    </AppButton>
  </form>
</template>
