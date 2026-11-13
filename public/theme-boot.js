// Applies the theme before the first paint, so a dark choice doesn't flash
// light while the app loads. A file of its own, not inline: a browser
// extension's pages don't run inline scripts. Mirrors useTheme.ts.
;(function () {
  var choice = 'auto'
  try {
    choice = localStorage.getItem('pdfrs.theme') || 'auto'
  } catch {
    /* no storage: automatic */
  }
  var dark =
    choice === 'dark' ||
    (choice !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()
