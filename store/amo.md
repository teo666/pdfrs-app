# Firefox Add-ons (AMO): testi da incollare

AMO accetta un Markdown ridotto: **grassetto**, *corsivo*, link, elenchi (`-` e `1.`), citazioni (`>`) e blocchi di codice. Non ci sono titoli né HTML. Il riassunto è in testo semplice, al massimo 250 caratteri.

Ogni blocco di codice va incollato così com’è nel campo indicato (su GitHub c’è il pulsante per copiarlo).

## Campi comuni

- **Nome**: `pdfrs — PDF editor` (in italiano `pdfrs — editor PDF`); lo prende dal manifest.
- **Categorie**: Strumenti per la produttività (Productivity), Altro (Other).
- **Pagina web**: https://teo666.github.io/pdfrs-app/
- **Supporto**: https://github.com/teo666/pdfrs-app/issues
- **Licenza**: MIT
- **Informativa sulla privacy**: si può incollare il testo qui sotto (sezione «Privacy»), oppure lasciare il campo vuoto e mettere il link nella descrizione.
- **Codice sorgente**: sì → `pdfrs-source-<versione>.zip` della release.
- **Note per i revisori**: sezione «Note per i revisori» in fondo.

## Italiano

**Riassunto**

````markdown
Editor PDF che gira tutto nel browser: riordina, ruota, firma, unisci, dividi, aggiungi filigrane e numeri di pagina, proteggi con password. I file non lasciano mai il computer.
````

**Descrizione**

````markdown
**pdfrs** è un editor PDF completo che lavora dentro Firefox. I tuoi documenti non vengono caricati da nessuna parte: ogni operazione la fa, sul tuo computer, un motore scritto in Rust e compilato in WebAssembly. Funziona anche senza rete.

**Pagine**

- Riordina, ruota ed elimina le pagine trascinandole
- Estrai pagine in un nuovo documento, o spostale in un altro
- Unisci più PDF e JPEG; dividi ogni N pagine o per intervalli
- Inserisci pagine bianche o le pagine di un altro file

**Firme, testo e immagini**

- Disegna la firma o caricala da un’immagine, poi mettila dove serve, anche uguale su tutte le pagine
- Aggiungi testo vero, selezionabile, e immagini
- Filigrane di testo o d’immagine (*BOZZA*, un logo), sopra o sotto il contenuto
- Numeri di pagina, intestazioni e piè di pagina

**Strumenti**

- Più pagine per foglio e libretto da stampare
- Indice (segnalibri) da vedere e modificare
- Immagini già nel PDF: togli, sostituisci, sposta, ruota, scarica, e alleggerisci il file
- Protezione con password (AES-256) e permessi: stampa, copia, modifica
- Proprietà del documento: titolo, autore e le altre
- Annulla e ripeti ogni modifica, con la cronologia completa

In cinque lingue (italiano, inglese, spagnolo, tedesco, francese), con tema chiaro e scuro.

