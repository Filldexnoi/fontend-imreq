<!-- SuggestionsPage.vue - Step 3: View Suggestions with Suggestion Column -->
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
const isGenerating = ref(false)
const expandedRow = ref<string | null>(null)

// Stage tracking
const hasOriginRequirements = computed(() => store.hasRequirements)
const hasAnalysis = computed(() => store.hasAnalysis)
const hasSuggestions = computed(() => suggestions.value.length > 0)

// Load data on mount
onMounted(async () => {
  if (projectId.value) {
    try {
      await store.fetchProjects()
      const foundProject = store.projects.find(p => p.id === projectId.value)
      
      if (foundProject) {
        await store.selectProject(foundProject)
        await store.fetchSuggestions(projectId.value)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }
})

// Sort suggestions by req_id (natural sort)
const sortedSuggestions = computed(() => {
  return [...suggestions.value].sort((a, b) => {
    return a.req_id.localeCompare(b.req_id, undefined, { numeric: true, sensitivity: 'base' })
  })
})

// Filter and pagination
const filteredSuggestions = computed(() => {
  let filtered = [...sortedSuggestions.value]

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

// Actions
const handleBack = () => {
  router.push(`/projects/${projectId.value}/analysis`)
}

const handlePrevious = () => {
  router.push(`/projects/${projectId.value}/analysis`)
}

const handleNext = () => {
  router.push(`/projects/${projectId.value}/compare`)
}

const handleGenerate = async () => {
  isGenerating.value = true

  try {
    await store.generateSuggestionsWithProgress(projectId.value)
    await store.fetchSuggestions(projectId.value)
  } catch (error) {
    console.error('Generation failed:', error)
    alert('Failed to generate suggestions')
  } finally {
    isGenerating.value = false
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const toggleRow = (id: string) => {
  expandedRow.value = expandedRow.value === id ? null : id
}

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
            <span class="text-blue-400 text-sm font-medium">Step 3: Suggested requirements</span>
          </div>
        </div>
      </div>
    </header>

    <div class="flex-1 flex min-h-0 overflow-hidden">
      <!-- Sidebar -->
      <WorkflowSidebar
        :project-id="projectId"
        :has-origin-requirements="hasOriginRequirements"
        :has-analysis="hasAnalysis"
        :has-suggestions="hasSuggestions"
        current-step="suggestions"
      />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col bg-gray-900 min-h-0 overflow-hidden">
        <!-- Empty State -->
        <div v-if="!hasSuggestions" class="flex-1 flex items-center justify-center">
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
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </div>
            <h3 class="text-white text-lg font-semibold mb-2">No suggestions yet</h3>
            <p class="text-gray-400 text-sm mb-6">Please generate suggestions for requirements</p>
            <button
              @click="handleGenerate"
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
            >
              Generate Suggestions
            </button>
          </div>
        </div>

        <!-- Results State -->
        <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Toolbar -->
          <div class="bg-gray-800 px-6 py-4 border-b border-gray-700 flex-shrink-0">
            <div class="flex items-center justify-between gap-4">
              <!-- Left: Info -->
              <span class="text-gray-400 text-sm">
                Showing {{ filteredSuggestions.length }} suggestions
              </span>

              <!-- Right: Search + Navigation buttons -->
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

          <!-- Table Container -->
          <div class="flex-1 min-h-0 overflow-y-auto">
            <table class="w-full table-fixed">
              <thead class="bg-gray-800 sticky top-0 z-10">
                <tr class="border-b border-gray-700">
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 50px;"></th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 100px;">ReqID</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 180px;">Module</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white">Original</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white">AI Suggestion</th>
                  <th class="px-4 py-4 text-center text-sm font-semibold text-white" style="width: 70px;">Score</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <template v-for="sug in paginatedSuggestions" :key="sug.id">
                  <tr
                    @click="toggleRow(sug.id)"
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
                          expandedRow === sug.id ? 'rotate-90' : ''
                        ]"
                      >
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-900 truncate" :title="sug.req_id">{{ sug.req_id }}</td>
                    <td class="px-4 py-4 text-sm text-gray-900 truncate" :title="sug.module">{{ sug.module }}</td>
                    <td class="px-4 py-4 text-sm text-gray-900">
                      <div class="whitespace-pre-wrap break-words">{{ sug.original_requirement }}</div>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-900">
                      <div class="flex items-start gap-2">
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
                          class="text-green-600 flex-shrink-0 mt-0.5"
                        >
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <div class="whitespace-pre-wrap break-words">{{ sug.suggested_requirement }}</div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex justify-center">
                        <span
                          :class="[
                            'px-3 py-1 rounded-full text-sm font-semibold',
                            getScoreBg(sug.original_score),
                            getScoreColor(sug.original_score)
                          ]"
                        >
                          {{ sug.original_score }}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Expanded Row - Improvements Details -->
                  <tr v-if="expandedRow === sug.id" class="bg-gray-50">
                    <td colspan="6" class="px-6 py-4">
                      <div class="space-y-4">
                        <!-- Improvements -->
                        <div>
                          <h4 class="text-sm font-semibold text-gray-700 mb-3">Improvement Details:</h4>
                          <div class="grid grid-cols-2 gap-3">
                            <div
                              v-for="(improvement, criterion) in sug.improvements"
                              :key="criterion"
                              class="bg-blue-50 rounded-lg p-3 border border-blue-200"
                            >
                              <p class="text-sm font-semibold text-blue-700 mb-1">{{ criterion }}</p>
                              <p class="text-sm text-gray-700">{{ improvement }}</p>
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
            <span class="text-gray-400 text-sm ml-2">Total {{ filteredSuggestions.length }} items</span>
          </div>
        </div>
      </main>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isGenerating || store.isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 min-w-[300px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div class="text-center">
          <p class="text-white font-semibold mb-2">Generating suggestions...</p>
          <p v-if="store.suggestionProgress" class="text-gray-400 text-sm">
            {{ store.suggestionProgress.completed || 0 }} / {{ store.suggestionProgress.total || 0 }}
            ({{ Math.round(store.suggestionProgress.percentage || 0) }}%)
          </p>
        </div>
      </div>
    </div>
  </div>
</template>