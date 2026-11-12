# pdfrs-app

Editor PDF che gira interamente nel browser: i file non lasciano mai il computer. È scritto in Vue 3 con Tailwind CSS v4 e usa il motore Rust/WebAssembly [pdfrs](../pdfrs).

Cosa fa oggi:

- apre più PDF e JPEG, scelti dal pulsante oppure trascinati in qualsiasi punto della finestra;
- mostra le miniature delle pagine, generate solo quando entrano nello schermo e in parallelo su un pool di Web Worker;
- ruota, elimina e ripristina le pagine, e le riordina trascinandole, in modo fluido anche su documenti con migliaia di pagine;
- seleziona più pagine (⌘/Ctrl+clic, ⇧+clic per un intervallo, la casella sulla card, ⌘/Ctrl+A; Esc deseleziona) per ruotarle, eliminarle (anche con Canc) o trascinarle insieme come un blocco, e per **estrarle in un nuovo documento** così come appaiono;
- sposta le pagine in un altro documento trascinandole sul suo nome nella barra laterale (con ⌥/Alt le copia);
- inserisce le pagine di un PDF o JPEG nel documento aperto, dopo la selezione o in fondo;
- unisce più documenti, così come appaiono, nell'ordine in cui li scegli con le caselle numerate della barra laterale;
- mette una **firma** sulle pagine dalla modale di anteprima: la disegni con mouse o dito, oppure carichi un'immagine (lo sfondo bianco diventa trasparente); la sposti, la ridimensioni e la ruoti (maniglia sopra il box: si aggancia agli angoli retti, ⇧ a passi di 15°), con «Uguale su tutte le pagine» la metti ovunque e le copie si modificano insieme (togliendo la spunta su una pagina, quella copia si modifica da sola), si vede anche sulle miniature e finisce nel PDF quando applichi o scarichi. Le firme restano solo nella scheda del browser;
- con un clic su una miniatura apre la pagina in una modale, al 100% (tasto 1) o adattata alla finestra (tasto 0): le frecce (oppure Pag↑/Pag↓, Home/Fine) scorrono le pagine nell'ordine corrente, Esc chiude;
- annulla e ripete ogni modifica (⌘Z / ⇧⌘Z, oppure Ctrl+Z / Ctrl+Y), anche dopo averle applicate;
- applica le modifiche al documento e scarica il PDF risultante.

## Come è fatta

L'app non chiama mai il wasm direttamente. Tutto passa da **`pdfrs-editor`**, un pacchetto TypeScript che sta nel repo pdfrs (`packages/pdfrs-editor`) e non dipende da nessun framework. Contiene:

- il modello `PdfEditor` / `PdfDocument`, con modifiche in sospeso, undo/redo e cache delle anteprime;
- il client verso il Web Worker in cui gira il wasm;
- il pool di worker per le anteprime.

Il modulo wasm viene compilato una volta sola e condiviso da tutti i worker.

In questo repo:

| Percorso | Ruolo |
| --- | --- |
| `src/stores/editor.ts` | Store Pinia: tiene una copia reattiva dello stato del modello (che non è reattivo) e raggruppa per frame le richieste di miniature |
| `src/views/EditorView.vue` | Layout, scorciatoie da tastiera, drop dei file sulla finestra |
| `src/components/` | `PageGrid` (griglia e riordino con drag & drop; vedi il commento in testa per i vincoli di prestazioni), `PageCard`, `PageViewer` (modale al 100% su `<dialog>` nativo), `DocumentList`, `DocumentToolbar`, `EmptyState` |
| `src/assets/main.css` | Token di design per Tailwind (`@theme`): colori, ombre, raggi. Il tema scuro ridefinisce solo le variabili, quindi i componenti non usano `dark:` |
| `src/components/AppButton.vue`, `IconButton.vue` | Pulsanti riusabili: lo stile ripetuto sta in un componente, non in classi `@apply` |
| `src/lib/` | Funzioni pure: riconoscimento dei file dai primi byte, calcolo dell'indice di destinazione del drop |

## Sviluppo

Si usa **pnpm**. Il repo pdfrs deve trovarsi nella stessa cartella di questo (`../pdfrs`): `pdfrs-editor` è collegato con `link:`, e a sua volta usa il pacchetto wasm da `../pdfrs/pkg-npm`.

```sh
# una tantum, e ogni volta che cambia il codice Rust: build del wasm in ../pdfrs/pkg-npm
(cd ../pdfrs && ./scripts/build-npm-package.sh)
(cd ../pdfrs/packages/pdfrs-editor && pnpm install)

pnpm install
pnpm dev          # http://localhost:5173
```

I pacchetti collegati vengono serviti come sorgente e non passano dal pre-bundling di Vite. Per questo, dopo una nuova build del wasm basta ricaricare la pagina: non serve né `pnpm install` né svuotare la cache.

```sh
pnpm test:unit    # Vitest: store (con un finto pdfrs-editor), helper
pnpm test:e2e     # Playwright sul wasm vero, con un dev server dedicato sulla porta 5174
pnpm type-check
pnpm lint
pnpm build
```

La prima volta, Playwright ha bisogno del browser: `pnpm exec playwright install chromium`.
