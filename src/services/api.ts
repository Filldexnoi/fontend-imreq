// src/services/api.ts - Complete API Service Module
import type {
  Project,
  OriginRequirement,
  AnalyzedRequirement,
  SuggestedRequirement,
  SelectedRequirement,
  ColumnMapping
} from '@/types/project'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'auth_token'

// ============================================
// Helper Functions
// ============================================

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// Helper function for fetch requests (with auth)
async function fetchAPI(url: string, options?: RequestInit) {
  const token = getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'API request failed' }))
    throw new Error(error.detail || 'API request failed')
  }

  return response.json()
}

// Helper function for file upload (with auth)
async function uploadFile(url: string, formData: FormData) {
  const token = getAuthToken()

  const headers: Record<string, string> = {}

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    body: formData,
    headers,
    // Don't set Content-Type header - browser will set it with boundary
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || 'Upload failed')
  }

  return response.json()
}

// ✅ NEW: Helper function for file update (with auth)
async function updateWithFile(url: string, formData: FormData) {
  const token = getAuthToken()

  const headers: Record<string, string> = {}

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'PUT',
    body: formData,
    headers,
    // Don't set Content-Type header - browser will set it with boundary
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Update failed' }))
    throw new Error(error.detail || 'Failed to update')
  }

  return response.json()
}

// ============================================
// Auth API
// ============================================

export const authAPI = {
  // Login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: credentials.identifier,
        password: credentials.password,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }))
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  },

  // Register - returns User (not AuthResponse, user must login after)
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Registration failed' }))
      throw new Error(error.detail || 'Registration failed')
    }

    return response.json()
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return fetchAPI('/auth/me')
  },

  // Update profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return fetchAPI('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await fetchAPI('/auth/logout', { method: 'POST' })
    } catch {
      // Ignore errors on logout
    }
  },
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

  // Create project with optional files and template
  create: async (project: {
    title: string;
    description: string;
    requirement_template?: string;
    enabled_criteria?: string[] | null;
    files?: File[];
  }): Promise<{ id: string }> => {
    const formData = new FormData()
    formData.append('title', project.title)
    formData.append('description', project.description)
    formData.append('requirement_template', project.requirement_template || 'ISO29148')

    if (project.enabled_criteria != null) {
      formData.append('enabled_criteria', JSON.stringify(project.enabled_criteria))
    }

    if (project.files && project.files.length > 0) {
      project.files.forEach(file => {
        formData.append('files', file)
      })
    }

    return uploadFile('/projects', formData)
  },

  // ✅ UPDATED: Update project with optional files and template
  update: async (projectId: string, formData: FormData): Promise<Project> => {
    return updateWithFile(`/projects/${projectId}`, formData)
  },

  // Delete project
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

  // Get similarity summary (Jaccard + Doc2Vec) for a project
  getSimilarity: async (projectId: string): Promise<{
    summary: {
      total: number
      jaccard: { mean: number; median: number; min: number; max: number; min_req: string; max_req: string }
      tfidf: { mean: number; median: number; min: number; max: number; min_req: string; max_req: string }
      interpretation_counts: Record<string, number>
    }
    pairs: Array<{
      req_id: string
      original_score: string
      jaccard: number
      tfidf_sim: number
      interpretation: string
    }>
  }> => {
    return fetchAPI(`/projects/${projectId}/suggestedrequirements/similarity`)
  },
}

// ============================================
// Selected Requirements API
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

  // Upsert a single requirement selection (per-item save)
  upsertSingle: async (
    projectId: string,
    deleteReqIds: string[],
    insert: Array<{ req_id: string; module: string; requirement: string }>
  ): Promise<{ deleted: number; inserted: number }> => {
    return fetchAPI(`/projects/${projectId}/selectedrequirements`, {
      method: 'PATCH',
      body: JSON.stringify({ delete_req_ids: deleteReqIds, insert }),
    })
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
// Model Blind Test API (internal — not part of main product)
// ============================================

export const modelTestAPI = {
  run: async (
    file: File,
    mapping: { req_id: string; module: string; requirement: string },
    template: string = 'ISO29148'
  ): Promise<{
    model_a: { analysis: any; suggestions: any }
    model_b: { analysis: any; suggestions: any }
    total_requirements: number
    requirements: Array<{ req_id: string; requirement: string; module: string }>
  }> => {
    const token = localStorage.getItem('auth_token')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    formData.append('template', template)

    const response = await fetch(`${API_BASE_URL}/model-test/run`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(err.detail || 'Model test failed')
    }
    return response.json()
  },
}

// ============================================
// Export all APIs as default
// ============================================

export default {
  auth: authAPI,
  project: projectAPI,
  originRequirement: originRequirementAPI,
  analysis: analysisAPI,
  suggestion: suggestionAPI,
  selectedRequirement: selectedRequirementAPI,
  export: exportAPI,
  websocket: websocketAPI,
  modelTest: modelTestAPI,
}