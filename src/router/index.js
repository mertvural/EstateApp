import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Mainpage',
      component: () => import('../views/Mainpage.vue')
    },
    {
      path: '/Appointments',
      name: 'Appointments',
      component: () => import('../views/Appointments.vue')
    },
    {
        path: '/CreateAppointment',
        name: 'CreateAppointment',
        component: () => import('../views/CreateAppointment.vue')
      }
  ]
})

export default router
