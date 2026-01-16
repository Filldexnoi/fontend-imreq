import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/ProjectsPage.vue'),
    meta: {
      title: 'ImReq - Home'
    }
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsPage.vue'),
    meta: {
      title: 'Projects - ImReq'
    }
  },
  {
    path: '/projects/:id/origin-requirements',
    name: 'project-origin-requirements',
    component: () => import('@/views/OriginRequirementPage.vue'),
    meta: {
      title: 'Project - ImReq'
    }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guard for page titles
router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || 'ImReq'
  next()
})

export default router