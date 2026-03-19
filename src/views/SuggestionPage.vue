<!-- SuggestionsPage.vue - Step 3: View Suggestions with Suggestion Column -->
<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import WorkflowSidebar from '@/components/WorkflowSidebar.vue'
import { suggestionAPI, selectedRequirementAPI } from '@/services/api'
import RuleIcon from '@/components/RuleIcon.vue'
import Plotly from 'plotly.js-dist-min'
import TextDiff from '@/components/TextDiff.vue'
import CriteriaReference from '@/components/CriteriaReference.vue'
import CriterionTag from '@/components/CriterionTag.vue'

// Improvement value can be a plain string (legacy) or {description, cited_rules} object
function improvDesc(v: unknown): string {
  if (typeof v === 'object' && v !== null && 'description' in v) return (v as any).description ?? ''
  return String(v ?? '')
}
function improvRules(v: unknown): string[] {
  if (typeof v === 'object' && v !== null && 'cited_rules' in v) return (v as any).cited_rules ?? []
  return []
}

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
const isSaving = ref(false)
const selections = ref<Map<string, 'original' | 'suggested'>>(new Map())

const selectReq = async (sug: any, choice: 'original' | 'suggested') => {
  selections.value = new Map(selections.value).set(sug.req_id, choice)

  const deleteIds: string[] = [sug.req_id]
  if (sug.is_split && sug.split_requirements) {
    sug.split_requirements.forEach((s: any) => deleteIds.push(s.req_id))
  }

  let insertData: Array<{ req_id: string; module: string; requirement: string }>
  if (choice === 'original') {
    insertData = [{ req_id: sug.req_id, module: sug.module, requirement: sug.original_requirement }]
  } else if (sug.is_split && sug.split_requirements) {
    insertData = sug.split_requirements.map((s: any) => ({
      req_id: s.req_id, module: sug.module, requirement: s.requirement
    }))
  } else {
    insertData = [{ req_id: sug.req_id, module: sug.module, requirement: sug.suggested_requirement || sug.original_requirement }]
  }

  try {
    await selectedRequirementAPI.upsertSingle(projectId.value, deleteIds, insertData)
  } catch (e: any) {
    console.error('Failed to save selection:', e)
  }
}

const initSelectionsFromSaved = () => {
  const savedMap = new Map(store.selectedRequirements.map((r: any) => [r.req_id, r.requirement]))
  const map = new Map<string, 'original' | 'suggested'>()
  suggestions.value.forEach(sug => {
    const saved = savedMap.get(sug.req_id)
    map.set(sug.req_id, saved !== undefined && saved === sug.original_requirement ? 'original' : 'suggested')
  })
  selections.value = map
}

// Stage tracking
const hasOriginRequirements = computed(() => store.hasRequirements)
const hasAnalysis = computed(() => store.hasAnalysis)
const hasSuggestions = computed(() => suggestions.value.length > 0)
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
        initSelectionsFromSaved()
        fetchSimilarityData()
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

// Actions
const handlePrevious = () => {
  router.push(`/projects/${projectId.value}/analysis`)
}

const handleNext = () => {
  router.push(`/projects/${projectId.value}/compare`)
}

