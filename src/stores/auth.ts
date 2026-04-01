// Auth Store - Authentication state management
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types/auth'
import { authAPI } from '@/services/api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const currentUser = computed(() => user.value)

  // Initialize auth from localStorage
  const initializeAuth = async () => {
    if (initialized.value) return

    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser)
        // Verify token is still valid by fetching current user
        const currentUserData = await authAPI.getCurrentUser()
        user.value = currentUserData
        localStorage.setItem(USER_KEY, JSON.stringify(currentUserData))
      } catch (err) {
        // Token expired or invalid, clear auth
        console.error('Token validation failed:', err)
        clearAuth()
      }
    }

    initialized.value = true
  }

  // Login
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: AuthResponse = await authAPI.login(credentials)

      token.value = response.access_token
      user.value = response.user

      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, response.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))

      return true
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Register - creates user then auto-login
  const register = async (data: RegisterRequest): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      // First, register the user
      await authAPI.register(data)

      // Then auto-login with the same credentials
      const loginSuccess = await login({
        identifier: data.username,
        password: data.password
      })

      return loginSuccess
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Logout
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (err) {
      // Ignore errors, still clear local state
      console.error('Logout API error:', err)
    }

    clearAuth()
  }

  // Clear auth state
  const clearAuth = () => {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  // Clear error
  const clearError = () => {
    error.value = null
  }

  // Get token for API calls
  const getToken = () => token.value

  return {
    // State
    user,
    token,
    isLoading,
    error,
    initialized,

    // Getters
    isAuthenticated,
    currentUser,

    // Actions
    initializeAuth,
    login,
    register,
    logout,
    clearAuth,
    clearError,
    getToken
  }
})
