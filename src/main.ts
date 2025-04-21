import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

declare global {
    interface Window {
      CESIUM_BASE_URL: string
    }
  }
createApp(App).mount('#app')
