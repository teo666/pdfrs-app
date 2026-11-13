// The toolbar button opens the editor - the extension's own page - in a new
// tab. Nothing else: no permissions, no access to any web page. (Bringing an
// already open editor tab to the front would need the "tabs" permission,
// which browsers present as reading the browsing history.)
const api = globalThis.browser ?? globalThis.chrome

api.action.onClicked.addListener(() => {
  api.tabs.create({ url: api.runtime.getURL('index.html') })
})
