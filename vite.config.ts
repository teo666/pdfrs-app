import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, searchForWorkspaceRoot } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// The pdfrs repo, sibling of this one: "pdfrs-editor" is linked from
// ../pdfrs/packages/pdfrs-editor, and through it the wasm package from
// ../pdfrs/pkg-npm.
const pdfrsRepo = fileURLToPath(new URL('../pdfrs', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Linked packages outside this project are served as source (never
    // pre-bundled, so a wasm-pack rebuild shows up without clearing any
    // cache), but the dev server's file-system guard must allow them.
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), pdfrsRepo],
    },
  },
})
