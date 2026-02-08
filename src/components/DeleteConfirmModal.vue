<!-- DeleteConfirmModal.vue -->
<script setup lang="ts">
interface Props {
  projectTitle: string;
}

defineProps<Props>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-700">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-900 bg-opacity-50 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-red-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-white">Delete Project</h2>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <p class="text-gray-300 mb-3">
          Are you sure you want to delete this project?
        </p>
        <div class="bg-gray-900 rounded-lg p-3 border border-gray-700">
          <p class="font-medium text-white">{{ projectTitle }}</p>
        </div>
        <p class="text-sm text-red-400 mt-3 flex items-start gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>This action cannot be undone. All data associated with this project will be permanently deleted.</span>
        </p>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 bg-gray-900 bg-opacity-50 rounded-b-xl flex justify-end gap-3 border-t border-gray-700">
        <button
          @click="emit('cancel')"
          class="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-lg hover:bg-gray-600 transition text-sm font-medium"
        >
          Cancel
        </button>
        <button
          @click="emit('confirm')"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
        >
          Delete Project
        </button>
      </div>
    </div>
  </div>
</template>