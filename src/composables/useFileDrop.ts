import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Accepts files dropped anywhere on the window. `dragging` is true while
 * files are being dragged over it, to show an overlay. Drags that carry no
 * files (like reordering pages inside the grid) are ignored entirely.
 */
export function useFileDrop(onFiles: (files: File[]) => void) {
  const dragging = ref(false)
  // dragenter/dragleave fire for every child element crossed, so a counter
  // (not a boolean) tells when the pointer has really left the window.
  let depth = 0

  const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false

  function onDragEnter(event: DragEvent) {
    if (!carriesFiles(event)) return
    event.preventDefault()
    depth += 1
    dragging.value = true
  }

  function onDragOver(event: DragEvent) {
    if (!carriesFiles(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  function onDragLeave(event: DragEvent) {
    if (!carriesFiles(event)) return
    depth = Math.max(0, depth - 1)
    if (depth === 0) dragging.value = false
  }

  function onDrop(event: DragEvent) {
    if (!carriesFiles(event)) return
    event.preventDefault()
    depth = 0
    dragging.value = false
    const files = Array.from(event.dataTransfer?.files ?? [])
    if (files.length > 0) onFiles(files)
  }

  onMounted(() => {
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
  })

  onUnmounted(() => {
    window.removeEventListener('dragenter', onDragEnter)
    window.removeEventListener('dragover', onDragOver)
    window.removeEventListener('dragleave', onDragLeave)
    window.removeEventListener('drop', onDrop)
  })

  return { dragging }
}
