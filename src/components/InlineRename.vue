<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

const props = defineProps<{ value: string; label: string }>()
const emit = defineEmits<{ save: [name: string]; cancel: [] }>()

const input = useTemplateRef<HTMLInputElement>('input')
let done = false

function save() {
  if (done) return
  done = true
  const name = input.value?.value.trim() ?? ''
  if (name && name !== props.value) emit('save', name)
  else emit('cancel')
}

function cancel() {
  if (done) return
  done = true
  emit('cancel')
}

// Enter or leaving the field saves, Esc gives up. Esc is stopped in the
// template so it doesn't also clear the page selection. (No comment at the
// template's root: it would make a fragment and lose the class from outside.)

// Ready to type over the name, extension left alone ("contratto|.pdf").
onMounted(() => {
  const el = input.value
  if (!el) return
  el.focus()
  const dot = props.value.lastIndexOf('.')
  el.setSelectionRange(0, dot > 0 ? dot : props.value.length)
})
</script>

<template>
  <input
    ref="input"
    :value="value"
    :aria-label="label"
    class="min-w-0 rounded-md border border-accent bg-surface px-1.5 py-0.5 text-fg outline-none focus-visible:outline-none"
    spellcheck="false"
    @keydown.enter.prevent="save"
    @keydown.esc.prevent.stop="cancel"
    @blur="save"
  />
</template>
