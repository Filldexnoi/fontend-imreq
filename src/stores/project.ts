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
  
  const loadingState = ref<LoadingState>('idle')
  const error = ref<string | null>(null)
  
  const analysisProgress = ref<ProgressMessage | null>(null)
  const suggestionProgress = ref<ProgressMessage | null>(null)

  // Getters
  const currentProjectId = computed(() => currentProject.value?.id)
  const hasRequirements = computed(() => originRequirements.value.length > 0)
  const hasAnalysis = computed(() => analyzedRequirements.value.length > 0)
  const hasSuggestions = computed(() => suggestedRequirements.value.length > 0)
  const isLoading = computed(() => loadingState.value === 'loading')

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

  const createProject = async (title: string, description: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      const response = await api.project.create({ title, description })
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
    await fetchOriginRequirements(project.id)
  }

  // Origin Requirements Actions
  const fetchOriginRequirements = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      originRequirements.value = await api.originRequirement.getAll(projectId)
      loadingState.value = 'success'
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
      
      ws.onopen = () => {
        console.log('Analysis WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        const data: ProgressMessage = JSON.parse(event.data)
        analysisProgress.value = data
        
        if (data.type === 'saved') {
          ws.close()
          resolve()
        } else if (data.type === 'error') {
          error.value = data.message || 'Analysis failed'
          ws.close()
          reject(new Error(data.message))
        }
      }
      
      ws.onerror = (event) => {
        error.value = 'WebSocket connection error'
        reject(new Error('WebSocket connection error'))
      }
      
      ws.onclose = () => {
        console.log('Analysis WebSocket closed')
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

  const fetchSuggestions = async (projectId: string) => {
    loadingState.value = 'loading'
    error.value = null
    
    try {
      const response = await api.suggestion.getAll(projectId)
      suggestedRequirements.value = response.suggestions
      loadingState.value = 'success'
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
      
      ws.onopen = () => {
        console.log('Suggestion WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        const data: ProgressMessage = JSON.parse(event.data)
        suggestionProgress.value = data
        
        if (data.type === 'saved') {
          fetchSuggestions(projectId).then(() => {
            ws.close()
            resolve()
          })
        } else if (data.type === 'error') {
          error.value = data.message || 'Suggestion generation failed'
          ws.close()
          reject(new Error(data.message))
        }
      }
      
      ws.onerror = (event) => {
        error.value = 'WebSocket connection error'
        reject(new Error('WebSocket connection error'))
      }
      
      ws.onclose = () => {
        console.log('Suggestion WebSocket closed')
      }
    })
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
    loadingState.value = 'idle'
    error.value = null
    analysisProgress.value = null
    suggestionProgress.value = null
  }

  return {
    // State
    projects,
    currentProject,
    originRequirements,
    analyzedRequirements,
    suggestedRequirements,
    loadingState,
    error,
    analysisProgress,
    suggestionProgress,
    
    // Getters
    currentProjectId,
    hasRequirements,
    hasAnalysis,
    hasSuggestions,
    isLoading,
    
    // Actions - Projects
    fetchProjects,
    createProject,
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
    
    // Actions - Export
    downloadSelectedCSV,
    
    // Actions - Utility
    clearError,
    resetStore,
  }
})