const getSimilarityForReq = (reqId: string) => {
  return similarityData.value?.pairs.find(p => p.req_id === reqId) ?? null
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

function parseScore(score: string | undefined | null): number {
  return parseInt((score ?? '0/9').split('/')[0] ?? '0', 10)
}

const getScoreColor = (score: string | undefined) => {
  const num = parseScore(score)
  if (num <= 3) return 'text-red-500'
  if (num <= 6) return 'text-yellow-500'
  return 'text-green-500'
}

const getScoreBg = (score: string | undefined) => {
  const num = parseScore(score)
  if (num <= 3) return 'bg-red-500 bg-opacity-10'
  if (num <= 6) return 'bg-yellow-500 bg-opacity-10'
  return 'bg-green-500 bg-opacity-10'
}

// Similarity Summary
type SimilarityResult = {
  summary: {
    total: number
    jaccard: { mean: number; median: number; min: number; max: number; min_req: string; max_req: string }
    doc2vec: { mean: number; median: number; min: number; max: number; min_req: string; max_req: string }
    interpretation_counts: Record<string, number>
  }
  pairs: Array<{
    req_id: string
    original_score: string
    jaccard: number
    doc2vec_sim: number
    interpretation: string
    is_split?: boolean
  }>
}

const showSimilarityModal = ref(false)
const isSimilarityLoading = ref(false)
const similarityData = ref<SimilarityResult | null>(null)
const similarityError = ref<string | null>(null)

const interpretationLabelMap: Record<string, string> = {
  'เหมือนมาก': 'Highly Similar',
  'ความหมายใกล้เคียง': 'Semantically Close',
  'เปลี่ยนบางส่วน': 'Partially Changed',
  'เปลี่ยนมาก': 'Significantly Changed',
}

const interpretationLabel = (label: string) => interpretationLabelMap[label] ?? label

const interpretationColor = (label: string) => {
  if (label === 'เหมือนมาก') return 'text-green-600 bg-green-50'
  if (label === 'ความหมายใกล้เคียง') return 'text-blue-600 bg-blue-50'
  if (label === 'เปลี่ยนบางส่วน') return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

const navigateToReq = async (reqId: string) => {
  showSimilarityModal.value = false
  searchQuery.value = ''
  await nextTick()
  const idx = filteredSuggestions.value.findIndex(s => s.req_id === reqId)
  if (idx === -1) return
  const sugId = filteredSuggestions.value[idx]?.id
  if (!sugId) return
  currentPage.value = Math.floor(idx / itemsPerPage) + 1
  expandedRow.value = sugId
  await nextTick()
  const el = document.querySelector(`[data-sug-id="${sugId}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const histogramEl = ref<HTMLDivElement | null>(null)

const renderHistogram = (data: SimilarityResult) => {
  const el = histogramEl.value
  if (!el) return
  const jaccardVals = data.pairs.map(p => p.jaccard)
  const doc2vecVals = data.pairs.map(p => p.doc2vec_sim)
  const trace1: Partial<Plotly.PlotData> = {
    x: jaccardVals,
    name: 'Text Similarity',
    type: 'histogram',
    autobinx: false,
    xbins: { start: 0, end: 1, size: 0.05 },
    marker: { color: 'rgba(96, 165, 250, 0.6)', line: { color: 'rgba(59, 130, 246, 1)', width: 1 } },
    opacity: 0.7,
  }
  const trace2: Partial<Plotly.PlotData> = {
    x: doc2vecVals,
    name: 'Meaning Similarity',
    type: 'histogram',
    autobinx: false,
    xbins: { start: 0, end: 1, size: 0.05 },
    marker: { color: 'rgba(167, 139, 250, 0.6)', line: { color: 'rgba(139, 92, 246, 1)', width: 1 } },
    opacity: 0.7,
  }
  const layout: Partial<Plotly.Layout> = {
    bargap: 0.05,
    bargroupgap: 0.1,
    barmode: 'overlay',
    margin: { t: 10, b: 60, l: 40, r: 10 },
    height: 240,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', size: 11, color: '#374151' },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.28, yanchor: 'top', bgcolor: 'rgba(0,0,0,0)', borderwidth: 0 },
    xaxis: { title: { text: 'Score (0 – 1)', font: { size: 10 }, standoff: 8 }, range: [0, 1], gridcolor: '#e5e7eb' },
    yaxis: { title: { text: 'Count', font: { size: 10 } }, gridcolor: '#e5e7eb' },
  }
  Plotly.newPlot(el, [trace1, trace2], layout, { responsive: true, displayModeBar: false })
}

watch([showSimilarityModal, similarityData], async ([show, data]) => {
  if (show && data) {
    await nextTick()
    renderHistogram(data)
  }
})

const fetchSimilarityData = async () => {
  if (similarityData.value) return
  isSimilarityLoading.value = true
  similarityError.value = null
  try {
    similarityData.value = await suggestionAPI.getSimilarity(projectId.value)
  } catch (e: any) {
    similarityError.value = e.message || 'Failed to load similarity data'
  } finally {
    isSimilarityLoading.value = false
  }
}

const handleViewSimilarity = async () => {
  showSimilarityModal.value = true
  await fetchSimilarityData()
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
              <span class="text-gray-400 text-sm">Showing {{ filteredSuggestions.length }} suggestions</span>
              <div class="flex items-center gap-3">
                <div class="relative w-64">
                  <input v-model="searchQuery" type="text" placeholder="Search" class="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3 top-2.5 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
                <CriteriaReference />
                <button @click="handleViewSimilarity" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  Similarity Summary
                </button>
                <button @click="handlePrevious" class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                  Previous
                </button>
                <button @click="handleNext" :disabled="!hasSuggestions" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
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
                  <th v-if="hasModuleData" class="px-4 py-4 text-left text-sm font-semibold text-white" style="width: 180px;">Module</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white">Original</th>
                  <th class="px-4 py-4 text-left text-sm font-semibold text-white">AI Suggestion</th>
                  <th class="px-4 py-4 text-center text-sm font-semibold text-white" style="width: 70px;">Score</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <template v-for="sug in paginatedSuggestions" :key="sug.id">
                  <tr
                    @click="toggleRow(sug.id)"
                    :data-sug-id="sug.id"
                    class="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <td class="px-4 py-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="['transition-transform', expandedRow === sug.id ? 'rotate-90' : '']">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-900 truncate" :title="sug.req_id">{{ sug.req_id }}</td>
                    <td v-if="hasModuleData" class="px-4 py-4 text-sm text-gray-900 truncate" :title="sug.module">{{ sug.module }}</td>
                    <td class="px-4 py-4 text-sm text-gray-900">
                      <div class="whitespace-pre-wrap break-words">{{ sug.original_requirement }}</div>
                    </td>
                    <td class="px-4 py-4 text-sm text-gray-900">
                      <div v-if="!sug.is_split" class="whitespace-pre-wrap break-words">{{ sug.suggested_requirement }}</div>
                      <div v-else class="space-y-2">
                        <div class="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-purple-600"><path d="M16 3h5v5M4 20L20 4M4 20v-5M4 20h5"/></svg>
                          <span class="text-xs font-semibold text-purple-600 uppercase">Split into {{ sug.split_requirements?.length || 0 }}</span>
                        </div>
                        <div v-for="(split, idx) in sug.split_requirements" :key="`${sug.id}-split-${idx}`" class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <span class="text-xs font-bold text-purple-700">{{ split.req_id }}</span>
                          <p class="text-sm text-gray-800 whitespace-pre-wrap break-words mt-1">{{ split.requirement }}</p>
                          <p v-if="split.explanation" class="text-xs text-gray-600 mt-1 italic">{{ split.explanation }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex justify-center">
                        <span :class="['px-3 py-1 rounded-full text-sm font-semibold', getScoreBg(sug.original_score), getScoreColor(sug.original_score)]">{{ sug.original_score }}</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Expanded Row -->
                  <tr v-if="expandedRow === sug.id" class="bg-gray-50">
                    <td :colspan="hasModuleData ? 6 : 5" class="px-6 py-4">
                      <div class="space-y-4">
                        <!-- Text Diff + Similarity bars side by side -->
                        <div class="grid grid-cols-2 gap-4">
                          <!-- Text Diff -->
                          <div v-if="!sug.is_split && sug.suggested_requirement" class="flex flex-col h-full">
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">Text Diff:</h4>
                            <div class="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm">
                              <TextDiff :original="sug.original_requirement" :suggested="sug.suggested_requirement" :show-diff="true" />
                            </div>
                          </div>
                          <div v-else></div>
                          <!-- Similarity bars -->
                          <div v-if="getSimilarityForReq(sug.req_id)" class="flex flex-col h-full">
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">Similarity:</h4>
                            <div class="flex-1 bg-white border border-gray-200 rounded-lg p-3 flex flex-col justify-center gap-3">
                              <div class="flex items-center gap-3">
                                <span class="text-xs text-gray-500 w-28 flex-shrink-0">Text Similarity</span>
                                <div class="flex-1 bg-gray-200 rounded-full h-2">
                                  <div class="h-2 rounded-full transition-all" :class="getSimilarityForReq(sug.req_id)!.jaccard < 0.5 ? 'bg-red-500' : getSimilarityForReq(sug.req_id)!.jaccard < 0.75 ? 'bg-yellow-500' : 'bg-green-500'" :style="{ width: `${(getSimilarityForReq(sug.req_id)!.jaccard * 100).toFixed(1)}%` }"></div>
                                </div>
                                <span class="text-xs font-mono w-12 text-right" :class="getSimilarityForReq(sug.req_id)!.jaccard < 0.5 ? 'text-red-600' : getSimilarityForReq(sug.req_id)!.jaccard < 0.75 ? 'text-yellow-600' : 'text-green-600'">{{ (getSimilarityForReq(sug.req_id)!.jaccard * 100).toFixed(1) }}%</span>
                              </div>
                              <div class="flex items-center gap-3">
                                <span class="text-xs text-gray-500 w-28 flex-shrink-0">Meaning Similarity</span>
                                <div class="flex-1 bg-gray-200 rounded-full h-2">
                                  <div class="h-2 rounded-full transition-all" :class="getSimilarityForReq(sug.req_id)!.doc2vec_sim < 0.6 ? 'bg-red-500' : getSimilarityForReq(sug.req_id)!.doc2vec_sim < 0.8 ? 'bg-yellow-500' : 'bg-green-500'" :style="{ width: `${(getSimilarityForReq(sug.req_id)!.doc2vec_sim * 100).toFixed(1)}%` }"></div>
                                </div>
                                <span class="text-xs font-mono w-12 text-right" :class="getSimilarityForReq(sug.req_id)!.doc2vec_sim < 0.6 ? 'text-red-600' : getSimilarityForReq(sug.req_id)!.doc2vec_sim < 0.8 ? 'text-yellow-600' : 'text-green-600'">{{ (getSimilarityForReq(sug.req_id)!.doc2vec_sim * 100).toFixed(1) }}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Improvement Details -->
                        <div>
                          <h4 class="text-sm font-semibold text-gray-700 mb-3">Improvement Details:</h4>
                          <div class="grid grid-cols-2 gap-3">
                            <div v-for="(improvement, criterion) in sug.improvements" :key="criterion" class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div class="flex items-center gap-2 flex-wrap mb-1">
                                <p class="text-sm font-semibold text-blue-700">{{ criterion }}</p>
                                <CriterionTag :criterion="(criterion as string)" />
                              </div>
                              <p class="text-sm text-gray-700 mb-2">{{ improvDesc(improvement) }}</p>
                              <div v-if="improvRules(improvement).length" class="flex flex-wrap gap-1">
                                <RuleIcon v-for="rule in improvRules(improvement)" :key="rule" :name="rule" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Selection buttons -->
                        <div class="flex items-center gap-3 pt-3 border-t border-gray-200" @click.stop>
                          <span class="text-sm font-semibold text-gray-600">Select version:</span>
                          <button
                            @click="selectReq(sug, 'original')"
                            :class="[
                              'px-4 py-1.5 rounded-lg text-sm font-medium transition border',
                              selections.get(sug.req_id) === 'original'
                                ? 'bg-gray-700 text-white border-gray-700'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            ]"
                          >
                            Use Original
                          </button>
                          <button
                            @click="selectReq(sug, 'suggested')"
                            :class="[
                              'px-4 py-1.5 rounded-lg text-sm font-medium transition border',
                              selections.get(sug.req_id) !== 'original'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            ]"
                          >
                            Use Suggested
                          </button>
                          <span class="text-xs text-gray-400 ml-1">
                            {{ selections.get(sug.req_id) === 'original' ? 'Will use original requirement' : 'Will use AI suggestion' }}
                          </span>
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

    <!-- Similarity Summary Modal -->
    <div
      v-if="showSimilarityModal"
      class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      @click.self="showSimilarityModal = false"
    >
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Similarity Summary</h2>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Original vs Suggested</span>
          </div>
          <button @click="showSimilarityModal = false" class="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5">
          <!-- Loading -->
          <div v-if="isSimilarityLoading" class="flex flex-col items-center justify-center py-16 gap-4">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            <p class="text-gray-500 text-sm">Computing similarity (Jaccard + Doc2Vec)...</p>
          </div>

          <!-- Error -->
          <div v-else-if="similarityError" class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-500 flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            <p class="text-red-700 text-sm">{{ similarityError }}</p>
          </div>

          <!-- Results -->
          <div v-else-if="similarityData" class="space-y-6">
            <!-- Histogram + Summary Stats -->
            <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              <h3 class="text-sm font-semibold text-gray-700">Distribution — {{ similarityData.summary.total }} pairs</h3>
              <div ref="histogramEl"></div>
              <!-- Summary Stats below chart -->
              <div class="grid grid-cols-2 gap-3 pt-1">
                <!-- Token Similarity stats -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Token Similarity</p>
                  <div class="grid grid-cols-2 gap-1.5 text-xs">
                    <div class="flex justify-between"><span class="text-gray-500">Mean</span><span class="font-semibold text-gray-800">{{ similarityData.summary.jaccard.mean }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Median</span><span class="font-semibold text-gray-800">{{ similarityData.summary.jaccard.median }}</span></div>
                    <div class="flex justify-between gap-1"><span class="text-gray-500">Min</span><span class="font-semibold text-red-600">{{ similarityData.summary.jaccard.min }} <span class="text-gray-400">({{ similarityData.summary.jaccard.min_req }})</span></span></div>
                    <div class="flex justify-between gap-1"><span class="text-gray-500">Max</span><span class="font-semibold text-green-600">{{ similarityData.summary.jaccard.max }} <span class="text-gray-400">({{ similarityData.summary.jaccard.max_req }})</span></span></div>
                  </div>
                </div>
                <!-- Meaning Similarity stats -->
                <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p class="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Meaning Similarity</p>
                  <div class="grid grid-cols-2 gap-1.5 text-xs">
                    <div class="flex justify-between"><span class="text-gray-500">Mean</span><span class="font-semibold text-gray-800">{{ similarityData.summary.doc2vec.mean }}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">Median</span><span class="font-semibold text-gray-800">{{ similarityData.summary.doc2vec.median }}</span></div>
                    <div class="flex justify-between gap-1"><span class="text-gray-500">Min</span><span class="font-semibold text-red-600">{{ similarityData.summary.doc2vec.min }} <span class="text-gray-400">({{ similarityData.summary.doc2vec.min_req }})</span></span></div>
                    <div class="flex justify-between gap-1"><span class="text-gray-500">Max</span><span class="font-semibold text-green-600">{{ similarityData.summary.doc2vec.max }} <span class="text-gray-400">({{ similarityData.summary.doc2vec.max_req }})</span></span></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Interpretation counts -->
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-3">Interpretation Breakdown</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(count, label) in similarityData.summary.interpretation_counts"
                  :key="label"
                  :class="['px-3 py-1.5 rounded-full text-sm font-medium', interpretationColor(label as string)]"
                >
                  {{ interpretationLabel(label as string) }}: {{ count }}
                </span>
              </div>
            </div>

            <!-- Per-row table -->
            <div>
              <h3 class="text-sm font-semibold text-gray-700 mb-3">Per-Requirement Results</h3>
              <div class="overflow-x-auto rounded-xl border border-gray-200">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th class="px-4 py-3 text-left font-semibold text-gray-600">ReqID</th>
                      <th class="px-4 py-3 text-center font-semibold text-gray-600">Score</th>
                      <th class="px-4 py-3 text-center font-semibold text-gray-600">Text Similarity</th>
                      <th class="px-4 py-3 text-center font-semibold text-gray-600">Meaning Similarity</th>
                      <th class="px-4 py-3 text-left font-semibold text-gray-600">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="pair in similarityData.pairs"
                      :key="pair.req_id"
                      class="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      @click="navigateToReq(pair.req_id)"
                    >
                      <td class="px-4 py-3 font-mono text-gray-800">
                        <div class="flex items-center gap-2">
                          {{ pair.req_id }}
                          <span v-if="pair.is_split" class="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">split</span>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span :class="['px-2 py-0.5 rounded-full text-xs font-semibold', getScoreBg(pair.original_score || '0/9'), getScoreColor(pair.original_score || '0/9')]">
                          {{ pair.original_score }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              class="h-2 rounded-full transition-all"
                              :class="pair.jaccard < 0.5 ? 'bg-red-500' : pair.jaccard < 0.75 ? 'bg-yellow-500' : 'bg-green-500'"
                              :style="{ width: `${(pair.jaccard * 100).toFixed(1)}%` }"
                            ></div>
                          </div>
                          <span class="text-xs font-mono w-10 text-right" :class="pair.jaccard < 0.5 ? 'text-red-600' : pair.jaccard < 0.75 ? 'text-yellow-600' : 'text-green-600'">
                            {{ (pair.jaccard * 100).toFixed(1) }}%
                          </span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              class="h-2 rounded-full transition-all"
                              :class="pair.doc2vec_sim < 0.6 ? 'bg-red-500' : pair.doc2vec_sim < 0.8 ? 'bg-yellow-500' : 'bg-green-500'"
                              :style="{ width: `${(pair.doc2vec_sim * 100).toFixed(1)}%` }"
                            ></div>
                          </div>
                          <span class="text-xs font-mono w-10 text-right" :class="pair.doc2vec_sim < 0.6 ? 'text-red-600' : pair.doc2vec_sim < 0.8 ? 'text-yellow-600' : 'text-green-600'">
                            {{ (pair.doc2vec_sim * 100).toFixed(1) }}%
                          </span>
                        </div>
                      </td>
                      <td class="px-4 py-3">
                        <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', interpretationColor(pair.interpretation)]">
                          {{ interpretationLabel(pair.interpretation) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Saving overlay -->
    <div v-if="isSaving" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 min-w-[260px]">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p class="text-white font-semibold">Saving selections...</p>
      </div>
    </div>
  </div>
</template>