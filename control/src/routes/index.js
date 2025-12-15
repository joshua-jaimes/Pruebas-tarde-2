import { createRouter, createWebHistory } from 'vue-router'

import Home from '../views/Home.vue'
import CamaraTest from '../views/CamaraTest.vue'
import Registro from '../views/Registro.vue'
import Asistencia from '../views/Asistencia.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/camara', name: 'CamaraTest', component: CamaraTest },
  { path: '/registro', name: 'Registro', component: Registro },
  { path: '/asistencia', name: 'Asistencia', component: Asistencia },

  // RUTA PARA REGISTRAR DESDE RECONOCIMIENTO FACIAL
  {
    path: '/registrar-persona',
    name: 'RegistrarPersona',
    component: Registro,
    props: route => ({
      nombreDetectado: route.query.nombre || "",
      imagenBase64: route.query.imagen || ""
    })
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
