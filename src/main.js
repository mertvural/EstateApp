import { createApp } from 'vue'
import '@vuepic/vue-datepicker/dist/main.css'
import 'vue-select/dist/vue-select.css'
import 'vue-loading-overlay/dist/css/index.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.min.css"
import "bootstrap"
import "../src/assets/global.css"
import router from "./router"
import App from './App.vue'
createApp(App).use(router).mount('#app')