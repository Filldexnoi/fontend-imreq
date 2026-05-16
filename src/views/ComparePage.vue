<!-- ComparePage.vue - Compare & Select Requirements -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import WorkflowSidebar from '@/components/WorkflowSidebar.vue'
import TextDiff from '@/components/TextDiff.vue'

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

// Selection state: Map<req_id, 'original' | 'suggested' | 'custom'>
const selections = ref<Map<string, 'original' | 'suggested' | 'custom'>>(new Map())
const customTexts = ref<Map<string, string>>(new Map())
const editingReqId = ref<string | null>(null)
const editingText = ref('')

// Stage tracking
const hasOriginRequirements = computed(() => store.hasRequirements)
const hasAnalysis = computed(() => store.hasAnalysis)
const hasSuggestions = computed(() => store.hasSuggestions)
const hasSelected = computed(() => store.hasSelected)
const hasModuleData = computed(() => suggestions.value.some(s => s.module && s.module.trim() !== ''))

// Load data on mount
onMounted(async () => {
  if (projectId.value) {
    try {
      await store.fetchProjects()
      const foundProject = store.projects.find(p => p.id === projectId.value)

      if (foundProject) {
        await store.selectProject(foundProject)
        await store.fetchSuggestions(projectId.value)
        await store.fetchSelectedRequirements(projectId.value)

        const savedMap = new Map(store.selectedRequirements.map((r: any) => [r.req_id, r.requirement]))
        suggestions.value.forEach(sug => {
          const saved = savedMap.get(sug.req_id)
          if (saved !== undefined) {
            if (saved === sug.original_requirement) {
              selections.value.set(sug.req_id, 'original')
            } else if (saved === (sug.suggested_requirement || sug.original_requirement)) {
              selections.value.set(sug.req_id, 'suggested')
            } else {
              selections.value.set(sug.req_id, 'custom')
              customTexts.value.set(sug.req_id, saved)
            }
          } else {
            selections.value.set(sug.req_id, 'suggested')
          }
        })
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
      (sug.suggested_requirement ?? '').toLowerCase().includes(query)
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
  let customCount = 0

  selections.value.forEach(choice => {
    if (choice === 'original') originalCount++
    else if (choice === 'custom') customCount++
    else suggestedCount++
  })

  return { originalCount, suggestedCount, customCount, total: selections.value.size }
})

// Actions
const selectRequirement = (reqId: string, type: 'original' | 'suggested') => {
  selections.value = new Map(selections.value).set(reqId, type)
  if (editingReqId.value === reqId) editingReqId.value = null
}

const startEdit = (sug: any) => {
  const current = selections.value.get(sug.req_id) || 'suggested'
  if (current === 'custom' && customTexts.value.has(sug.req_id)) {
    editingText.value = customTexts.value.get(sug.req_id)!
  } else if (current === 'original') {
    editingText.value = sug.original_requirement
  } else {
    editingText.value = sug.suggested_requirement || sug.original_requirement
  }
  editingReqId.value = sug.req_id
}

const saveEdit = (reqId: string) => {
  const text = editingText.value.trim()
  if (text) {
    customTexts.value = new Map(customTexts.value).set(reqId, text)
    selections.value = new Map(selections.value).set(reqId, 'custom')
  }
  editingReqId.value = null
}

const cancelEdit = () => {
  editingReqId.value = null
}

const handleConfirm = async () => {
  if (selections.value.size === 0) {
    alert('Please select requirements')
    return
  }

  isSaving.value = true

  try {
    const selectedData: Array<{ req_id: string; module: string; requirement: string }> = []

    suggestions.value.forEach(sug => {
      const choice = selections.value.get(sug.req_id) || 'suggested'

      if (choice === 'original') {
        selectedData.push({
          req_id: sug.req_id,
          module: sug.module,
          requirement: sug.original_requirement
        })
      } else if (choice === 'custom') {
        const customText = customTexts.value.get(sug.req_id)
        if (customText) {
          selectedData.push({ req_id: sug.req_id, module: sug.module, requirement: customText })
        } else {
          selectedData.push({
            req_id: sug.req_id,
            module: sug.module,
            requirement: sug.suggested_requirement || sug.original_requirement
          })
        }
      } else {
        if (sug.is_split && sug.split_requirements) {
          sug.split_requirements.forEach((split: any) => {
            selectedData.push({ req_id: split.req_id, module: sug.module, requirement: split.requirement })
          })
        } else {
          selectedData.push({
            req_id: sug.req_id,
            module: sug.module,
            requirement: sug.suggested_requirement || sug.original_requirement
          })
        }
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

const handlePrevious = () => {
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
  const num = parseInt(score.split('/')[0] ?? '0')
  if (isNaN(num)) return 'text-gray-500'
  if (num <= 3) return 'text-red-500'
  if (num <= 6) return 'text-yellow-500'
  return 'text-green-500'
}

const getScoreBg = (score: string | undefined) => {
  if (!score) return 'bg-gray-500 bg-opacity-10'
  const num = parseInt(score.split('/')[0] ?? '0')
  if (isNaN(num)) return 'bg-gray-500 bg-opacity-10'
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
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white">
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
            <h1 class="text-xl font-semibold text-white">{{ project?.title || 'Requirement List' }}</h1>
            <span class="text-gray-400 text-sm">•</span>
            <span class="text-blue-400 text-sm font-medium">Step 4: Compare versions</span>
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
        :has-selected="hasSelected"
        current-step="compare"
      />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col bg-gray-900 min-h-0 overflow-hidden">
        <!-- Empty State -->
        <div v-if="!hasSuggestions" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400">
                <path d="M18 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/>
                <path d="M9 10h6"/><path d="M9 14h6"/>
              </svg>
            </div>
            <h3 class="text-white text-lg font-semibold mb-2">No suggestions available</h3>
            <p class="text-gray-400 text-sm mb-6">Please generate suggestions first</p>
            <button @click="router.push(`/projects/${projectId}/suggestions`)" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition">
              Go to Suggestions
            </button>
          </div>
        </div>

        <!-- Compare State -->
        <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- Info Bar -->
          <div class="bg-gray-800 px-6 py-4 border-b border-gray-700 flex-shrink-0">
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
                <div v-if="selectionSummary.customCount > 0" class="text-center">
                  <p class="text-orange-400 text-xs mb-1">Custom</p>
                  <p class="text-orange-400 text-xl font-bold">{{ selectionSummary.customCount }}</p>
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div class="relative w-64">
                  <input v-model="searchQuery" type="text" placeholder="Search" class="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-2.5 text-gray-400">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <button @click="handlePrevious" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                  Previous
                </button>
                <button @click="handleConfirm" :disabled="isSaving" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ isSaving ? 'Saving...' : 'Confirm Selection' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-y-auto min-h-0">
            <table class="w-full table-fixed">
              <thead class="bg-gray-800 sticky top-0 z-10">
                <tr class="border-b border-gray-700">
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 100px;">ReqID</th>
                  <th v-if="hasModuleData" class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 150px;">Module</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white">Original Requirement</th>
                  <th class="px-4 py-4 text-center text-sm font-semibold text-white" style="width: 70px;">Score</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white">AI Suggestion / Custom</th>
                  <th class="px-4 py-4 text-center text-sm font-semibold text-white" style="width: 56px;">Edit</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <template v-for="sug in paginatedSuggestions" :key="sug.id">
                  <!-- Main Row -->
                  <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <!-- ReqID -->
                    <td class="px-4 py-4 text-sm text-gray-900 font-medium truncate" :title="sug.req_id">{{ sug.req_id }}</td>

                    <!-- Module -->
                    <td v-if="hasModuleData" class="px-4 py-4 text-sm text-gray-900 truncate" :title="sug.module">{{ sug.module }}</td>

                    <!-- Original Requirement -->
                    <td
                      @click="selectRequirement(sug.req_id, 'original')"
                      class="px-4 py-4 text-sm text-gray-700 cursor-pointer transition-all"
                      :class="selections.get(sug.req_id) === 'original' ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-blue-50'"
                    >
                      <div class="flex items-start gap-2">
                        <input
                          type="radio"
                          :name="`select-${sug.req_id}`"
                          :checked="selections.get(sug.req_id) === 'original'"
                          @click.stop
                          @change="selectRequirement(sug.req_id, 'original')"
                          class="w-4 h-4 text-yellow-600 cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <div class="whitespace-pre-wrap break-words">{{ sug.original_requirement }}</div>
                      </div>
                    </td>

                    <!-- Score -->
                    <td class="px-4 py-4">
                      <div class="flex justify-center">
                        <span :class="['px-2 py-1 rounded text-xs font-semibold', getScoreBg(sug.original_score), getScoreColor(sug.original_score)]">
                          {{ sug.original_score }}
                        </span>
                      </div>
                    </td>

                    <!-- Suggested / Custom Requirement -->
                    <td
                      @click="selections.get(sug.req_id) !== 'custom' && selectRequirement(sug.req_id, 'suggested')"
                      class="px-4 py-4 text-sm text-gray-700 transition-all"
                      :class="[
                        selections.get(sug.req_id) === 'suggested' ? 'bg-blue-100 border-l-4 border-blue-500 cursor-pointer' :
                        selections.get(sug.req_id) === 'custom' ? 'bg-orange-50 border-l-4 border-orange-400' :
                        'hover:bg-blue-50 cursor-pointer'
                      ]"
                    >
                      <!-- Custom version display -->
                      <div v-if="selections.get(sug.req_id) === 'custom'" class="flex items-start gap-2">
                        <span class="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </span>
                        <div>
                          <span class="text-xs font-semibold text-orange-600 block mb-1">Custom version</span>
                          <div class="whitespace-pre-wrap break-words text-gray-800">{{ customTexts.get(sug.req_id) }}</div>
                        </div>
                      </div>

                      <!-- Suggested version display -->
                      <div v-else class="flex items-start gap-2">
                        <input
                          type="radio"
                          :name="`select-${sug.req_id}`"
                          :checked="selections.get(sug.req_id) === 'suggested'"
                          @click.stop
                          @change="selectRequirement(sug.req_id, 'suggested')"
                          :class="['w-4 h-4 cursor-pointer mt-0.5 flex-shrink-0', sug.is_split ? 'text-purple-600' : 'text-green-600']"
                        />

                        <!-- Normal Suggestion with Diff -->
                        <div v-if="!sug.is_split" class="whitespace-pre-wrap break-words flex-1">
                          <TextDiff :original="sug.original_requirement" :suggested="sug.suggested_requirement || ''" :show-diff="true" />
                        </div>

                        <!-- Split Requirements -->
                        <div v-else class="flex-1 space-y-2">
                          <div class="flex items-center gap-2 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-600">
                              <path d="M16 3h5v5M4 20L20 4M4 20v-5M4 20h5"/>
                            </svg>
                            <span class="text-xs font-semibold text-purple-600 uppercase">Split into {{ sug.split_requirements?.length || 0 }} requirements</span>
                          </div>
                          <div v-for="(split, idx) in sug.split_requirements" :key="`${sug.id}-split-${idx}`" class="bg-white border border-purple-300 rounded-lg p-3">
                            <div class="flex items-start gap-2 mb-1">
                              <span class="text-xs font-bold text-purple-700 min-w-[60px]">{{ split.req_id }}</span>
                            </div>
                            <p class="text-sm text-gray-800 whitespace-pre-wrap break-words">{{ split.requirement }}</p>
                            <p v-if="split.explanation" class="text-xs text-gray-600 mt-1 italic">{{ split.explanation }}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Edit Button -->
                    <td class="px-2 py-4 text-center">
                      <button
                        @click="editingReqId === sug.req_id ? cancelEdit() : startEdit(sug)"
                        :title="editingReqId === sug.req_id ? 'Cancel editing' : 'Edit / write custom requirement'"
                        :class="[
                          'p-1.5 rounded-lg transition',
                          editingReqId === sug.req_id
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-orange-500'
                        ]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>

                  <!-- Editing Row -->
                  <tr v-if="editingReqId === sug.req_id" class="bg-orange-50">
                    <td :colspan="hasModuleData ? 6 : 5" class="px-6 py-4 border-b border-orange-200">
                      <div class="space-y-3">
                        <div class="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-500 flex-shrink-0">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                          <h4 class="text-sm font-semibold text-gray-800">Custom Requirement Editor</h4>
                          <span class="text-xs text-gray-500">— แก้ไขข้อความตามต้องการ จะถูกใช้แทน Original และ AI Suggestion</span>
                        </div>
                        <textarea
                          v-model="editingText"
                          rows="4"
                          @keydown.stop
                          @click.stop
                          placeholder="พิมพ์ requirement ที่ต้องการใช้..."
                          class="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y"
                        />
                        <div class="flex items-center justify-end gap-2">
                          <button @click="cancelEdit" class="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition">
                            Cancel
                          </button>
                          <button
                            @click="saveEdit(sug.req_id)"
                            :disabled="!editingText.trim()"
                            class="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save Custom
                          </button>
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
              :class="['px-3 py-1 rounded text-sm transition', page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']"
            >
              {{ page }}
            </button>
            <span class="text-gray-400 text-sm ml-2">Total {{ filteredSuggestions.length }} items</span>
          </div>
        </div>
      </main>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isSaving" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 min-w-[300px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p class="text-white font-semibold">Saving selections...</p>
      </div>
    </div>
  </div>
</template>

<style>
.my-added-word-highlight {
  background-color: #e6ffed;
  border-bottom: 2px solid #2da44e;
  font-weight: bold;
}
</style>
