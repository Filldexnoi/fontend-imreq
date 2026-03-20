<!-- Upload Button Component -->
<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  fileUploaded: [file: File]
}>()

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]!
    selectedFile.value = file
    emit('fileUploaded', file)
  }
  // Reset input so the same file can be re-selected
  target.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0]!
    selectedFile.value = file
    emit('fileUploaded', file)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const triggerFileInput = () => {
  const fileInput = document.getElementById('file-upload-btn') as HTMLInputElement
  fileInput?.click()
}
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @click="triggerFileInput"
      :class="[
        'text-center cursor-pointer transition p-8',
        isDragging ? 'scale-105' : ''
      ]"
    >
      <input
        id="file-upload-btn"
        type="file"
        accept=".csv"
        @change="handleFileSelect"
        class="hidden"
      />
      
      <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 hover:bg-blue-700 transition">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-white"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <h3 class="text-white text-lg font-semibold mb-2">Upload Data File</h3>
      <p class="text-gray-400 text-sm">Only .CSV files are supported</p>
    </div>
  </div>
</template>