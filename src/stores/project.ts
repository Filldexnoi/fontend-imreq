// Project Store with Stage Tracking
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Project, 
  OriginRequirement, 
  AnalyzedRequirement, 
  SuggestedRequirement,
  ColumnMapping,
  ProgressMessage,
  LoadingState
} from '@/types/project'
import api from '@/services/api'

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const originRequirements = ref<OriginRequirement[]>([])
  const analyzedRequirements = ref<AnalyzedRequirement[]>([])
  const suggestedRequirements = ref<SuggestedRequirement[]>([])
  const selectedRequirements = ref<any[]>([])

  const loadingState = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  const analysisProgress = ref<ProgressMessage | null>(null)
  const suggestionProgress = ref<ProgressMessage | null>(null)

  // ✅ NEW: Stage tracking
  const projectStages = ref<Map<string, {
    hasOriginRequirements: boolean
    hasAnalysis: boolean
    hasSuggestions: boolean
    hasSelected: boolean
  }>>(new Map())

  // Getters
  const currentProjectId = computed(() => currentProject.value?.id)
  const hasRequirements = computed(() => originRequirements.value.length > 0)
  const hasAnalysis = computed(() => analyzedRequirements.value.length > 0)
  const hasSuggestions = computed(() => suggestedRequirements.value.length > 0)
  const hasSelected = computed(() => selectedRequirements.value.length > 0)
  const isLoading = computed(() => loadingState.value === 'loading')

  // ✅ NEW: Get current project stage
  const getCurrentProjectStage = computed(() => {
    if (!currentProjectId.value) return null
    return projectStages.value.get(currentProjectId.value) || {
      hasOriginRequirements: false,
      hasAnalysis: false,
      hasSuggestions: false,
      hasSelected: false
    }
  })

  // ✅ NEW: Update project stage
  const updateProjectStage = (projectId: string) => {
    projectStages.value.set(projectId, {
      hasOriginRequirements: originRequirements.value.length > 0,
      hasAnalysis: analyzedRequirements.value.length > 0,
      hasSuggestions: suggestedRequirements.value.length > 0,
      hasSelected: selectedRequirements.value.length > 0
    })
  }

  // Projects Actions
  const fetchProjects = async () => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      projects.value = await api.project.getAll()
      loadingState.value = 'success'
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const createProject = async (
    title: string,
    description: string,
    requirement_template?: string,
    files?: File[],
    enabled_criteria?: string[] | null,
  ) => {
    loadingState.value = 'loading'
    error.value = null

    try {
      const response = await api.project.create({
        title,
        description,
        requirement_template,
        enabled_criteria,
        files
      })
      await fetchProjects()
      loadingState.value = 'success'
      return response.id
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  // ✅ NEW: Update project method
  const updateProject = async (projectId: string, formData: FormData) => {
    loadingState.value = 'loading'
    error.value = null

    try {
      const response = await api.project.update(projectId, formData)
      
      // Update the project in the store
      const index = projects.value.findIndex(p => p.id === projectId)
      if (index !== -1) {
        projects.value[index] = response
      }

      // Update current project if it's the one being edited
      if (currentProject.value?.id === projectId) {
        currentProject.value = response
      }

      loadingState.value = 'success'
      return response
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const deleteProject = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null

    try {
      await api.project.delete(projectId)
      await fetchProjects()
      loadingState.value = 'success'
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const duplicateProject = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null

    try {
      const project = projects.value.find(p => p.id === projectId)
      if (!project) {
        throw new Error('Project not found')
      }

      const response = await api.project.create({
        title: `${project.title} (Copy)`,
        description: project.description
      })
      await fetchProjects()
      loadingState.value = 'success'
      return response.id
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const selectProject = async (project: Project) => {
    currentProject.value = project

    // Load all data for this project to determine stage
    await Promise.all([
      fetchOriginRequirements(project.id),
      fetchAnalyzedRequirements(project.id).catch(() => {}), // Don't fail if no analysis
      fetchSuggestions(project.id).catch(() => {}), // Don't fail if no suggestions
      fetchSelectedRequirements(project.id).catch(() => {}) // Don't fail if no selected
    ])

    // Update stage tracking
    updateProjectStage(project.id)
  }

  // Origin Requirements Actions
  const fetchOriginRequirements = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      originRequirements.value = await api.originRequirement.getAll(projectId)
      loadingState.value = 'success'
      updateProjectStage(projectId)
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const uploadRequirements = async (
    projectId: string,
    file: File,
    mapping: ColumnMapping
  ) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      const response = await api.originRequirement.upload(projectId, file, mapping)
      await fetchOriginRequirements(projectId)
      loadingState.value = 'success'
      updateProjectStage(projectId)
      return response
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  // Analysis Actions
  const analyzeProject = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      const response = await api.analysis.analyzeProject(projectId)
      loadingState.value = 'success'
      updateProjectStage(projectId)
      return response
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const analyzeSingleRequirement = async (projectId: string, reqId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      const response = await api.analysis.analyzeSingle(projectId, reqId)
      loadingState.value = 'success'
      return response
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const fetchAnalyzedRequirements = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      analyzedRequirements.value = await api.analysis.getAll(projectId)
      loadingState.value = 'success'
      updateProjectStage(projectId)
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  // Analysis with WebSocket
  const analyzeProjectWithProgress = async (projectId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ws = api.websocket.createAnalysisWebSocket(projectId)
      let settled = false

      const settle = (fn: () => void) => {
        if (settled) return
        settled = true
        fn()
      }

      ws.onopen = () => {
        console.log('Analysis WebSocket connected')
      }

      ws.onmessage = (event) => {
        const data: ProgressMessage = JSON.parse(event.data)
        if (data.type === 'heartbeat') return
        analysisProgress.value = data

        if (data.type === 'saved') {
          fetchAnalyzedRequirements(projectId).then(() => {
            updateProjectStage(projectId)
            ws.close()
            settle(resolve)
          })
        } else if (data.type === 'error') {
          error.value = data.message || 'Analysis failed'
          ws.close()
          settle(() => reject(new Error(data.message)))
        }
      }

      ws.onerror = () => {
        error.value = 'WebSocket connection error'
        settle(() => reject(new Error('WebSocket connection error')))
      }

      ws.onclose = () => {
        console.log('Analysis WebSocket closed')
        settle(() => reject(new Error('Connection lost during analysis')))
      }
    })
  }

  // Suggestions Actions
  const generateSuggestions = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      const response = await api.suggestion.generate(projectId)
      await fetchSuggestions(projectId)
      loadingState.value = 'success'
      updateProjectStage(projectId)
      return response
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const generateSingleSuggestion = async (projectId: string, reqId: string) => {
    loadingState.value = 'loading'
    error.value = null

    try {
      const response = await api.suggestion.generateSingle(projectId, reqId)
      loadingState.value = 'success'
      return response
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  // Re-analyze a single requirement and update local state
  const reanalyzeRequirement = async (projectId: string, reqId: string) => {
    try {
      const response = await api.analysis.analyzeSingle(projectId, reqId)

      // Update the local analyzedRequirements array
      const index = analyzedRequirements.value.findIndex(r => r.req_id === reqId)
      const existing = analyzedRequirements.value[index]
      if (index !== -1 && existing) {
        analyzedRequirements.value[index] = {
          id: existing.id,
          req_id: existing.req_id,
          project_id: existing.project_id,
          module: existing.module,
          requirement: existing.requirement,
          created_at: existing.created_at,
          updated_at: new Date().toISOString(),
          score: response.score,
          characteristics: response.characteristics,
          evaluation: response.evaluation
        }
      }

      return response
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  // Regenerate a single suggestion and update local state
  const regenerateSuggestion = async (projectId: string, reqId: string) => {
    try {
      const response = await api.suggestion.generateSingle(projectId, reqId)

      // Update the local suggestedRequirements array
      const index = suggestedRequirements.value.findIndex(s => s.req_id === reqId)
      const existing = suggestedRequirements.value[index]
      if (index !== -1 && existing) {
        suggestedRequirements.value[index] = {
          id: existing.id,
          req_id: existing.req_id,
          project_id: existing.project_id,
          module: existing.module,
          original_requirement: existing.original_requirement,
          original_score: existing.original_score,
          created_at: existing.created_at,
          updated_at: new Date().toISOString(),
          suggested_requirement: response.suggested_requirement,
          improvements: response.improvements
        }
      }

      return response
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const fetchSuggestions = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      const response = await api.suggestion.getAll(projectId)
      suggestedRequirements.value = response.suggestions
      loadingState.value = 'success'
      updateProjectStage(projectId)
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  // Suggestions with WebSocket
  const generateSuggestionsWithProgress = async (projectId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ws = api.websocket.createSuggestionWebSocket(projectId)
      let settled = false

      const settle = (fn: () => void) => {
        if (settled) return
        settled = true
        fn()
      }

      ws.onopen = () => {
        console.log('Suggestion WebSocket connected')
      }

      ws.onmessage = (event) => {
        const data: ProgressMessage = JSON.parse(event.data)
        if (data.type === 'heartbeat') return
        suggestionProgress.value = data

        if (data.type === 'saved') {
          fetchSuggestions(projectId).then(() => {
            updateProjectStage(projectId)
            ws.close()
            settle(resolve)
          })
        } else if (data.type === 'error') {
          error.value = data.message || 'Suggestion generation failed'
          ws.close()
          settle(() => reject(new Error(data.message)))
        }
      }

      ws.onerror = () => {
        error.value = 'WebSocket connection error'
        settle(() => reject(new Error('WebSocket connection error')))
      }

      ws.onclose = () => {
        console.log('Suggestion WebSocket closed')
        settle(() => reject(new Error('Connection lost during suggestion generation')))
      }
    })
  }

  // Selected Requirements Actions
  const fetchSelectedRequirements = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null

    try {
      selectedRequirements.value = await api.selectedRequirement.getAll(projectId)
      loadingState.value = 'success'
      updateProjectStage(projectId)
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  const saveSelectedRequirements = async (
    projectId: string,
    selections: Array<{ req_id: string; module: string; requirement: string }>
  ) => {
    loadingState.value = 'loading'
    error.value = null

    try {
      await api.selectedRequirement.create(projectId, selections)
      await fetchSelectedRequirements(projectId)
      loadingState.value = 'success'
      updateProjectStage(projectId)
    } catch (err: any) {
      error.value = err.message
      loadingState.value = 'error'
      throw err
    }
  }

  // Export Actions
  const downloadSelectedCSV = async (projectId: string) => {
    const url = api.export.SelectedCSV(projectId)
    const project = currentProject.value || projects.value.find(p => p.id === projectId)
    const filename = `${project?.title || 'project'}_selected_requirements.csv`
    await api.export.download(url, filename)
  }

  // Utility Actions
  const clearError = () => {
    error.value = null
  }

  const resetStore = () => {
    projects.value = []
    currentProject.value = null
    originRequirements.value = []
    analyzedRequirements.value = []
    suggestedRequirements.value = []
    selectedRequirements.value = []
    loadingState.value = 'idle'
    error.value = null
    analysisProgress.value = null
    suggestionProgress.value = null
    projectStages.value.clear()
  }

  return {
    // State
    projects,
    currentProject,
    originRequirements,
    analyzedRequirements,
    suggestedRequirements,
    selectedRequirements,
    loadingState,
    error,
    analysisProgress,
    suggestionProgress,
    projectStages,

    // Getters
    currentProjectId,
    hasRequirements,
    hasAnalysis,
    hasSuggestions,
    hasSelected,
    isLoading,
    getCurrentProjectStage,
    
    // Actions - Projects
    fetchProjects,
    createProject,
    updateProject, // ✅ NEW: Export updateProject
    deleteProject,
    duplicateProject,
    selectProject,
    
    // Actions - Origin Requirements
    fetchOriginRequirements,
    uploadRequirements,
    
    // Actions - Analysis
    analyzeProject,
    analyzeSingleRequirement,
    fetchAnalyzedRequirements,
    analyzeProjectWithProgress,
    
    // Actions - Suggestions
    generateSuggestions,
    generateSingleSuggestion,
    fetchSuggestions,
    generateSuggestionsWithProgress,

    // Actions - Re-analyze/Regenerate
    reanalyzeRequirement,
    regenerateSuggestion,

    // Actions - Selected Requirements
    fetchSelectedRequirements,
    saveSelectedRequirements,

    // Actions - Export
    downloadSelectedCSV,
    
    // Actions - Utility
    clearError,
    resetStore,
    updateProjectStage,
  }
})