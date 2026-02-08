<!-- AnalyzedRequirements.vue - Step 2: View Analysis Results -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import WorkflowSidebar from '@/components/WorkflowSidebar.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()

const projectId = computed(() => route.params.id as string)
const project = computed(() => store.currentProject)
const requirements = computed(() => store.analyzedRequirements)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const selectedFilter = ref<'all' | 'low' | 'medium' | 'high'>('all')
const isAnalyzing = ref(false)

// Stage tracking for WorkflowSidebar
const hasOriginRequirements = computed(() => store.hasRequirements)
const hasAnalysis = computed(() => store.hasAnalysis)
const hasSuggestions = computed(() => store.hasSuggestions)
const hasSelected = computed(() => store.hasSelected)

// Load data on mount (no auto-trigger - user must click button)
onMounted(async () => {
  if (projectId.value) {
    try {
      await store.fetchProjects()
      const foundProject = store.projects.find(p => p.id === projectId.value)

      if (foundProject) {
        await store.selectProject(foundProject)
        await store.fetchAnalyzedRequirements(projectId.value)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }
})

// Sort requirements by req_id (natural sort)
const sortedRequirements = computed(() => {
  return [...requirements.value].sort((a, b) => {
    return a.req_id.localeCompare(b.req_id, undefined, { numeric: true, sensitivity: 'base' })
  })
})

// Filter and pagination
const filteredRequirements = computed(() => {
  let filtered = [...sortedRequirements.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(req =>
      req.req_id.toLowerCase().includes(query) ||
      req.module.toLowerCase().includes(query) ||
      req.requirement.toLowerCase().includes(query)
    )
  }

  // Score filter
  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(req => {
      const score = parseInt(req.score.split('/')[0])
      if (selectedFilter.value === 'low') return score <= 3
      if (selectedFilter.value === 'medium') return score >= 4 && score <= 6
      if (selectedFilter.value === 'high') return score >= 7
      return true
    })
  }

  return filtered
})

const paginatedRequirements = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRequirements.value.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(filteredRequirements.value.length / itemsPerPage)
)

const hasRequirements = computed(() => requirements.value.length > 0)

// Statistics
const stats = computed(() => {
  const total = requirements.value.length
  const low = requirements.value.filter(r => parseInt(r.score.split('/')[0]) <= 3).length
  const medium = requirements.value.filter(r => {
    const score = parseInt(r.score.split('/')[0])
    return score >= 4 && score <= 6
  }).length
  const high = requirements.value.filter(r => parseInt(r.score.split('/')[0]) >= 7).length

  const avgScore = requirements.value.reduce((sum, r) => {
    return sum + parseInt(r.score.split('/')[0])
  }, 0) / (total || 1)

  return { total, low, medium, high, avgScore: avgScore.toFixed(1) }
})

// Score color
const getScoreColor = (score: string) => {
  const num = parseInt(score.split('/')[0])
  if (num <= 3) return 'text-red-500'
  if (num <= 6) return 'text-yellow-500'
  return 'text-green-500'
}

const getScoreBg = (score: string) => {
  const num = parseInt(score.split('/')[0])
  if (num <= 3) return 'bg-red-500 bg-opacity-10'
  if (num <= 6) return 'bg-yellow-500 bg-opacity-10'
  return 'bg-green-500 bg-opacity-10'
}

// Navigation
const handlePrevious = () => {
  router.push(`/projects/${projectId.value}/origin-requirements`)
}

const handleNext = () => {
  router.push(`/projects/${projectId.value}/suggestions`)
}

