<!-- Origin Requirements Page - Fixed with Auto-navigation -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import UploadButton from '@/components/UploadButton.vue'
import ColumnMappingModal from '@/components/ColumnMappingModal.vue'
import type { ColumnMapping } from '@/types/project'
import  WorkflowSidebar from '@/components/WorkflowSidebar.vue'

const route = useRoute()
const router = useRouter()
const store = useProjectStore()

const projectId = computed(() => route.params.id as string)
const project = computed(() => store.currentProject)
const requirements = computed(() => store.originRequirements)

const showMappingModal = ref(false)
const uploadedFile = ref<File | null>(null)
const fileColumns = ref<string[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Load data on mount
onMounted(async () => {
  if (projectId.value) {
    try {
      await store.fetchProjects()
      const foundProject = store.projects.find(p => p.id === projectId.value)
      
      if (foundProject) {
        await store.selectProject(foundProject)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }
})

// Check which stages are completed
const hasOriginRequirements = computed(() => store.hasRequirements)
const hasAnalysis = computed(() => store.hasAnalysis)
const hasSuggestions = computed(() => store.hasSuggestions)
const hasSelected = computed(() => store.hasSelected)

// Search and pagination
const filteredRequirements = computed(() => {
  let filtered = [...requirements.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(req =>
      req.req_id.toLowerCase().includes(query) ||
      req.module.toLowerCase().includes(query) ||
      req.requirement.toLowerCase().includes(query)
    )
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

// File upload handling
const readFileColumns = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const lines = content.split('\n')
        if (lines.length > 0) {
          const headers = lines[0]
            .split(',')
            .map(h => h.trim().replace(/["\r]/g, ''))
          resolve(headers)
        } else {
          reject(new Error('Empty CSV file'))
        }
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

const handleFileUploaded = async (file: File) => {
  uploadedFile.value = file
  
  try {
    const columns = await readFileColumns(file)
    fileColumns.value = columns
    showMappingModal.value = true
  } catch (error: any) {
    console.error('Error reading file:', error)
    alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + error.message)
  }
}

const handleMappingConfirm = async (mapping: any) => {
  if (!uploadedFile.value) return
  
  try {
    // Convert mapping format to match API
    const apiMapping: ColumnMapping = {
      req_id: mapping.reqId,
      module: mapping.module,
      requirement: mapping.requirement
    }
    
    await store.uploadRequirements(
      projectId.value,
      uploadedFile.value,
      apiMapping
    )
    
    showMappingModal.value = false
    uploadedFile.value = null
    
    // ✅ AUTO-NAVIGATE to Analysis page after successful upload
    setTimeout(() => {
      router.push(`/projects/${projectId.value}/analysis`)
    }, 500)
    
  } catch (error: any) {
    console.error('Upload failed:', error)
    alert('เกิดข้อผิดพลาดในการอัปโหลด: ' + error.message)
  }
}

const handleMappingClose = () => {
  showMappingModal.value = false
  uploadedFile.value = null
}

const handleBack = () => {
  router.push('/projects')
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Navigation helpers
const canNavigateToAnalysis = computed(() => hasOriginRequirements.value)
const canNavigateToSuggestions = computed(() => hasAnalysis.value)
const canNavigateToExport = computed(() => hasSuggestions.value)
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-800 px-6 py-4 flex items-center gap-4 border-b border-gray-700">
      <button
        @click="handleBack"
        class="p-2 hover:bg-gray-700 rounded-lg transition"
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
          <path d="M19 12H5M12 19l-7-7 7-7"/>
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
    <div class="flex-1 flex">
      <!-- แทนที่ sidebar เดิมด้วย WorkflowSidebar -->
      <WorkflowSidebar
        :project-id="projectId"
        :has-origin-requirements="hasOriginRequirements"
        :has-analysis="hasAnalysis"
        :has-suggestions="hasSuggestions"
        :has-selected="hasSelected"
        current-step="upload"
      />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col bg-gray-900">
        <!-- Upload State (No requirements) -->
        <div v-if="!hasOriginRequirements" class="flex-1">
          <UploadButton @file-uploaded="handleFileUploaded" />
        </div>

        <!-- Table State (Has requirements) -->
        <div v-else class="flex-1 flex flex-col">
          <!-- Toolbar -->
          <div class="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
              <h2 class="text-white text-lg font-semibold">Requirements List</h2>
              
              <!-- Search -->
              <div class="relative w-64">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="ค้นหา"
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
            </div>
          </div>

          <!-- Table -->
          <div class="flex-1 overflow-auto">
            <table class="w-full">
              <thead class="bg-gray-800 sticky top-0">
                <tr class="border-b border-gray-700">
                  <th class="px-6 py-4 text-left text-sm font-semibold text-white w-32">ReqID</th>
                  <th class="px-6 py-4 text-left text-sm font-semibold text-white w-64">Module</th>
                  <th class="px-6 py-4 text-left text-sm font-semibold text-white">Requirement</th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr
                  v-for="req in paginatedRequirements"
                  :key="req.id"
                  class="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td class="px-6 py-4 text-sm text-gray-900">{{ req.req_id }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">{{ req.module }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900">{{ req.requirement }}</td>
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
            <span class="text-gray-400 text-sm ml-2">ทั้งหมด {{ filteredRequirements.length }} รายการ</span>
          </div>
        </div>
      </main>
    </div>

    <!-- Column Mapping Modal -->
    <ColumnMappingModal
      v-if="showMappingModal"
      :file-name="uploadedFile?.name || ''"
      :columns="fileColumns"
      @confirm="handleMappingConfirm"
      @close="handleMappingClose"
    />

    <!-- Loading Overlay -->
    <div 
      v-if="store.isLoading"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 flex items-center gap-4">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="text-white">กำลังประมวลผล...</span>
      </div>
    </div>
  </div>
</template>