> **Privacy**: nessun account, nessuna statistica, nessun tracciamento. L’estensione non chiede permessi e non usa la rete. [Informativa completa](https://teo666.github.io/pdfrs-app/privacy.html)

Codice open source (MIT): [pdfrs-app](https://github.com/teo666/pdfrs-app) e il motore [pdfrs](https://github.com/teo666/pdfrs).
````

## English

**Summary**

````markdown
A PDF editor that runs entirely in your browser: reorder, rotate, sign, merge, split, add watermarks and page numbers, protect with a password. Files never leave your computer.
````

**Description**

````markdown
**pdfrs** is a full PDF editor that works inside Firefox. Your documents are never uploaded anywhere: every operation is done on your computer, by an engine written in Rust and compiled to WebAssembly. It works offline too.

**Pages**

- Reorder, rotate and delete pages by dragging them
- Extract pages into a new document, or move them to another one
- Merge PDFs and JPEGs; split every N pages or by ranges
- Insert blank pages, or the pages of another file

**Signatures, text and images**

- Draw your signature or upload it from an image, then place it where it belongs, or the same on every page
- Add real, selectable text, and images
- Text or image watermarks (*DRAFT*, a logo), over or under the content
- Page numbers, headers and footers

**Tools**

- Several pages per sheet, and booklets to print
- The outline (bookmarks), to see and edit
- Images already in the PDF: remove, replace, move, rotate, download, and make the file lighter
- Password protection (AES-256) and permissions: printing, copying, editing
- Document properties: title, author and the rest
- Undo and redo every edit, with the full history

In five languages (Italian, English, Spanish, German, French), with a light and a dark theme.

> **Privacy**: no account, no analytics, no tracking. The extension asks for no permissions and doesn’t use the network. [Full privacy policy](https://teo666.github.io/pdfrs-app/privacy.html)

Open source (MIT): [pdfrs-app](https://github.com/teo666/pdfrs-app) and its engine [pdfrs](https://github.com/teo666/pdfrs).
````

## Español

**Resumen**

````markdown
Un editor de PDF que funciona por completo en el navegador: reordena, gira, firma, une, divide, añade marcas de agua y números de página, protege con contraseña. Los archivos nunca salen de tu ordenador.
````

**Descripción**

````markdown
**pdfrs** es un editor de PDF completo que trabaja dentro de Firefox. Tus documentos no se suben a ningún sitio: cada operación la hace, en tu ordenador, un motor escrito en Rust y compilado a WebAssembly. También funciona sin conexión.

**Páginas**

- Reordena, gira y elimina páginas arrastrándolas
- Extrae páginas a un documento nuevo, o muévelas a otro
- Une varios PDF y JPEG; divide cada N páginas o por intervalos
- Inserta páginas en blanco o las páginas de otro archivo

**Firmas, texto e imágenes**

- Dibuja tu firma o cárgala desde una imagen y colócala donde haga falta, también igual en todas las páginas
- Añade texto real, seleccionable, e imágenes
- Marcas de agua de texto o de imagen (*BORRADOR*, un logotipo), sobre o bajo el contenido
- Números de página, encabezados y pies de página

**Herramientas**

- Varias páginas por hoja y folletos para imprimir
- El índice (marcadores), para ver y editar
- Imágenes del PDF: quitar, sustituir, mover, girar, descargar, y aligerar el archivo
- Protección con contraseña (AES-256) y permisos: imprimir, copiar, modificar
- Propiedades del documento: título, autor y las demás
- Deshacer y rehacer cada cambio, con el historial completo

En cinco idiomas (italiano, inglés, español, alemán y francés), con tema claro y oscuro.

> **Privacidad**: sin cuentas, sin estadísticas, sin seguimiento. La extensión no pide permisos ni usa la red. [Política de privacidad](https://teo666.github.io/pdfrs-app/privacy.html)

Código abierto (MIT): [pdfrs-app](https://github.com/teo666/pdfrs-app) y su motor [pdfrs](https://github.com/teo666/pdfrs).
````

## Deutsch

**Zusammenfassung**

````markdown
Ein PDF-Editor, der vollständig im Browser läuft: Seiten ordnen, drehen, unterschreiben, zusammenführen, teilen, Wasserzeichen und Seitenzahlen hinzufügen, mit Passwort schützen. Die Dateien verlassen nie deinen Computer.
````

**Beschreibung**

````markdown
**pdfrs** ist ein vollständiger PDF-Editor, der in Firefox arbeitet. Deine Dokumente werden nirgendwohin hochgeladen: Jeder Schritt passiert auf deinem Computer, mit einer in Rust geschriebenen und nach WebAssembly kompilierten Engine. Auch offline.

**Seiten**

- Seiten per Ziehen umordnen, drehen und löschen
- Seiten in ein neues Dokument extrahieren oder in ein anderes verschieben
- Mehrere PDFs und JPEGs zusammenführen; alle N Seiten oder nach Bereichen teilen
- Leere Seiten oder die Seiten einer anderen Datei einfügen

**Unterschriften, Text und Bilder**

- Unterschrift zeichnen oder aus einem Bild laden und platzieren, auch gleich auf allen Seiten
- Echten, auswählbaren Text und Bilder hinzufügen
- Wasserzeichen aus Text oder Bild (*ENTWURF*, ein Logo), über oder unter dem Inhalt
- Seitenzahlen, Kopf- und Fußzeilen

**Werkzeuge**

- Mehrere Seiten pro Blatt und Broschüren zum Drucken
- Das Inhaltsverzeichnis (Lesezeichen) ansehen und bearbeiten
- Bilder im PDF: entfernen, ersetzen, verschieben, drehen, herunterladen, und die Datei verkleinern
- Passwortschutz (AES-256) und Berechtigungen: drucken, kopieren, ändern
- Dokumenteigenschaften: Titel, Autor und weitere
- Jede Änderung rückgängig machen und wiederholen, mit vollständigem Verlauf

In fünf Sprachen (Italienisch, Englisch, Spanisch, Deutsch, Französisch), mit hellem und dunklem Design.

> **Datenschutz**: kein Konto, keine Statistiken, kein Tracking. Die Erweiterung verlangt keine Berechtigungen und nutzt kein Netzwerk. [Datenschutzerklärung](https://teo666.github.io/pdfrs-app/privacy.html)

Open Source (MIT): [pdfrs-app](https://github.com/teo666/pdfrs-app) und die Engine [pdfrs](https://github.com/teo666/pdfrs).
````

## Français

**Résumé**

````markdown
Un éditeur PDF qui fonctionne entièrement dans le navigateur : réordonner, faire pivoter, signer, fusionner, diviser, ajouter filigranes et numéros de page, protéger par mot de passe. Les fichiers ne quittent jamais votre ordinateur.
````

**Description**

````markdown
**pdfrs** est un éditeur PDF complet qui fonctionne dans Firefox. Vos documents ne sont envoyés nulle part : chaque opération est faite sur votre ordinateur, par un moteur écrit en Rust et compilé en WebAssembly. Il fonctionne aussi hors ligne.

**Pages**

- Réordonnez, faites pivoter et supprimez des pages en les faisant glisser
- Extrayez des pages dans un nouveau document, ou déplacez-les vers un autre
- Fusionnez des PDF et des JPEG ; divisez toutes les N pages ou par plages
- Insérez des pages blanches ou les pages d’un autre fichier

**Signatures, texte et images**

- Dessinez votre signature ou importez-la depuis une image, puis placez-la où il faut, ou la même sur toutes les pages
- Ajoutez du vrai texte, sélectionnable, et des images
- Filigranes de texte ou d’image (*BROUILLON*, un logo), sur ou sous le contenu
- Numéros de page, en-têtes et pieds de page

**Outils**

- Plusieurs pages par feuille et livrets à imprimer
- La table des matières (signets), à voir et à modifier
- Images du PDF : retirer, remplacer, déplacer, faire pivoter, télécharger, et alléger le fichier
- Protection par mot de passe (AES-256) et autorisations : impression, copie, modification
- Propriétés du document : titre, auteur et les autres
- Annuler et rétablir chaque modification, avec l’historique complet

En cinq langues (italien, anglais, espagnol, allemand, français), avec thème clair et sombre.

> **Confidentialité** : pas de compte, pas de statistiques, pas de suivi. L’extension ne demande aucune autorisation et n’utilise pas le réseau. [Politique de confidentialité](https://teo666.github.io/pdfrs-app/privacy.html)

Code source ouvert (MIT) : [pdfrs-app](https://github.com/teo666/pdfrs-app) et son moteur [pdfrs](https://github.com/teo666/pdfrs).
````

## Privacy

Testo per il campo «Informativa sulla privacy» di AMO, in inglese, che è la lingua predefinita della scheda:

````markdown
**pdfrs collects no data.**

- Your files stay on your computer: the PDFs and images you open are read and processed inside Firefox, by the pdfrs engine compiled to WebAssembly, and never uploaded anywhere.
- The extension asks for no permissions and doesn’t use the network: it already contains everything it needs.
- No accounts, no analytics, no tracking, no ads.
- Only your preferences (language, theme, thumbnail size) are kept, in the extension’s local storage. Signatures you draw stay in the tab and are gone when you close it.

Full policy, in English and Italian: [teo666.github.io/pdfrs-app/privacy.html](https://teo666.github.io/pdfrs-app/privacy.html)
````

## Note per i revisori

Campo «Notes to reviewer», in inglese:

````markdown
The package is built with Vite (the app, minified) and wasm-pack (the PDF engine, Rust compiled to WebAssembly). The attached `pdfrs-source-<version>.zip` holds both repositories exactly as built, plus `BUILD.md`, which gives the tool versions used and the commands:

```
rustup target add wasm32-unknown-unknown
cd pdfrs && ./scripts/build-npm-package.sh && cd ..
cd pdfrs/packages/pdfrs-editor && pnpm install --frozen-lockfile && cd ../../..
cd pdfrs-app && pnpm install --frozen-lockfile && pnpm build:extension
```

The result is `pdfrs-app/dist-extension/pdfrs-firefox.zip`.

- `'wasm-unsafe-eval'` in the CSP is needed only to run the WebAssembly bundled in the package. No code is loaded from anywhere else.
- The one `web-ext lint` warning (`innerHTML`) is in Vue’s runtime.
- To try it: click the toolbar button and open any PDF.
````
