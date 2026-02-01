// src/types/auth.ts - Authentication Types

export interface User {
  id: string
  email: string
  username: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  last_login: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  full_name?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface AuthError {
  detail: string
}
