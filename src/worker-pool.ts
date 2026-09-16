// Pool di Web Worker per il rendering pdfrs: ogni worker inizializza il
// proprio modulo wasm una volta sola, e i task (page_count/render_page_preview)
// vengono distribuiti al primo worker libero, così più pagine si renderizzano
// in parallelo senza mai bloccare il thread principale.
type WorkerRequest =
  | { id: number; type: 'pageCount'; bytes: Uint8Array }
  | { id: number; type: 'renderPage'; bytes: Uint8Array; page: number; scale: number }

type WorkerResult = number | Uint8Array<ArrayBuffer>

interface WorkerResponse {
  id: number
  result?: WorkerResult
  error?: string
}

interface QueuedTask {
  message: WorkerRequest
  resolve: (value: WorkerResult) => void
  reject: (reason: unknown) => void
}

interface PendingTask {
  worker: Worker
  resolve: (value: WorkerResult) => void
  reject: (reason: unknown) => void
}

export function createWorkerPool(size = Math.min(navigator.hardwareConcurrency || 4, 4)) {
  const workers = Array.from(
    { length: size },
    () => new Worker(new URL('./pdfrs.worker.js', import.meta.url), { type: 'module' }),
  )
  const idle = [...workers]
  const queue: QueuedTask[] = []
  const pending = new Map<number, PendingTask>()
  let nextId = 0

  function dequeue() {
    if (idle.length === 0 || queue.length === 0) return
    const worker = idle.pop()
    const task = queue.shift()
    if (!worker || !task) return
    pending.set(task.message.id, { worker, resolve: task.resolve, reject: task.reject })
    worker.postMessage(task.message)
  }

  function handleMessage(worker: Worker) {
    return (event: MessageEvent<WorkerResponse>) => {
      const { id, result, error } = event.data
      const task = pending.get(id)
      if (!task) return
      pending.delete(id)
      idle.push(worker)
      if (error) task.reject(new Error(error))
      else task.resolve(result as WorkerResult)
      dequeue()
    }
  }

  workers.forEach((worker) => {
    worker.addEventListener('message', handleMessage(worker))
    worker.addEventListener('error', (event) => {
      console.error('pdfrs worker error:', event.message)
    })
  })

  function run(type: 'pageCount', payload: { bytes: Uint8Array }): Promise<number>
  function run(
    type: 'renderPage',
    payload: { bytes: Uint8Array; page: number; scale: number },
  ): Promise<Uint8Array<ArrayBuffer>>
  function run(type: WorkerRequest['type'], payload: Record<string, unknown>) {
    return new Promise<WorkerResult>((resolve, reject) => {
      const message = { id: nextId++, type, ...payload } as WorkerRequest
      queue.push({ message, resolve, reject })
      dequeue()
    })
  }

  return {
    pageCount: (bytes: Uint8Array) => run('pageCount', { bytes }),
    renderPage: (bytes: Uint8Array, page: number, scale: number) =>
      run('renderPage', { bytes, page, scale }),
    terminate: () => workers.forEach((worker) => worker.terminate()),
  }
}
