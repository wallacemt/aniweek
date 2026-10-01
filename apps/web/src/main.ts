import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import './style.css'
import App from './App.vue'
import { tooltip } from './directives/tooltip'
import { router } from './router'
import { bindAuthRefreshHandler } from './stores/auth'

const pinia = createPinia()
const app = createApp(App)

app.directive('tooltip', tooltip)
app.use(pinia)
// Precisa vir depois de `app.use(pinia)` (ativa o Pinia) e antes do router
// (o guard global de auth já chama a store na primeira navegação).
bindAuthRefreshHandler()
app.use(router)
app.use(MotionPlugin)

app.mount('#app')
