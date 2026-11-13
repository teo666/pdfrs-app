// Builds the browser extension: the app, built for extension pages, plus
// the extension's own files, once per browser family.
//
//   dist-extension/chrome/   unpacked, for chrome://extensions → "Load unpacked"
//   dist-extension/firefox/  unpacked, for about:debugging → "Load temporary add-on"
//   dist-extension/pdfrs-chrome.zip, pdfrs-firefox.zip   to upload to the stores
//
// Run with `pnpm build:extension`.
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const extension = join(root, 'extension')
const out = join(root, 'dist-extension')
const app = join(out, 'app')

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

// Relative paths (an extension page is a file, not a site's root) and hash
// routing (see src/router/index.ts).
execFileSync('pnpm', ['exec', 'vite', 'build', '--mode', 'extension', '--base', './', '--outDir', app], {
  cwd: root,
  stdio: 'inherit',
})

const base = JSON.parse(readFileSync(join(extension, 'manifest.base.json'), 'utf8'))
const browsers = {
  // Chromium (Chrome, Edge, Brave…): a service worker in the background.
  chrome: { ...base, background: { service_worker: 'background.js' } },
  // Firefox: background scripts, and an id of its own.
  firefox: {
    ...base,
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: {
        id: 'pdfrs@pdfrs.app',
        strict_min_version: '128.0',
        // Firefox asks every add-on to declare what it collects: nothing.
        data_collection_permissions: { required: ['none'] },
      },
    },
  },
}

for (const [browser, manifest] of Object.entries(browsers)) {
  const dir = join(out, browser)
  cpSync(app, dir, { recursive: true })
  for (const item of ['background.js', 'icons', '_locales']) {
    cpSync(join(extension, item), join(dir, item), { recursive: true })
  }
  writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  const zip = join(out, `pdfrs-${browser}.zip`)
  if (existsSync(zip)) rmSync(zip)
  execFileSync('zip', ['-qr', zip, '.'], { cwd: dir })
  console.log(`extension: ${browser} → ${dir} (${zip})`)
}

rmSync(app, { recursive: true, force: true })