const startAnalysis = async () => {
  isAnalyzing.value = true

  try {
    await store.analyzeProjectWithProgress(projectId.value)
    await store.fetchAnalyzedRequirements(projectId.value)
  } catch (error) {
    console.error('Analysis failed:', error)
    alert('Analysis failed')
  } finally {
    isAnalyzing.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const expandedRow = ref<string | null>(null)

const toggleRow = (reqId: string) => {
  expandedRow.value = expandedRow.value === reqId ? null : reqId
}
</script>

<template>
  <div class="h-screen bg-gray-900 flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="bg-gray-800 px-6 py-4 flex items-center gap-4 border-b border-gray-700 flex-shrink-0">
      <button
        @click="router.push('/projects')"
        class="p-2 hover:bg-gray-700 rounded-lg transition"
        title="Back to Projects"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-white"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </button>
      
      <div class="flex items-center gap-3 flex-1">
        <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <span class="text-white text-sm font-bold">IR</span>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-white">
              {{ project?.title || 'Requirement List' }}
            </h1>
            <span class="text-gray-400 text-sm">•</span>
            <span class="text-blue-400 text-sm font-medium">Step 1: Upload requirements</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <div class="flex-1 flex min-h-0 overflow-hidden">
      <WorkflowSidebar
        :project-id="projectId"
        :has-origin-requirements="hasOriginRequirements"
        :has-analysis="hasAnalysis"
        :has-suggestions="hasSuggestions"
        :has-selected="hasSelected"
        current-step="analysis"
      />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col bg-gray-900 min-h-0 overflow-hidden">
        <!-- Results State (show directly without empty state) -->
        <div v-if="hasRequirements" class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Stats Bar -->
          <div class="bg-gray-800 px-6 py-4 border-b border-gray-700 flex-shrink-0">
            <div class="grid grid-cols-5 gap-4">
              <div class="text-center">
                <p class="text-gray-400 text-xxl mb-1">Total</p>
                <p class="text-white text-2xl font-bold">{{ stats.total }}</p>
              </div>
              <div class="text-center">
                <p class="text-red-400 text-xxl mb-1">Low (1-3)</p>
                <p class="text-red-500 text-2xl font-bold">{{ stats.low }}</p>
              </div>
              <div class="text-center">
                <p class="text-yellow-400 text-xxl mb-1">Medium (4-6)</p>
                <p class="text-yellow-500 text-2xl font-bold">{{ stats.medium }}</p>
              </div>
              <div class="text-center">
                <p class="text-green-400 text-xxl mb-1">High (7-9)</p>
                <p class="text-green-500 text-2xl font-bold">{{ stats.high }}</p>
              </div>
              <div class="text-center">
                <p class="text-gray-400 text-xxl mb-1">Average Score</p>
                <p class="text-blue-400 text-2xl font-bold">{{ stats.avgScore }}/9</p>
              </div>
            </div>
          </div>

          <!-- Toolbar -->
          <div class="bg-gray-800 px-6 py-4 border-b border-gray-700 flex-shrink-0">
            <div class="flex items-center justify-between gap-4">
              <!-- Filters -->
              <div class="flex items-center gap-2">
                <button
                  v-for="filter in [
                    { value: 'all', label: 'All' },
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]"
                  :key="filter.value"
                  @click="selectedFilter = filter.value as any"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm transition',
                    selectedFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  ]"
                >
                  {{ filter.label }}
                </button>
              </div>

              <!-- Right side: Search + Navigation buttons -->
              <div class="flex items-center gap-4">
                <!-- Search -->
                <div class="relative w-64">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search"
                    class="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="absolute left-3 top-2.5 text-gray-400"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>

                <!-- Navigation Buttons -->
                <button
                  @click="handlePrevious"
                  class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Previous
                </button>
                <button
                  @click="handleNext"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto min-h-0">
            <table class="w-full table-fixed">
              <thead class="bg-gray-800 sticky top-0 z-10">
                <tr class="border-b border-gray-700">
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 50px;"></th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 120px;">ReqID</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 200px;">Module</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white">Requirement</th>
                  <th class="px-4 py-4 text-center text-sm font-semibold text-white" style="width: 80px;">Score</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <template v-for="req in paginatedRequirements" :key="req.id">
                  <tr
                    @click="toggleRow(req.id)"
                    class="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <td class="px-4 py-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :class="[
                          'transition-transform',
                          expandedRow === req.id ? 'rotate-90' : ''
                        ]"
                      >
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-900 truncate" :title="req.req_id">{{ req.req_id }}</td>
                    <td class="px-4 py-4 text-sm text-gray-900 truncate" :title="req.module">{{ req.module }}</td>
                    <td class="px-4 py-4 text-sm text-gray-900 whitespace-pre-wrap break-words">{{ req.requirement }}</td>
                    <td class="px-4 py-4">
                      <div class="flex justify-center">
                        <span
                          :class="[
                            'px-3 py-1 rounded-full text-sm font-semibold',
                            getScoreBg(req.score),
                            getScoreColor(req.score)
                          ]"
                        >
                          {{ req.score }}
                        </span>
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Row -->
                  <tr v-if="expandedRow === req.id" class="bg-gray-50">
                    <td colspan="5" class="px-6 py-4">
                      <div class="space-y-4">
                        <!-- Passed Criteria -->
                        <div>
                          <h4 class="text-sm font-semibold text-gray-700 mb-3">
                            Passed Criteria ({{ req.characteristics.length }}):
                          </h4>
                          <div class="grid grid-cols-2 gap-3">
                            <div
                              v-for="char in req.characteristics"
                              :key="char"
                              class="bg-green-50 rounded-lg p-3 border border-green-200"
                            >
                              <p class="text-sm text-green-700">{{ char }}</p>
                            </div>
                          </div>
                        </div>

                        <!-- Failed Criteria -->
                        <div>
                          <h4 class="text-sm font-semibold text-gray-700 mb-3">
                            Failed Criteria ({{ Object.keys(req.evaluation).length }}):
                          </h4>
                          <div class="grid grid-cols-2 gap-3">
                            <div
                              v-for="(reason, criterion) in req.evaluation"
                              :key="criterion"
                              class="bg-red-50 rounded-lg p-3 border border-red-200"
                            >
                              <p class="text-sm font-semibold text-red-700 mb-1">{{ criterion }}</p>
                              <p class="text-sm text-gray-700">{{ reason }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-gray-800 px-6 py-4 border-t border-gray-700 flex items-center justify-end gap-2 flex-shrink-0">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'px-3 py-1 rounded text-sm transition',
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              ]"
            >
              {{ page }}
            </button>
            <span class="text-gray-400 text-sm ml-2">Total {{ filteredRequirements.length }} items</span>
          </div>
        </div>

        <!-- Empty State (no analysis yet - show Start Analysis button) -->
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="text-gray-400"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3 class="text-white text-lg font-semibold mb-2">No analysis yet</h3>
            <p class="text-gray-400 text-sm mb-6">Click the button below to start analyzing requirements</p>
            <button
              @click="startAnalysis"
              :disabled="isAnalyzing"
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition"
            >
              {{ isAnalyzing ? 'Analyzing...' : 'Start Analysis' }}
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isAnalyzing"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 min-w-[300px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div class="text-center">
          <p class="text-white font-semibold mb-2">Analyzing...</p>
          <p v-if="store.analysisProgress" class="text-gray-400 text-sm">
            {{ store.analysisProgress.completed || 0 }} / {{ store.analysisProgress.total || 0 }}
            ({{ Math.round(store.analysisProgress.percentage || 0) }}%)
          </p>
        </div>
      </div>
    </div>
  </div>
</template>