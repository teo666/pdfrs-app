import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { useTheme } from './composables/useTheme'
import router from './router'

// Keeps <html data-theme> on the theme in use from the start (and when the system's changes).
useTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
