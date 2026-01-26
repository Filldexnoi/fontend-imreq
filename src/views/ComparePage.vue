<!-- ComparePage.vue - Compare & Select Requirements -->
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
const suggestions = computed(() => store.suggestedRequirements)

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const isSaving = ref(false)

// Selection state: Map<req_id, 'original' | 'suggested'>
const selections = ref<Map<string, 'original' | 'suggested'>>(new Map())

// Stage tracking
const hasOriginRequirements = computed(() => store.hasRequirements)
const hasAnalysis = computed(() => store.hasAnalysis)
const hasSuggestions = computed(() => store.hasSuggestions)
const hasSelected = computed(() => store.hasSelected)

// Load data on mount
onMounted(async () => {
  if (projectId.value) {
    try {
      await store.fetchProjects()
      const foundProject = store.projects.find(p => p.id === projectId.value)

      if (foundProject) {
        await store.selectProject(foundProject)
        await store.fetchSuggestions(projectId.value)

        // Initialize selections with 'suggested' as default
        suggestions.value.forEach(sug => {
          selections.value.set(sug.req_id, 'suggested')
        })
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }
})

// Filter and pagination
const filteredSuggestions = computed(() => {
  let filtered = [...suggestions.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(sug =>
      sug.req_id.toLowerCase().includes(query) ||
      sug.module.toLowerCase().includes(query) ||
      sug.original_requirement.toLowerCase().includes(query) ||
      sug.suggested_requirement.toLowerCase().includes(query)
    )
  }

  return filtered
})

const paginatedSuggestions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredSuggestions.value.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(filteredSuggestions.value.length / itemsPerPage)
)

// Selection summary
const selectionSummary = computed(() => {
  let originalCount = 0
  let suggestedCount = 0

  selections.value.forEach(choice => {
    if (choice === 'original') originalCount++
    else suggestedCount++
  })

  return { originalCount, suggestedCount, total: selections.value.size }
})

// Actions
const selectRequirement = (reqId: string, type: 'original' | 'suggested') => {
  selections.value.set(reqId, type)
}

const handleConfirm = async () => {
  if (selections.value.size === 0) {
    alert('Please select requirements')
    return
  }

  isSaving.value = true

  try {
    const selectedData = suggestions.value.map(sug => {
      const choice = selections.value.get(sug.req_id) || 'suggested'
      return {
        req_id: sug.req_id,
        module: sug.module,
        requirement: choice === 'suggested' ? sug.suggested_requirement : sug.original_requirement
      }
    })

    await store.saveSelectedRequirements(projectId.value, selectedData)
    router.push(`/projects/${projectId.value}/export`)
  } catch (error: any) {
    console.error('Failed to save selections:', error)
    alert(`Failed to save: ${error.message || 'Unknown error'}`)
  } finally {
    isSaving.value = false
  }
}

const handleBack = () => {
  router.push(`/projects/${projectId.value}/suggestions`)
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Helper functions
const getScoreColor = (score: string | undefined) => {
  if (!score) return 'text-gray-500'
  const parts = score.split('/')
  if (parts.length === 0) return 'text-gray-500'
  const num = parseInt(parts[0])
  if (isNaN(num)) return 'text-gray-500'
  if (num <= 3) return 'text-red-500'
  if (num <= 6) return 'text-yellow-500'
  return 'text-green-500'
}

const getScoreBg = (score: string | undefined) => {
  if (!score) return 'bg-gray-500 bg-opacity-10'
  const parts = score.split('/')
  if (parts.length === 0) return 'bg-gray-500 bg-opacity-10'
  const num = parseInt(parts[0])
  if (isNaN(num)) return 'bg-gray-500 bg-opacity-10'
  if (num <= 3) return 'bg-red-500 bg-opacity-10'
  if (num <= 6) return 'bg-yellow-500 bg-opacity-10'
  return 'bg-green-500 bg-opacity-10'
}

const getSuggestedScore = (sug: any): string => {
  if (sug.suggested_score) return sug.suggested_score

  const originalScore = sug.original_score || '0/9'
  const parts = originalScore.split('/')
  const originalNum = parts.length > 0 ? parseInt(parts[0]) : 0
  const improvementCount = Object.keys(sug.improvements || {}).length
  const suggestedNum = Math.min(isNaN(originalNum) ? 0 : originalNum + improvementCount, 9)

  return `${suggestedNum}/9`
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-800 px-6 py-4 flex items-center gap-4 border-b border-gray-700">
      <button @click="handleBack" class="p-2 hover:bg-gray-700 rounded-lg transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <div class="flex items-center gap-3 flex-1">
        <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <span class="text-white text-sm font-bold">IR</span>
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-white">{{ project?.title || 'Compare & Select' }}</h1>
            <span class="text-gray-400 text-sm">•</span>
            <span class="text-blue-400 text-sm font-medium">Step 4: Compare Version</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex-1 flex min-h-0">
      <!-- Sidebar -->
      <WorkflowSidebar
        :project-id="projectId"
        :has-origin-requirements="hasOriginRequirements"
        :has-analysis="hasAnalysis"
        :has-suggestions="hasSuggestions"
        :has-selected="hasSelected"
        current-step="compare"
      />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col bg-gray-900 min-h-0">
        <!-- Empty State -->
        <div v-if="!hasSuggestions" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                <path d="M18 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                <path d="M9 10h6"/>
                <path d="M9 14h6"/>
              </svg>
            </div>
            <h3 class="text-white text-lg font-semibold mb-2">No suggestions available</h3>
            <p class="text-gray-400 text-sm mb-6">Please generate suggestions first</p>
            <button
              @click="router.push(`/projects/${projectId}/suggestions`)"
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
            >
              Go to Suggestions
            </button>
          </div>
        </div>

        <!-- Compare State -->
        <div v-else class="flex-1 flex flex-col">
          <!-- Info Bar -->
          <div class="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-6">
                <div class="text-center">
                  <p class="text-gray-400 text-xs mb-1">Total</p>
                  <p class="text-white text-xl font-bold">{{ selectionSummary.total }}</p>
                </div>
                <div class="text-center">
                  <p class="text-yellow-400 text-xs mb-1">Original</p>
                  <p class="text-yellow-500 text-xl font-bold">{{ selectionSummary.originalCount }}</p>
                </div>
                <div class="text-center">
                  <p class="text-green-400 text-xs mb-1">Improved</p>
                  <p class="text-green-500 text-xl font-bold">{{ selectionSummary.suggestedCount }}</p>
                </div>
              </div>

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
                  class="absolute left-3 top-2.5 text-gray-400"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>

              <!-- Confirm Button -->
              <button
                @click="handleConfirm"
                :disabled="isSaving"
                class="px-8 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isSaving ? 'Saving...' : 'Confirm Selection' }}
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-auto">
            <table class="min-w-full">
              <thead class="bg-gray-800 sticky top-0 z-10">
                <tr class="border-b border-gray-700">
                  <th class="px-6 py-4 text-left text-sm font-semibold text-white w-32">ReqID</th>
                  <th class="px-6 py-4 text-left text-sm font-semibold text-white w-48">Module</th>
                  <th class="px-6 py-4 text-left text-sm font-semibold text-white">Original Requirement</th>
                  <th class="px-6 py-4 text-center text-sm font-semibold text-white w-24">Score</th>
                  <th class="px-6 py-4 text-left text-sm font-semibold text-white">Suggested Requirement</th>
                  <th class="px-6 py-4 text-center text-sm font-semibold text-white w-24">Score</th>
                  <th class="px-6 py-4 text-center text-sm font-semibold text-white w-40">Select</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr
                  v-for="sug in paginatedSuggestions"
                  :key="sug.id"
                  class="border-b border-gray-200 hover:bg-gray-50"
                >
                  <!-- ReqID -->
                  <td class="px-6 py-4 text-sm text-gray-900 font-medium">{{ sug.req_id }}</td>

                  <!-- Module -->
                  <td class="px-6 py-4 text-sm text-gray-900">{{ sug.module }}</td>

                  <!-- Original Requirement -->
                  <td class="px-6 py-4 text-sm text-gray-700">
                    <div class="max-w-md">
                      {{ sug.original_requirement }}
                    </div>
                  </td>

                  <!-- Original Score -->
                  <td class="px-6 py-4">
                    <div class="flex justify-center">
                      <span
                        :class="[
                          'px-2 py-1 rounded text-xs font-semibold',
                          getScoreBg(sug.original_score),
                          getScoreColor(sug.original_score)
                        ]"
                      >
                        {{ sug.original_score }}
                      </span>
                    </div>
                  </td>

                  <!-- Suggested Requirement -->
                  <td class="px-6 py-4 text-sm text-gray-700 bg-green-50">
                    <div class="max-w-md">
                      {{ sug.suggested_requirement }}
                    </div>
                  </td>

                  <!-- Suggested Score -->
                  <td class="px-6 py-4 bg-green-50">
                    <div class="flex justify-center">
                      <span
                        :class="[
                          'px-2 py-1 rounded text-xs font-semibold',
                          getScoreBg(getSuggestedScore(sug)),
                          getScoreColor(getSuggestedScore(sug))
                        ]"
                      >
                        {{ getSuggestedScore(sug) }}
                      </span>
                    </div>
                  </td>

                  <!-- Radio Selection -->
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-4">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          :name="`select-${sug.req_id}`"
                          :checked="selections.get(sug.req_id) === 'original'"
                          @change="selectRequirement(sug.req_id, 'original')"
                          class="w-4 h-4 text-yellow-600"
                        />
                        <span class="text-xs text-gray-600">Original</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          :name="`select-${sug.req_id}`"
                          :checked="selections.get(sug.req_id) === 'suggested'"
                          @change="selectRequirement(sug.req_id, 'suggested')"
                          class="w-4 h-4 text-green-600"
                        />
                        <span class="text-xs text-gray-600">Improved</span>
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="bg-gray-800 px-6 py-4 border-t border-gray-700 flex items-center justify-end gap-2">
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
            <span class="text-gray-400 text-sm ml-2">Total {{ filteredSuggestions.length }} items</span>
          </div>
        </div>
      </main>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isSaving"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 min-w-[300px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p class="text-white font-semibold">Saving selections...</p>
      </div>
    </div>
  </div>
</template>
