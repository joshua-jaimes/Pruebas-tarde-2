import { createApp } from 'vue'
import App from './App.vue'
import { Quasar } from 'quasar'
import router from './routes/index.js'

import 'quasar/src/css/index.sass'

createApp(App)
  .use(Quasar)
  .use(router)
  .mount('#app')




