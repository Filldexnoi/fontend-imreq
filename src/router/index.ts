// router/index.ts - Corrected Routes
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
      title: 'Projects - ImReq'
    }
  },
  
  // Origin Requirements Page (อัพโหลดไฟล์)
  {
    path: '/projects/:id/origin-requirements',
    name: 'origin-requirements',
    component: () => import('@/views/OriginRequirementPage.vue'),
    meta: {
      title: 'Origin Requirements - ImReq'
    }
  },

  // Requirements Analysis Page (วิเคราะห์ความต้องการ)
  {
    path: '/projects/:id/analysis',
    name: 'analysis',
    component: () => import('@/views/RequirementsAnalysis.vue'),
    meta: {
      title: 'Requirements Analysis - ImReq'
    }
  },

  // Compare Page (เปรียบเทียบ)
  {
    path: '/projects/:id/compare',
    name: 'compare',
    component: () => import('@/views/ComparePage.vue'),
    meta: {
      title: 'Compare Requirements - ImReq'
    }
  },
  
  // Suggestion Page (ข้อเสนอแนะ)
  {
    path: '/projects/:id/suggestions',
    name: 'suggestions',
    component: () => import('@/views/SuggestionPage.vue'),
    meta: {
      title: 'Suggestions - ImReq'
    }
  },
  
  // Export/Download Page (ดาวน์โหลด)
  {
    path: '/projects/:id/export',
    name: 'export',
    component: () => import('@/views/DownloadPage.vue'),
    meta: {
      title: 'Export - ImReq'
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

router.beforeEach((to, from, next) => {
  document.title = (to.meta.title as string) || 'ImReq'
  next()
})

export default router