import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { useTheme } from './composables/useTheme'
import { currentLocale, i18n } from './i18n'
import router from './router'

// Keeps <html data-theme> on the theme in use from the start (and when the system's changes).
useTheme()

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
document.documentElement.lang = currentLocale()
app.use(router)

app.mount('#app')
