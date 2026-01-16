// Project types
export interface Project {
  id: string
  title: string
  description: string
  created_at: string
  updated_at?: string
}

export interface ProjectCreate {
  title: string
  description: string
}

// Origin Requirement types
export interface OriginRequirement {
  id: string
  req_id: string
  project_id: string
  module: string
  requirement: string
  created_at: string
  updated_at?: string
}

// Analyzed Requirement types
export interface AnalyzedRequirement {
  id: string
  req_id: string
  project_id: string
  module: string
  requirement: string
  score: string  // e.g., "7/9"
  characteristics: string[]  // Array of passed criteria
  evaluation: Record<string, string>  // Failed criteria with reasons
  created_at: string
  updated_at?: string
}

// Suggested Requirement types
export interface SuggestedRequirement {
  id: string
  req_id: string
  project_id: string
  module: string
  original_requirement: string
  suggested_requirement: string
  original_score: string
  improvements: Record<string, string>  // What was fixed per criterion
  created_at: string
  updated_at?: string
}

// Selected Requirement types
export interface SelectedRequirement {
  id: string
  req_id: string
  project_id: string
  module: string
  requirement: string
  created_at: string
  updated_at?: string
}

// CSV Upload types
export interface ColumnMapping {
  req_id: string
  module: string
  requirement: string
}

export interface UploadResponse {
  inserted_rows: number
}

// Analysis types
export interface AnalysisResponse {
  message: string
  method: string
  analyzed_count: number
  total_requirements: number
  api_calls_used: number
  workers: number
  summary: AnalysisSummary
  performance: {
    method: string
    workers: number
    detail_level: string
  }
}

export interface AnalysisSummary {
  total_analyzed: number
  average_score: string
  recommendations: string
  analysis_method: string
}

export interface SingleAnalysisResponse {
  req_id: string
  score: string
  characteristics: string[]
  evaluation: Record<string, string>
  detailed_results: DetailedResult[]
  method: string
}

export interface DetailedResult {
  criterion: string
  pass: boolean
  score: number
  reason: string
  suggestion: string
}

// Suggestion types
export interface SuggestionResponse {
  message: string
  saved_count: number
  summary: SuggestionSummary
  performance: {
    method: string
    workers: number
  }
}

export interface SuggestionSummary {
  total_analyzed: number
  needs_improvement: number
  already_perfect: number
  suggestions_generated: number
  failed?: number
  message: string
}

export interface SingleSuggestionResponse {
  req_id: string
  original_requirement: string
  suggested_requirement: string
  original_score: string
  improvements: Record<string, string>
  explanation?: string
  message: string
}

// WebSocket Progress types
export interface ProgressMessage {
  type: 'start' | 'progress' | 'complete' | 'saved' | 'error'
  completed?: number
  total?: number
  percentage?: number
  message?: string
  result?: any
  saved_count?: number
}

// Export types
export interface ExportUrls {
  selected: string
}

// ISO 29148 Criteria
export type ISO29148Criterion =
  | 'Appropriate'
  | 'Complete'
  | 'Conforming'
  | 'Correct'
  | 'Feasible'
  | 'Necessary'
  | 'Singular'
  | 'Unambiguous'
  | 'Verifiable'

export const ISO29148_CRITERIA: ISO29148Criterion[] = [
  'Appropriate',
  'Complete',
  'Conforming',
  'Correct',
  'Feasible',
  'Necessary',
  'Singular',
  'Unambiguous',
  'Verifiable',
]

export const ISO29148_DESCRIPTIONS: Record<ISO29148Criterion, string> = {
  Appropriate: 'ระดับความละเอียดเหมาะสม',
  Complete: 'ครบถ้วนสมบูรณ์',
  Conforming: 'ตรงตามมาตรฐาน',
  Correct: 'ถูกต้องแม่นยำ',
  Feasible: 'ทำได้จริง',
  Necessary: 'จำเป็นต้องมี',
  Singular: 'ระบุสิ่งเดียว',
  Unambiguous: 'ไม่คลุมเครือ',
  Verifiable: 'วัดผลได้',
}

// API Error type
export interface APIError {
  detail: string
  status?: number
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}