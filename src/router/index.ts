import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import EditorView from '@/views/EditorView.vue'

const router = createRouter({
  // Built with relative paths (`--base ./`: the browser extension, whose
  // page is a file with no server answering other paths, and the copy in
  // the releases, that works from any folder of any server): the route lives
  // in the hash instead.
  history: import.meta.env.BASE_URL.startsWith('.')
    ? createWebHashHistory()
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'editor', component: EditorView },
    // Any other path (GitHub Pages answers those with 404.html, a copy of
    // the app): back to the editor.
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
