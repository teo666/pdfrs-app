import { onMounted, onUnmounted, ref, type ShallowRef } from 'vue'

// One IntersectionObserver shared by every caller instead of one per
// element: a document with a thousand pages means a thousand cards.
const callbacks = new WeakMap<Element, (visible: boolean) => void>()
let observer: IntersectionObserver | null = null

function sharedObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) callbacks.get(entry.target)?.(entry.isIntersecting)
    },
    // "Visible" starts a little before the element actually scrolls in.
    { rootMargin: '300px 0px' },
  )
  return observer
}

/** True while the element is on screen (or about to be). */
export function useVisibility(target: Readonly<ShallowRef<Element | null>>) {
  const visible = ref(false)
  let observed: Element | null = null

  onMounted(() => {
    observed = target.value
    if (!observed) return
    callbacks.set(observed, (value) => (visible.value = value))
    sharedObserver().observe(observed)
  })

  onUnmounted(() => {
    if (!observed) return
    sharedObserver().unobserve(observed)
    callbacks.delete(observed)
  })

  return visible
}
