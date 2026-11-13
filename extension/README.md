# Estensione per browser

L'estensione apre l'editor pdfrs in una scheda: è l'app completa, dentro
l'estensione, e funziona anche senza rete. I file non lasciano il computer.
Non chiede permessi.

## Compilarla

```bash
pnpm build:extension
```

Produce, in `dist-extension/`:

- `chrome/` e `pdfrs-chrome.zip` — per Chrome, Edge, Brave e gli altri browser Chromium;
- `firefox/` e `pdfrs-firefox.zip` — per Firefox (128 o successivo).

Le due cartelle differiscono solo nel `manifest.json`: Chromium vuole un
service worker in background, Firefox degli script e un id
(`browser_specific_settings.gecko.id`).

## Provarla

- **Chrome / Edge**: `chrome://extensions` (o `edge://extensions`) → attiva
  «Modalità sviluppatore» → «Carica estensione non pacchettizzata» →
  scegli `dist-extension/chrome`.
- **Firefox**: `about:debugging#/runtime/this-firefox` → «Carica componente
  aggiuntivo temporaneo» → scegli `dist-extension/firefox/manifest.json`.
  Per controllarla prima di pubblicarla: `npx web-ext lint --source-dir dist-extension/firefox`
  (oggi: nessun errore; un solo avviso, su `innerHTML` nel runtime di Vue).

L'e2e `e2e/extension.spec.ts` la compila e la carica in Chromium da solo.

## Pubblicarla

Da fare a mano, con un account sviluppatore:

- **Chrome Web Store**: carica `pdfrs-chrome.zip` dalla console per
  sviluppatori (serve un account a pagamento una tantum).
- **Microsoft Edge Add-ons**: lo stesso `pdfrs-chrome.zip` da Partner Center.
- **Firefox Add-ons (AMO)**: carica `pdfrs-firefox.zip`; Mozilla lo firma.
  L'id in `browser_specific_settings` va tenuto fisso tra le versioni.

Prima di ogni pubblicazione aggiorna `version` in `extension/manifest.base.json`.

## Come è fatta

- `manifest.base.json` — Manifest V3. La CSP delle pagine ammette
  `'wasm-unsafe-eval'`, senza cui il motore WebAssembly non parte; nessuno
  script inline (il tema iniziale lo applica `public/theme-boot.js`).
- `background.js` — al clic sull'icona apre `index.html` in una nuova scheda.
- `_locales/` — nome e descrizione in cinque lingue (inglese predefinito).
- `icons/` — PNG generati da `icon.svg` con `node scripts/make-extension-icons.mjs`.
- L'app viene compilata con `--mode extension --base ./`: percorsi relativi
  e router con l'hash (`src/router/index.ts`), perché la pagina di
  un'estensione è un file, non un sito.
