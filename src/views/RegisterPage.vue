<!-- RegisterPage.vue - User Registration -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const username = ref('')
const fullName = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const localError = ref('')

const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return true
  return password.value === confirmPassword.value
})

const isFormValid = computed(() => {
  return (
    email.value &&
    username.value &&
    password.value &&
    confirmPassword.value &&
    passwordsMatch.value &&
    password.value.length >= 6
  )
})

const handleSubmit = async () => {
  if (!isFormValid.value) {
    return
  }

  localError.value = ''
  isSubmitting.value = true
  authStore.clearError()

  const success = await authStore.register({
    email: email.value,
    username: username.value,
    password: password.value,
    full_name: fullName.value || undefined
  })

  isSubmitting.value = false

  if (success) {
    router.push('/projects')
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
          <span class="text-white text-2xl font-bold">IR</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p class="text-gray-400">Sign up to get started with IMREQ</p>
      </div>

      <!-- Register Form -->
      <div class="bg-gray-800 rounded-2xl p-8">
        <!-- Error Message -->
        <div
          v-if="authStore.error || localError"
          class="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg"
        >
          <p class="text-red-400 text-sm">{{ authStore.error || localError }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email Field -->
          <div>
            <label class="block text-white text-sm font-medium mb-2">
              Email <span class="text-red-400">*</span>
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              class="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="isSubmitting"
            />
          </div>

          <!-- Username Field -->
          <div>
            <label class="block text-white text-sm font-medium mb-2">
              Username <span class="text-red-400">*</span>
            </label>
            <input
              v-model="username"
              type="text"
              placeholder="Choose a username"
              class="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="isSubmitting"
            />
          </div>

          <!-- Full Name Field -->
          <div>
            <label class="block text-white text-sm font-medium mb-2">
              Full Name <span class="text-gray-500">(optional)</span>
            </label>
            <input
              v-model="fullName"
              type="text"
              placeholder="Enter your full name"
              class="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :disabled="isSubmitting"
            />
          </div>

          <!-- Password Field -->
          <div>
            <label class="block text-white text-sm font-medium mb-2">
              Password <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Create a password (min 6 characters)"
                class="w-full px-4 py-3 pr-12 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="isSubmitting"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg
                  v-if="showPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <p v-if="password && password.length < 6" class="text-yellow-400 text-xs mt-1">
              Password must be at least 6 characters
            </p>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label class="block text-white text-sm font-medium mb-2">
              Confirm Password <span class="text-red-400">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              class="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500 focus:ring-red-500': confirmPassword && !passwordsMatch }"
              :disabled="isSubmitting"
            />
            <p v-if="confirmPassword && !passwordsMatch" class="text-red-400 text-xs mt-1">
              Passwords do not match
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting || !isFormValid"
            class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg
              v-if="isSubmitting"
              class="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {{ isSubmitting ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center">
          <div class="flex-1 border-t border-gray-600"></div>
          <span class="px-4 text-gray-400 text-sm">or</span>
          <div class="flex-1 border-t border-gray-600"></div>
        </div>

        <!-- Login Link -->
        <div class="text-center">
          <p class="text-gray-400">
            Already have an account?
            <button
              @click="goToLogin"
              class="text-blue-400 hover:text-blue-300 font-medium ml-1"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
