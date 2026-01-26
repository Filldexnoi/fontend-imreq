// src/services/api.ts - Complete API Service Module
import type { 
  Project, 
  OriginRequirement, 
  AnalyzedRequirement, 
  SuggestedRequirement,
  SelectedRequirement,
  ColumnMapping 
} from '@/types/project'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ============================================
// Helper Functions
// ============================================

// Helper function for fetch requests
async function fetchAPI(url: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'API request failed' }))
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}

// Helper function for file upload
async function uploadFile(url: string, formData: FormData) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || 'Upload failed')
  }

  return response.json()
}

// ============================================
// Project API
// ============================================

export const projectAPI = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    return fetchAPI('/projects')
  },

  // Get single project
  getById: async (projectId: string): Promise<Project> => {
    return fetchAPI(`/projects/${projectId}`)
  },

  // Create project
  create: async (project: { title: string; description: string }): Promise<{ id: string }> => {
    return fetchAPI('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    })
  },

  // Update project (if you want to add this later)
  update: async (projectId: string, project: Partial<{ title: string; description: string }>): Promise<Project> => {
    return fetchAPI(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    })
  },

  // Delete project (if you want to add this later)
  delete: async (projectId: string): Promise<void> => {
    return fetchAPI(`/projects/${projectId}`, {
      method: 'DELETE',
    })
  },
}

// ============================================
// Origin Requirements API
// ============================================

export const originRequirementAPI = {
  // Get all requirements for a project
  getAll: async (projectId: string): Promise<OriginRequirement[]> => {
    return fetchAPI(`/projects/${projectId}/originrequirements`)
  },

  // Upload requirements CSV
  upload: async (
    projectId: string, 
    file: File, 
    mapping: ColumnMapping
  ): Promise<{ inserted_rows: number }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    
    return uploadFile(`/projects/${projectId}/originrequirements`, formData)
  },
}

// ============================================
// Analysis API
// ============================================

export const analysisAPI = {
  // Analyze all requirements in project
  analyzeProject: async (projectId: string): Promise<{
    message: string
    analyzed_count: number
    summary: any
  }> => {
    return fetchAPI(`/analyze-parallel/projects/${projectId}/requirements`, {
      method: 'POST',
    })
  },

  // Analyze single requirement
  analyzeSingle: async (projectId: string, reqId: string): Promise<{
    req_id: string
    score: string
    characteristics: string[]
    evaluation: Record<string, string>
    detailed_results: any[]
  }> => {
    return fetchAPI(`/analyze-parallel/projects/${projectId}/requirements/${reqId}`, {
      method: 'POST',
    })
  },

  // Get analyzed requirements
  getAll: async (projectId: string): Promise<AnalyzedRequirement[]> => {
    return fetchAPI(`/projects/${projectId}/analyzedrequirements`)
  },
}

// ============================================
// Suggestions API
// ============================================

export const suggestionAPI = {
  // Generate suggestions for project
  generate: async (projectId: string): Promise<{
    message: string
    saved_count: number
    summary: any
  }> => {
    return fetchAPI(`/suggestions/projects/${projectId}/requirements`, {
      method: 'POST',
    })
  },

  // Generate suggestion for single requirement
  generateSingle: async (projectId: string, reqId: string): Promise<{
    req_id: string
    original_requirement: string
    suggested_requirement: string
    original_score: string
    improvements: Record<string, string>
  }> => {
    return fetchAPI(`/suggestions/projects/${projectId}/requirements/${reqId}`, {
      method: 'POST',
    })
  },

  // Get all suggestions for project
  getAll: async (projectId: string): Promise<{
    project_id: string
    total: number
    suggestions: SuggestedRequirement[]
  }> => {
    const suggestions = await fetchAPI(`/projects/${projectId}/suggestedrequirements`)
    return {
      project_id: projectId,
      total: suggestions.length,
      suggestions: suggestions
    }
  },
}

// ============================================
// Selected Requirements API (NEW!)
// ============================================

export const selectedRequirementAPI = {
  // Save selected requirements
  create: async (
    projectId: string,
    requirements: Array<{
      req_id: string
      module: string
      requirement: string
    }>
  ): Promise<{ inserted: number }> => {
    return fetchAPI(`/projects/${projectId}/selectedrequirements`, {
      method: 'POST',
      body: JSON.stringify(requirements),
    })
  },

  // Get selected requirements
  getAll: async (projectId: string): Promise<SelectedRequirement[]> => {
    return fetchAPI(`/projects/${projectId}/selectedrequirements`)
  },

  // Delete all selected requirements (optional - for reset)
  deleteAll: async (projectId: string): Promise<void> => {
    return fetchAPI(`/projects/${projectId}/selectedrequirements`, {
      method: 'DELETE',
    })
  },
}

// ============================================
// Export API
// ============================================

export const exportAPI = {
  // Get CSV download URL
  SelectedCSV: (projectId: string): string => {
    return `${API_BASE_URL.replace('/api', '')}/api/export/projects/${projectId}/selectedrequirements/csv`
  },

  // Helper to download CSV
  download: async (url: string, filename: string): Promise<void> => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Download failed')
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  // Alternative: Direct download with project name
  downloadSelectedCSV: async (projectId: string, projectTitle?: string): Promise<void> => {
    const filename = `${projectTitle || 'project'}_selected_requirements.csv`
    const url = exportAPI.SelectedCSV(projectId)
    await exportAPI.download(url, filename)
  },
}

// ============================================
// WebSocket API
// ============================================

export const websocketAPI = {
  // Create WebSocket for analysis progress
  createAnalysisWebSocket: (projectId: string): WebSocket => {
    const wsUrl = API_BASE_URL
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace('/api', '')
    
    return new WebSocket(
      `${wsUrl}/api/analyze-parallel/projects/${projectId}/requirements/ws`
    )
  },

  // Create WebSocket for suggestion progress
  createSuggestionWebSocket: (projectId: string): WebSocket => {
    const wsUrl = API_BASE_URL
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace('/api', '')
    
    return new WebSocket(
      `${wsUrl}/api/suggestions/projects/${projectId}/generate/ws`
    )
  },
}

// ============================================
// Export all APIs as default
// ============================================

export default {
  project: projectAPI,
  originRequirement: originRequirementAPI,
  analysis: analysisAPI,
  suggestion: suggestionAPI,
  selectedRequirement: selectedRequirementAPI,  // ← NEW!
  export: exportAPI,
  websocket: websocketAPI,
}