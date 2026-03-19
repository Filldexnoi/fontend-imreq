<!-- WorkflowSidebar.vue - Shared Workflow Sidebar Component -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

interface Props {
  projectId: string
  hasOriginRequirements?: boolean
  hasAnalysis?: boolean
  hasSuggestions?: boolean
  hasSelected?: boolean
  currentStep?: 'upload' | 'analysis' | 'suggestions' | 'compare' | 'export'
}

const props = withDefaults(defineProps<Props>(), {
  hasOriginRequirements: false,
  hasAnalysis: false,
  hasSuggestions: false,
  hasSelected: false,
  currentStep: 'upload'
})

const router = useRouter()

// Navigation logic
const canNavigateToAnalysis = computed(() => props.hasOriginRequirements)
const canNavigateToSuggestions = computed(() => props.hasAnalysis)
const canNavigateToCompare = computed(() => props.hasSuggestions)
const canNavigateToExport = computed(() => props.hasSuggestions || props.hasSelected)

const navigateTo = (step: string) => {
  if (step === 'origin' && props.projectId) {
    router.push(`/projects/${props.projectId}/origin-requirements`)
  } else if (step === 'analysis' && canNavigateToAnalysis.value) {
    router.push(`/projects/${props.projectId}/analysis`)
  } else if (step === 'suggestions' && canNavigateToSuggestions.value) {
    router.push(`/projects/${props.projectId}/suggestions`)
  } else if (step === 'compare' && canNavigateToCompare.value) {
    router.push(`/projects/${props.projectId}/compare`)
  } else if (step === 'export' && canNavigateToExport.value) {
    router.push(`/projects/${props.projectId}/export`)
  }
}

// Check if step is active
const isStepActive = (step: string) => {
  return props.currentStep === step
}
</script>

<template>
  <aside class="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6 gap-6 flex-shrink-0">
    <!-- Workflow Steps -->
    <div class="flex flex-col items-center gap-4">
      <!-- Step 1: Upload -->
      <button
        @click="navigateTo('origin')"
        :class="[
          'flex flex-col items-center gap-2 transition',
          hasOriginRequirements || isStepActive('upload') ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
        ]"
      >
        <div :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center transition',
          hasOriginRequirements
            ? 'bg-blue-500'
            : isStepActive('upload')
            ? 'bg-blue-500'
            : 'bg-gray-700'
        ]">
          <svg
            v-if="hasOriginRequirements"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-white"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="isStepActive('upload') ? 'text-white' : 'text-gray-400'"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <span :class="[
          'text-xs text-center',
          hasOriginRequirements
            ? 'text-white'
            : isStepActive('upload')
            ? 'text-white'
            : 'text-gray-600'
        ]">Upload<br/>requirements</span>
      </button>

      <!-- Arrow -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-gray-600"
      >
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>

      <!-- Step 2: Analyze -->
      <button
        @click="navigateTo('analysis')"
        :disabled="!canNavigateToAnalysis"
        :class="[
          'flex flex-col items-center gap-2 transition',
          canNavigateToAnalysis
            ? 'hover:opacity-80 cursor-pointer'
            : 'cursor-not-allowed opacity-50'
        ]"
      >
        <div :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center',
          hasAnalysis
            ? 'bg-blue-500'
            : isStepActive('analysis')
            ? 'bg-blue-500'
            : 'bg-gray-700'
        ]">
          <svg
            v-if="hasAnalysis"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-white"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="isStepActive('analysis') ? 'text-white' : canNavigateToAnalysis ? 'text-white' : 'text-gray-400'"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <span :class="[
          'text-xs text-center',
          hasAnalysis
            ? 'text-white'
            : isStepActive('analysis')
            ? 'text-white'
            : canNavigateToAnalysis
            ? 'text-gray-400'
            : 'text-gray-600'
        ]">Evaluate<br/>requirements</span>
      </button>

      <!-- Arrow -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-gray-600"
      >
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>

      <!-- Step 3: Improve -->
      <button
        @click="navigateTo('suggestions')"
        :disabled="!canNavigateToSuggestions"
        :class="[
          'flex flex-col items-center gap-2 transition',
          canNavigateToSuggestions
            ? 'hover:opacity-80 cursor-pointer'
            : 'cursor-not-allowed opacity-50'
        ]"
      >
        <div :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center',
          hasSuggestions
            ? 'bg-blue-500'
            : isStepActive('suggestions')
            ? 'bg-blue-500'
            : 'bg-gray-700'
        ]">
          <svg
            v-if="hasSuggestions"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-white"
          >
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="isStepActive('suggestions') ? 'text-white' : canNavigateToSuggestions ? 'text-white' : 'text-gray-400'"
          >
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </div>
        <span :class="[
          'text-xs text-center',
          hasSuggestions
            ? 'text-white'
            : isStepActive('suggestions')
            ? 'text-white'
            : canNavigateToSuggestions
            ? 'text-gray-400'
            : 'text-gray-600'
        ]">Suggest <br/>improvements</span>
      </button>

      <!-- Arrow -->
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>

      <!-- Step 4: Compare -->
      <button
        @click="navigateTo('compare')"
        :disabled="!canNavigateToCompare"
        :class="[
          'flex flex-col items-center gap-2 transition',
          canNavigateToCompare
            ? 'hover:opacity-80 cursor-pointer'
            : 'cursor-not-allowed opacity-50'
        ]"
      >
        <div :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center',
          isStepActive('compare') ? 'bg-blue-500' : canNavigateToCompare ? 'bg-gray-700' : 'bg-gray-700'
        ]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="isStepActive('compare') ? 'text-white' : canNavigateToCompare ? 'text-white' : 'text-gray-400'"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3"/>
            <path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
            <path d="M3 16v3a2 2 0 0 0 2 2h3"/>
            <path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
          </svg>
        </div>
        <span :class="[
          'text-xs text-center',
          isStepActive('compare')
            ? 'text-white'
            : canNavigateToCompare
            ? 'text-gray-400'
            : 'text-gray-600'
        ]">Compare<br/>requirements</span>
      </button>

      <!-- Arrow -->
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-600">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19 12 12 19 5 12"/>
      </svg>

      <!-- Step 5: Export -->
      <button
        @click="navigateTo('export')"
        :disabled="!canNavigateToExport"
        :class="[
          'flex flex-col items-center gap-2 transition',
          canNavigateToExport
            ? 'hover:opacity-80 cursor-pointer'
            : 'cursor-not-allowed opacity-50'
        ]"
      >
        <div :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center',
          isStepActive('export') ? 'bg-blue-600' : canNavigateToExport ? 'bg-gray-700' : 'bg-gray-700'
        ]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="[
              isStepActive('export') ? 'text-white' : canNavigateToExport ? 'text-white' : 'text-gray-400'
            ]"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <span :class="[
          'text-xs text-center',
          isStepActive('export')
            ? 'text-white'
            : canNavigateToExport
            ? 'text-gray-400'
            : 'text-gray-600'
        ]">Download<br/>report</span>
      </button>
    </div>
  </aside>
</template>
