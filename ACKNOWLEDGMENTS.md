# Ringraziamenti

pdfrs esiste grazie al lavoro di chi ha scritto e mantiene le librerie open source su cui si regge. Grazie a tutti loro.

Qui sotto ci sono prima i progetti principali, con quello che fanno nell'app, poi l'elenco completo dei pacchetti con versione e licenza.

## Il motore (Rust, compilato in WebAssembly)

Il codice che legge, modifica e disegna i PDF sta nel repository [pdfrs](https://github.com/teo666/pdfrs) e gira nel browser come WebAssembly.

- **[lopdf](https://github.com/J-F-Liu/lopdf)** (MIT): lettura e scrittura dei PDF, la base di ogni operazione (unire, dividere, ruotare, cifrare…).
- **[hayro](https://github.com/LaurenzV/hayro)** (MIT o Apache-2.0), di Laurenz Stampfl: disegna le pagine per miniature e anteprime, e decodifica le immagini dei PDF, compresi JPEG 2000, JBIG2 e CCITT. Usa **[kurbo](https://github.com/linebender/kurbo)** e **[peniko](https://github.com/linebender/peniko)** di Linebender, e **[skrifa](https://github.com/googlefonts/fontations)** e **read-fonts** di Google Fonts per i caratteri.
- **[image](https://github.com/image-rs/image)**, **[png](https://github.com/image-rs/image-png)** e **[zune-jpeg](https://github.com/etemesi254/zune-image)**: lettura delle foto e salvataggio delle immagini estratte.
- **[wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen)**, **js-sys**, **[serde](https://serde.rs)** e **[serde-wasm-bindgen](https://github.com/RReverser/serde-wasm-bindgen)**: il collegamento tra Rust e JavaScript.
- **[RustCrypto](https://github.com/RustCrypto)** (aes, cbc, sha2, md-5…) e **[rand](https://github.com/rust-random/rand)**: la cifratura AES-256 dei PDF protetti da password.
- **[flate2](https://github.com/rust-lang/flate2-rs)**, **[miniz_oxide](https://github.com/Frommi/miniz_oxide)** e **[brotli-decompressor](https://github.com/dropbox/rust-brotli-decompressor)**: compressione e decompressione dei contenuti dei PDF.
- **[thiserror](https://github.com/dtolnay/thiserror)**, **[nom](https://github.com/rust-bakery/nom)**, **[encoding_rs](https://github.com/hsivonen/encoding_rs)** e gli altri elencati più sotto.

### Dati inclusi nel motore

- **Font standard Foxit**, dal progetto [PDFium](https://pdfium.googlesource.com/pdfium/) (licenza BSD-3-Clause, © 2014 PDFium Authors), inclusi in hayro: servono a disegnare il testo dei PDF che usano i 14 font standard senza incorporarli.
- **CMap di Adobe** (BSD-3-Clause, © 1990-2023 Adobe), inclusi in hayro-cmap: la codifica dei caratteri di molti PDF.
- **Profili colore ICC** (CC0 1.0), inclusi in hayro-interpret.

## L'app

- **[Vue](https://vuejs.org)** (MIT), di Evan You e del team Vue: l'interfaccia.
- **[Pinia](https://pinia.vuejs.org)** (MIT): lo stato dell'editor.
- **[Vue Router](https://router.vuejs.org)** (MIT).
- **[Vue I18n](https://vue-i18n.intlify.dev)** (MIT), del progetto Intlify: le cinque lingue.
- **[Tailwind CSS](https://tailwindcss.com)** (MIT): gli stili.

## Gli strumenti

Non finiscono nell'app, ma senza di loro non ci sarebbe:

- **[Rust](https://www.rust-lang.org)** e **[wasm-pack](https://github.com/wasm-bindgen/wasm-pack)**, per compilare il motore;
- **[Vite](https://vite.dev)** e **[Rolldown](https://rolldown.rs)**, per la build e il server di sviluppo;
- **[TypeScript](https://www.typescriptlang.org)** e **[vue-tsc](https://github.com/vuejs/language-tools)**;
- **[Vitest](https://vitest.dev)**, **[Playwright](https://playwright.dev)** e **[jsdom](https://github.com/jsdom/jsdom)**, per i test;
- **[ESLint](https://eslint.org)**, **[Oxlint e Oxfmt](https://oxc.rs)**, per il controllo e la formattazione del codice;
- **[pnpm](https://pnpm.io)**.

## Elenco completo

Pacchetti alla data del 13 novembre 2026. Le tabelle si rigenerano con:
- `cargo tree -e normal --target wasm32-unknown-unknown` nel repository pdfrs;
- `pnpm licenses list --prod` qui.

### Crate Rust nel motore

| Crate | Versione | Licenza |
| --- | --- | --- |
| [ab_glyph_rasterizer](https://github.com/alexheretic/ab-glyph) | 0.1.10 | Apache-2.0 |
| [adler2](https://github.com/oyvindln/adler2) | 2.0.1 | 0BSD OR MIT OR Apache-2.0 |
| [aes](https://github.com/RustCrypto/block-ciphers) | 0.9.4 | MIT OR Apache-2.0 |
| [alloc-no-stdlib](https://github.com/dropbox/rust-alloc-no-stdlib) | 2.0.4 | BSD-3-Clause |
| [alloc-stdlib](https://github.com/dropbox/rust-alloc-no-stdlib) | 0.2.4 | BSD-3-Clause |
| [arrayvec](https://github.com/bluss/arrayvec) | 0.7.8 | MIT OR Apache-2.0 |
| [bitflags](https://github.com/bitflags/bitflags) | 2.13.2 | MIT OR Apache-2.0 |
| [block-buffer](https://github.com/RustCrypto/utils) | 0.12.1 | MIT OR Apache-2.0 |
| [block-padding](https://github.com/RustCrypto/utils) | 0.4.2 | MIT OR Apache-2.0 |
| [brotli-decompressor](https://github.com/dropbox/rust-brotli-decompressor) | 5.0.3 | BSD-3-Clause OR MIT |
| [bumpalo](https://github.com/fitzgen/bumpalo) | 3.20.3 | MIT OR Apache-2.0 |
| [bytemuck](https://github.com/Lokathor/bytemuck) | 1.25.2 | Zlib OR Apache-2.0 OR MIT |
| [bytemuck_derive](https://github.com/Lokathor/bytemuck) | 1.12.1 | Zlib OR Apache-2.0 OR MIT |
| [byteorder-lite](https://github.com/image-rs/byteorder-lite) | 0.1.0 | Unlicense OR MIT |
| [cbc](https://github.com/RustCrypto/block-modes) | 0.2.1 | MIT OR Apache-2.0 |
| [cfg-if](https://github.com/rust-lang/cfg-if) | 1.0.5 | MIT OR Apache-2.0 |
| [chacha20](https://github.com/RustCrypto/stream-ciphers) | 0.10.2 | MIT OR Apache-2.0 |
| [cipher](https://github.com/RustCrypto/traits) | 0.5.2 | MIT OR Apache-2.0 |
| [color](https://github.com/linebender/color) | 0.3.3 | Apache-2.0 OR MIT |
| [console_error_panic_hook](https://github.com/rustwasm/console_error_panic_hook) | 0.1.7 | Apache-2.0 OR MIT |
| [const-oid](https://github.com/RustCrypto/formats) | 0.10.3 | Apache-2.0 OR MIT |
| [cpubits](https://github.com/RustCrypto/utils) | 0.1.1 | MIT OR Apache-2.0 |
| [crc32fast](https://github.com/srijs/rust-crc32fast) | 1.5.5 | MIT OR Apache-2.0 |
| [crypto-common](https://github.com/RustCrypto/traits) | 0.2.2 | MIT OR Apache-2.0 |
| [digest](https://github.com/RustCrypto/traits) | 0.11.3 | MIT OR Apache-2.0 |
| [ecb](https://github.com/RustCrypto/block-modes) | 0.2.1 | MIT OR Apache-2.0 |
| [encoding_rs](https://github.com/hsivonen/encoding_rs) | 0.8.44 | (Apache-2.0 OR MIT) AND BSD-3-Clause |
| [equivalent](https://github.com/indexmap-rs/equivalent) | 1.0.3 | Apache-2.0 OR MIT |
| [euclid](https://github.com/servo/euclid) | 0.22.14 | MIT OR Apache-2.0 |
| [fastrand](https://github.com/smol-rs/fastrand) | 2.5.0 | Apache-2.0 OR MIT |
| [fdeflate](https://github.com/image-rs/fdeflate) | 0.3.7 | MIT OR Apache-2.0 |
| [fearless_simd](https://github.com/linebender/fearless_simd) | 0.7.0 | Apache-2.0 OR MIT |
| [fearless_simd](https://github.com/linebender/fearless_simd) | 1.2.0 | Apache-2.0 OR MIT |
| [flate2](https://github.com/rust-lang/flate2-rs) | 1.1.11 | MIT OR Apache-2.0 |
| [foldhash](https://github.com/orlp/foldhash) | 0.2.0 | Zlib |
| [font-types](https://github.com/googlefonts/fontations) | 0.12.7 | MIT OR Apache-2.0 |
| [futures-core](https://github.com/rust-lang/futures-rs) | 0.3.34 | MIT OR Apache-2.0 |
| [futures-task](https://github.com/rust-lang/futures-rs) | 0.3.34 | MIT OR Apache-2.0 |
| [futures-util](https://github.com/rust-lang/futures-rs) | 0.3.34 | MIT OR Apache-2.0 |
| [getrandom](https://github.com/rust-random/getrandom) | 0.4.3 | MIT OR Apache-2.0 |
| [guillotiere](https://github.com/nical/guillotiere) | 0.7.0 | MIT OR Apache-2.0 |
| [hashbrown](https://github.com/rust-lang/hashbrown) | 0.17.1 | MIT OR Apache-2.0 |
| [hayro](https://github.com/LaurenzV/hayro) | 0.9.0 | Apache-2.0 OR MIT |
| [hayro-ccitt](https://github.com/LaurenzV/hayro) | 0.5.0 | Apache-2.0 OR MIT |
| [hayro-cmap](https://github.com/LaurenzV/hayro) | 0.1.1 | Apache-2.0 OR MIT |
| [hayro-font](https://github.com/LaurenzV/hayro) | 0.5.0 | Apache-2.0 OR MIT |
| [hayro-interpret](https://github.com/LaurenzV/hayro) | 0.9.0 | Apache-2.0 OR MIT |
| [hayro-jbig2](https://github.com/LaurenzV/hayro) | 0.4.0 | Apache-2.0 OR MIT |
| [hayro-jpeg2000](https://github.com/LaurenzV/hayro) | 0.5.0 | Apache-2.0 OR MIT |
| [hayro-postscript](https://github.com/LaurenzV/hayro) | 0.2.0 | Apache-2.0 OR MIT |
| [hayro-syntax](https://github.com/LaurenzV/hayro) | 0.9.0 | Apache-2.0 OR MIT |
| [hybrid-array](https://github.com/RustCrypto/hybrid-array) | 0.4.15 | MIT OR Apache-2.0 |
| [image](https://github.com/image-rs/image) | 0.25.10 | MIT OR Apache-2.0 |
| [indexmap](https://github.com/indexmap-rs/indexmap) | 2.14.2 | Apache-2.0 OR MIT |
| [inout](https://github.com/RustCrypto/utils) | 0.2.6 | MIT OR Apache-2.0 |
| [itoa](https://github.com/dtolnay/itoa) | 1.0.19 | MIT OR Apache-2.0 |
| [js-sys](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/js-sys) | 0.3.107 | MIT OR Apache-2.0 |
| [kurbo](https://github.com/linebender/kurbo) | 0.13.1 | Apache-2.0 OR MIT |
| [libm](https://github.com/rust-lang/compiler-builtins) | 0.2.16 | MIT |
| [linebender_resource_handle](https://github.com/linebender/raw_resource_handle) | 0.1.1 | Apache-2.0 OR MIT |
| [log](https://github.com/rust-lang/log) | 0.4.35 | MIT OR Apache-2.0 |
| [lopdf](https://github.com/J-F-Liu/lopdf) | 0.47.0 | MIT |
| [md-5](https://github.com/RustCrypto/hashes) | 0.11.0 | MIT OR Apache-2.0 |
| [memchr](https://github.com/BurntSushi/memchr) | 2.8.3 | Unlicense OR MIT |
| [miniz_oxide](https://github.com/Frommi/miniz_oxide/tree/master/miniz_oxide) | 0.8.9 | MIT OR Zlib OR Apache-2.0 |
| [miniz_oxide](https://github.com/Frommi/miniz_oxide/tree/master/miniz_oxide) | 0.9.1 | MIT OR Zlib OR Apache-2.0 |
| [moxcms](https://github.com/awxkee/moxcms) | 0.8.1 | BSD-3-Clause OR Apache-2.0 |
| [multiversion_no_op](https://github.com/hsivonen/multiversion_no_op) | 1.0.0 | Apache-2.0 OR MIT |
| [nom](https://github.com/rust-bakery/nom) | 8.0.0 | MIT |
| [num-traits](https://github.com/rust-num/num-traits) | 0.2.19 | MIT OR Apache-2.0 |
| [once_cell](https://github.com/matklad/once_cell) | 1.21.4 | MIT OR Apache-2.0 |
| [peniko](https://github.com/linebender/peniko) | 0.6.1 | Apache-2.0 OR MIT |
| [phf](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [phf_generator](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [phf_macros](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [phf_shared](https://github.com/rust-phf/rust-phf) | 0.13.1 | MIT |
| [pic-scale](https://github.com/awxkee/pic-scale) | 0.7.12 | BSD-3-Clause OR Apache-2.0 |
| [pin-project-lite](https://github.com/taiki-e/pin-project-lite) | 0.2.17 | Apache-2.0 OR MIT |
| [png](https://github.com/image-rs/image-png) | 0.18.1 | MIT OR Apache-2.0 |
| [polycool](https://github.com/linebender/kurbo) | 0.4.0 | MIT OR Apache-2.0 |
| [proc-macro2](https://github.com/dtolnay/proc-macro2) | 1.0.107 | MIT OR Apache-2.0 |
| [pxfm](https://github.com/awxkee/pxfm) | 0.1.30 | BSD-3-Clause OR Apache-2.0 |
| [quote](https://github.com/dtolnay/quote) | 1.0.47 | MIT OR Apache-2.0 |
| [rand](https://github.com/rust-random/rand) | 0.10.3 | MIT OR Apache-2.0 |
| [rand_core](https://github.com/rust-random/rand_core) | 0.10.1 | MIT OR Apache-2.0 |
| [rangemap](https://github.com/jeffparsons/rangemap) | 1.8.0 | MIT OR Apache-2.0 |
| [read-fonts](https://github.com/googlefonts/fontations) | 0.46.0 | MIT OR Apache-2.0 |
| [rustc-hash](https://github.com/rust-lang/rustc-hash) | 2.1.3 | Apache-2.0 OR MIT |
| [scopeguard](https://github.com/bluss/scopeguard) | 1.2.0 | MIT OR Apache-2.0 |
| [serde](https://github.com/serde-rs/serde) | 1.0.229 | MIT OR Apache-2.0 |
| [serde-wasm-bindgen](https://github.com/RReverser/serde-wasm-bindgen) | 0.6.5 | MIT |
| [serde_core](https://github.com/serde-rs/serde) | 1.0.229 | MIT OR Apache-2.0 |
| [serde_derive](https://github.com/serde-rs/serde) | 1.0.229 | MIT OR Apache-2.0 |
| [sha2](https://github.com/RustCrypto/hashes) | 0.11.1 | MIT OR Apache-2.0 |
| [simd-adler32](https://github.com/mcountryman/simd-adler32) | 0.3.10 | MIT |
| [siphasher](https://github.com/jedisct1/rust-siphash) | 1.0.4 | MIT OR Apache-2.0 |
| [skrifa](https://github.com/googlefonts/fontations) | 0.49.0 | MIT OR Apache-2.0 |
| [slab](https://github.com/tokio-rs/slab) | 0.4.12 | MIT |
| [smallvec](https://github.com/servo/rust-smallvec) | 1.16.5 | MIT OR Apache-2.0 |
| [stable_deref_trait](https://github.com/storyyeller/stable_deref_trait) | 1.2.1 | MIT OR Apache-2.0 |
| [stringprep](https://github.com/sfackler/rust-stringprep) | 0.1.5 | MIT OR Apache-2.0 |
| [syn](https://github.com/dtolnay/syn) | 2.0.119 | MIT OR Apache-2.0 |
| [syn](https://github.com/dtolnay/syn) | 3.0.10 | MIT OR Apache-2.0 |
| [synstructure](https://github.com/mystor/synstructure) | 0.14.0 | MIT |
| [thiserror](https://github.com/dtolnay/thiserror) | 2.0.21 | MIT OR Apache-2.0 |
| [thiserror-impl](https://github.com/dtolnay/thiserror) | 2.0.21 | MIT OR Apache-2.0 |
| [tinyvec](https://github.com/Lokathor/tinyvec) | 1.13.3 | Zlib OR Apache-2.0 OR MIT |
| [typenum](https://github.com/paholg/typenum) | 1.20.1 | MIT OR Apache-2.0 |
| [unicode-bidi](https://github.com/servo/unicode-bidi) | 0.3.18 | MIT OR Apache-2.0 |
| [unicode-ident](https://github.com/dtolnay/unicode-ident) | 1.0.27 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| [unicode-normalization](https://github.com/unicode-rs/unicode-normalization) | 0.1.26 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| [unicode-properties](https://github.com/unicode-rs/unicode-properties) | 0.1.5 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| [vello_common](https://github.com/linebender/vello) | 0.3.0 | Apache-2.0 OR MIT |
| [vello_cpu](https://github.com/linebender/vello) | 0.3.0 | Apache-2.0 OR MIT |
| [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen) | 0.2.130 | MIT OR Apache-2.0 |
| [wasm-bindgen-futures](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/futures) | 0.4.80 | MIT OR Apache-2.0 |
| [wasm-bindgen-macro](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/macro) | 0.2.130 | MIT OR Apache-2.0 |
| [wasm-bindgen-macro-support](https://github.com/wasm-bindgen/wasm-bindgen/tree/main/crates/macro-support) | 0.2.130 | MIT OR Apache-2.0 |
| [wasm-bindgen-shared](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/shared) | 0.2.130 | MIT OR Apache-2.0 |
| [weezl](https://github.com/image-rs/weezl) | 0.2.1 | MIT OR Apache-2.0 |
| [yoke](https://github.com/unicode-org/icu4x) | 0.8.4 | Unicode-3.0 |
| [yoke-derive](https://github.com/unicode-org/icu4x) | 0.8.4 | Unicode-3.0 |
| [zerofrom](https://github.com/unicode-org/icu4x) | 0.1.8 | Unicode-3.0 |
| [zerofrom-derive](https://github.com/unicode-org/icu4x) | 0.1.8 | Unicode-3.0 |
| [zlib-rs](https://github.com/trifectatechfoundation/zlib-rs) | 0.6.8 | Zlib |
| [zune-core](https://github.com/etemesi254/zune-image) | 0.5.3 | MIT OR Apache-2.0 OR Zlib |
| [zune-jpeg](https://github.com/etemesi254/zune-image/tree/dev/crates/zune-jpeg) | 0.5.15 | MIT OR Apache-2.0 OR Zlib |

### Pacchetti JavaScript dell'app

Compresi quelli che servono solo durante la build.

| Pacchetto | Versione | Licenza |
| --- | --- | --- |
| [@babel/helper-string-parser](https://babel.dev/docs/en/next/babel-helper-string-parser) | 7.29.14, 8.1.2 | MIT |
| [@babel/helper-validator-identifier](https://github.com/babel/babel#readme) | 7.29.7, 8.0.6 | MIT |
| [@babel/parser](https://babel.dev/docs/en/next/babel-parser) | 7.29.14, 8.1.2 | MIT |
| [@babel/types](https://babel.dev/docs/en/next/babel-types) | 7.29.14, 8.1.2 | MIT |
| [@intlify/core-base](https://github.com/intlify/vue-i18n/tree/master/packages/core-base#readme) | 11.4.18 | MIT |
| [@intlify/devtools-types](https://github.com/intlify/vue-i18n/tree/master/packages/devtools-types#readme) | 11.4.18 | MIT |
| [@intlify/message-compiler](https://github.com/intlify/vue-i18n/tree/master/packages/message-compiler#readme) | 11.4.18 | MIT |
| [@intlify/shared](https://github.com/intlify/vue-i18n/tree/master/packages/shared#readme) | 11.4.18 | MIT |
| [@jridgewell/gen-mapping](https://github.com/jridgewell/sourcemaps/tree/main/packages/gen-mapping) | 0.3.13 | MIT |
| [@jridgewell/remapping](https://github.com/jridgewell/sourcemaps/tree/main/packages/remapping) | 2.3.5 | MIT |
| [@jridgewell/resolve-uri](https://github.com/jridgewell/resolve-uri#readme) | 3.1.2 | MIT |
| [@jridgewell/sourcemap-codec](https://github.com/jridgewell/sourcemaps/tree/main/packages/sourcemap-codec) | 1.6.0 | MIT |
| [@jridgewell/trace-mapping](https://github.com/jridgewell/sourcemaps/tree/main/packages/trace-mapping) | 0.3.31 | MIT |
| [@rolldown/pluginutils](https://github.com/rolldown/plugins/tree/main/packages/pluginutils#readme) | 1.1.0 | MIT |
| [@types/estree](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/estree) | 1.0.10 | MIT |
| [@vue-macros/common](https://vue-macros.dev) | 3.1.4 | MIT |
| [@vue/compiler-core](https://github.com/vuejs/core/tree/main/packages/compiler-core#readme) | 3.5.45 | MIT |
| [@vue/compiler-dom](https://github.com/vuejs/core/tree/main/packages/compiler-dom#readme) | 3.5.45 | MIT |
| [@vue/compiler-sfc](https://github.com/vuejs/core/tree/main/packages/compiler-sfc#readme) | 3.5.45 | MIT |
| [@vue/compiler-ssr](https://github.com/vuejs/core/tree/main/packages/compiler-ssr#readme) | 3.5.45 | MIT |
| [@vue/devtools-api](https://github.com/vuejs/devtools#readme) | 6.6.4, 8.2.1 | MIT |
| [@vue/devtools-kit](https://github.com/vuejs/devtools#readme) | 8.2.1 | MIT |
| [@vue/devtools-shared](https://github.com/vuejs/devtools#readme) | 8.2.1 | MIT |
| [@vue/reactivity](https://github.com/vuejs/core/tree/main/packages/reactivity#readme) | 3.5.45 | MIT |
| [@vue/runtime-core](https://github.com/vuejs/core/tree/main/packages/runtime-core#readme) | 3.5.45 | MIT |
| [@vue/runtime-dom](https://github.com/vuejs/core/tree/main/packages/runtime-dom#readme) | 3.5.45 | MIT |
| [@vue/server-renderer](https://github.com/vuejs/core/tree/main/packages/server-renderer#readme) | 3.5.45 | MIT |
| [@vue/shared](https://github.com/vuejs/core/tree/main/packages/shared#readme) | 3.5.45 | MIT |
| [acorn](https://github.com/acornjs/acorn) | 8.19.0 | MIT |
| [ast-kit](https://github.com/sxzz/ast-kit#readme) | 2.2.0, 3.0.1 | MIT |
| [ast-walker-scope](https://github.com/sxzz/ast-walker-scope#readme) | 0.10.0 | MIT |
| [birpc](https://github.com/antfu-collective/birpc#readme) | 2.9.0 | MIT |
| [chokidar](https://github.com/paulmillr/chokidar) | 5.0.0 | MIT |
| [confbox](https://github.com/unjs/confbox#readme) | 0.1.8, 0.3.2 | MIT |
| [csstype](https://github.com/frenic/csstype#readme) | 3.2.3 | MIT |
| [entities](https://github.com/fb55/entities#readme) | 7.0.1 | BSD-2-Clause |
| [estree-walker](https://github.com/Rich-Harris/estree-walker#readme) | 2.0.2, 3.0.3 | MIT |
| [exsolve](https://github.com/unjs/exsolve#readme) | 1.2.0 | MIT |
| [fdir](https://github.com/thecodrr/fdir#readme) | 6.5.0 | MIT |
| [hookable](https://github.com/unjs/hookable#readme) | 5.5.3 | MIT |
| [local-pkg](https://github.com/antfu-collective/local-pkg#readme) | 1.2.1 | MIT |
| [magic-string](https://github.com/Rich-Harris/magic-string#readme) | 0.30.21, 1.4.5 | MIT |
| [magic-string-ast](https://github.com/sxzz/magic-string-ast#readme) | 1.0.3 | MIT |
| [mlly](https://github.com/unjs/mlly#readme) | 1.8.2 | MIT |
| [muggle-string](https://github.com/johnsoncodehk/muggle-string#readme) | 0.4.1 | MIT |
| [nanoid](https://github.com/ai/nanoid#readme) | 3.3.20 | MIT |
| [nostics](https://github.com/vercel-labs/nostics#readme) | 1.3.0 | MIT |
| [pathe](https://github.com/unjs/pathe#readme) | 2.0.3 | MIT |
| [perfect-debounce](https://github.com/unjs/perfect-debounce#readme) | 2.1.0 | MIT |
| [picocolors](https://github.com/alexeyraspopov/picocolors#readme) | 1.1.1 | ISC |
| [picomatch](https://github.com/micromatch/picomatch) | 4.0.7 | MIT |
| [pinia](https://pinia.vuejs.org) | 4.1.0 | MIT |
| [pkg-types](https://github.com/unjs/pkg-types#readme) | 1.3.1, 2.4.0 | MIT |
| [postcss](https://postcss.org/) | 8.5.32 | MIT |
| [quansync](https://github.com/quansync-dev/quansync#readme) | 0.2.11 | MIT |
| [readdirp](https://github.com/paulmillr/readdirp) | 5.1.1 | MIT |
| [scule](https://github.com/unjs/scule#readme) | 1.3.0 | MIT |
| [source-map-js](https://github.com/7rulnik/source-map-js) | 1.2.2 | BSD-3-Clause |
| [tinyglobby](https://superchupu.dev/tinyglobby) | 0.2.17 | MIT |
| [ufo](https://github.com/unjs/ufo#readme) | 1.6.4 | MIT |
| [unplugin](https://unplugin.unjs.io) | 3.7.0 | MIT |
| [unplugin-utils](https://github.com/sxzz/unplugin-utils#readme) | 0.3.2 | MIT |
| [vue](https://vuejs.org/) | 3.5.45 | MIT |
| [vue-i18n](https://github.com/intlify/vue-i18n/tree/master/packages/vue-i18n#readme) | 11.4.18 | MIT |
| [vue-router](https://router.vuejs.org) | 5.5.0 | MIT |
| [webpack-virtual-modules](https://github.com/sysgears/webpack-virtual-modules#readme) | 0.6.2 | MIT |
