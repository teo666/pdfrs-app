# Pubblicare l’estensione negli store

Tutto quello che chiedono Chrome Web Store, Microsoft Edge Add-ons e Firefox Add-ons (AMO). L’invio si fa a mano, dal tuo account sviluppatore.

## Cosa c’è in questa cartella

| File | A cosa serve |
| --- | --- |
| `listing.md` | Riassunto e descrizione in cinque lingue. Nome e descrizione breve li leggono gli store dal manifest. |
| `screenshots/it/`, `screenshots/en/` | Cinque screenshot 1280×800 per lingua. |
| `icon-128.png` | Icona dello store: disegno 96×96 in un quadrato trasparente 128×128, come chiede Chrome. |
| `promo-440x280.png` | Tessera promozionale piccola (Chrome, facoltativa ma consigliata). |
| `marquee-1400x560.png` | Banner grande (Chrome, serve solo se l’estensione viene messa in evidenza). |

Le immagini si rifanno con `node scripts/make-store-images.mjs [documento.pdf]`. Con un PDF usa quello, altrimenti un documento d’esempio generato. Quelle di adesso sono fatte con `ST62T30B.PDF`.

L’informativa sulla privacy è pubblicata con il sito: <https://teo666.github.io/pdfrs-app/privacy.html> (`public/privacy.html`).

## 1. Gli zip

Si prendono dalla release dell’app su GitHub (tag `v<versione>`, vedi il README principale):

- `pdfrs-chrome-<versione>.zip` per Chrome Web Store ed Edge Add-ons;
- `pdfrs-firefox-<versione>.zip` per AMO;
- `pdfrs-source-<versione>.zip`: il sorgente dei due repository con `BUILD.md`, da allegare su AMO.

## 2. Chrome Web Store

Serve un account sviluppatore: <https://chrome.google.com/webstore/devconsole>. L’iscrizione si paga una volta sola.

1. **Nuovo elemento** → carica `pdfrs-chrome-<versione>.zip`.
2. **Scheda dello store**:
   - descrizione: da `listing.md`, per ogni lingua;
   - categoria: Strumenti / Produttività;
   - icona: `icon-128.png`;
   - screenshot: `screenshots/<lingua>/` (ne bastano da uno a cinque);
   - tessera piccola: `promo-440x280.png`; banner: `marquee-1400x560.png`.
3. **Privacy**:
   - *Scopo unico*: «Modificare file PDF nel browser, sul computer dell’utente».
   - *Permessi*: nessuno da giustificare. Il manifest non ne chiede.
   - *Codice remoto*: **No**. Tutto il codice, WebAssembly compreso, è nel pacchetto. `'wasm-unsafe-eval'` nella CSP serve solo a eseguire il WebAssembly incluso.
   - *Uso dei dati*: nessuna categoria raccolta. Spunta le tre dichiarazioni: niente vendita, niente usi estranei, niente credito.
   - *Informativa sulla privacy*: l’indirizzo sopra.
4. **Invia per la revisione**.

## 3. Microsoft Edge Add-ons

Account gratuito su Partner Center: <https://partner.microsoft.com/dashboard/microsoftedge>.

1. **Crea una nuova estensione** → carica lo stesso `pdfrs-chrome-<versione>.zip`.
2. Proprietà: categoria Produttività; informativa sulla privacy (l’indirizzo sopra); sito web <https://teo666.github.io/pdfrs-app/>; supporto <https://github.com/teo666/pdfrs-app/issues>.
3. Scheda: descrizione da `listing.md`, logo `icon-128.png` (Edge accetta anche 300×300), screenshot.
4. **Pubblica**.

## 4. Firefox Add-ons (AMO)

Account gratuito: <https://addons.mozilla.org/developers/>.

1. **Invia un nuovo componente aggiuntivo** → «Su questo sito» → carica `pdfrs-firefox-<versione>.zip`.
2. **Codice sorgente: sì**. Il pacchetto contiene codice compilato e minificato (Vite, wasm-pack), quindi Mozilla chiede il sorgente per rifare la build e confrontarla. Carica `pdfrs-source-<versione>.zip`: `BUILD.md` lì dentro dice strumenti, versioni e comandi.
3. Scheda:
   - nome e riassunto da `listing.md`;
   - categorie: «Strumenti per la produttività» (o «Altro»);
   - licenza: **MIT**;
   - informativa sulla privacy: l’indirizzo sopra;
   - pagina di supporto: GitHub issues.
4. Dopo l’approvazione: descrizione completa e screenshot dalla pagina di modifica della scheda.

L’id dell’estensione (`pdfrs@pdfrs.app`, in `scripts/build-extension.mjs`) non va mai cambiato: è quello che lega le versioni successive.

## Aggiornamenti

Alza `version` in `package.json`, fai il commit, poi crea e pubblica il tag `v<versione>`: la release prepara gli zip nuovi, che carichi come nuova versione negli stessi tre posti. La versione del motore da usare è `pdfrs.ref` in `package.json`.
