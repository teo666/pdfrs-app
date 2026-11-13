import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import EditorView from '@/views/EditorView.vue'

const router = createRouter({
  // In a browser extension the page is a file of the extension, with no
  // server answering other paths: the route lives in the hash instead.
  history:
    import.meta.env.MODE === 'extension'
      ? createWebHashHistory()
      : createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', name: 'editor', component: EditorView }],
})

export default router
