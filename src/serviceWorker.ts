/**
 * Registers the service worker that keeps the app for offline use (sw.js,
 * written by the build: see vite.config.ts). Only in a build of the website:
 * the dev server has no sw.js, and the browser extension is already all on
 * the computer.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || import.meta.env.MODE === 'extension') return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((err: unknown) => console.warn('pdfrs: offline copy not available', err))
  })
}
