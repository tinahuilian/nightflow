import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/ChatView.vue'),
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
    },
  ],
})

// 引导未完成 onboarding 的用户
router.beforeEach((to) => {
  const userStore = useUserStore()
  if (!userStore.isOnboarded && to.name !== 'onboarding') {
    return { name: 'onboarding' }
  }
})

export default router
