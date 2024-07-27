import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      component: () => import('@/views/BaseView.vue'),
      name: 'Base',
      path: '/',
    },
    {
      component: () => import('@/views/StressView.vue'),
      name: 'Stress',
      path: '/stress',
    },
  ],
})

export default router
