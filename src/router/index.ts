// router/index.ts - Routes with Authentication
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  // Auth Routes (Guest only)
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue'),
    meta: {
      title: 'Login - ImReq',
      guest: true
    }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterPage.vue'),
    meta: {
      title: 'Register - ImReq',
      guest: true
    }
  },

  // Root redirect
  {
    path: '/',
    redirect: '/projects'
  },

  // Projects List Page
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsPage.vue'),
    meta: {
      title: 'Projects - ImReq',
      requiresAuth: true
    }
  },

  // Origin Requirements Page
  {
    path: '/projects/:id/origin-requirements',
    name: 'origin-requirements',
    component: () => import('@/views/OriginRequirementPage.vue'),
    meta: {
      title: 'Origin Requirements - ImReq',
      requiresAuth: true
    }
  },

  // Requirements Analysis Page
  {
    path: '/projects/:id/analysis',
    name: 'analysis',
    component: () => import('@/views/RequirementsAnalysis.vue'),
    meta: {
      title: 'Requirements Analysis - ImReq',
      requiresAuth: true
    }
  },

  // Suggestion Page
  {
    path: '/projects/:id/suggestions',
    name: 'suggestions',
    component: () => import('@/views/SuggestionPage.vue'),
    meta: {
      title: 'Suggestions - ImReq',
      requiresAuth: true
    }
  },

  // Compare Page
  {
    path: '/projects/:id/compare',
    name: 'compare',
    component: () => import('@/views/ComparePage.vue'),
    meta: {
      title: 'Compare Requirements - ImReq',
      requiresAuth: true
    }
  },

  // Export/Download Page
  {
    path: '/projects/:id/export',
    name: 'export',
    component: () => import('@/views/DownloadPage.vue'),
    meta: {
      title: 'Export - ImReq',
      requiresAuth: true
    }
  },

  // Internal: Blind model comparison test (not part of main product)
  {
    path: '/model-test',
    name: 'model-test',
    component: () => import('@/views/ModelTestPage.vue'),
    meta: {
      title: 'Model Test — Internal',
      requiresAuth: true
    }
  },

  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/projects'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  // Set page title
  document.title = (to.meta.title as string) || 'ImReq'

  const authStore = useAuthStore()

  // Initialize auth on first load
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Check if route is for guests only (login/register)
  if (to.meta.guest && authStore.isAuthenticated) {
    // Redirect to projects
    return next({ name: 'projects' })
  }

  next()
})

export default router
