<script setup lang="ts">
import { ref } from 'vue';
import type { Project } from '@/types/project';

interface Props {
  project: Project;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  back: [];
}>();

const showLeftPanel = ref(true);

const toggleLeftPanel = () => {
  showLeftPanel.value = !showLeftPanel.value;
};

const handleBack = () => {
  emit('back');
};
</script>

<template>
  <div class="w-full h-full bg-gray-800 flex flex-col">
    <!-- Header -->
    <header class="flex items-center gap-4 px-6 py-4 bg-gray-900 flex-shrink-0">
      <button
        @click="handleBack"
        class="p-2 hover:bg-gray-800 rounded transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
          IR
        </div>
        <h1 class="text-xl font-semibold text-white">{{ project.title }}</h1>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar -->
      <aside
        v-if="showLeftPanel"
        class="w-64 bg-gray-900 border-r border-gray-700 flex flex-col"
      >
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 class="text-white font-semibold">Studio</h2>
          <button
            @click="toggleLeftPanel"
            class="p-1 hover:bg-gray-800 rounded transition text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div class="space-y-3">
            <button class="w-full p-3 bg-gray-800 hover:bg-gray-750 rounded-lg text-left transition">
              <div class="flex items-center gap-3 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <span class="text-sm">Feature Requirement</span>
              </div>
            </button>

            <button class="w-full p-3 bg-gray-800 hover:bg-gray-750 rounded-lg text-left transition">
              <div class="flex items-center gap-3 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="text-sm">Export requirements</span>
              </div>
            </button>

            <button class="w-full p-3 bg-gray-800 hover:bg-gray-750 rounded-lg text-left transition">
              <div class="flex items-center gap-3 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
                  <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/>
                </svg>
                <span class="text-sm">Compare Versions</span>
              </div>
            </button>

            <button class="w-full p-3 bg-gray-800 hover:bg-gray-750 rounded-lg text-left transition">
              <div class="flex items-center gap-3 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="text-sm">Download Report</span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <!-- Toggle Button (when sidebar is hidden) -->
      <button
        v-if="!showLeftPanel"
        @click="toggleLeftPanel"
        class="absolute left-4 top-20 p-2 bg-gray-900 hover:bg-gray-800 rounded transition text-gray-400 z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </button>

      <!-- Main Content Area -->
      <main class="flex-1 flex items-center justify-center bg-gray-800 relative">
        <div class="text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
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
          <h2 class="text-xl text-white mb-2">Add a Source to get started</h2>
          <button class="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition">
            Upload a source
          </button>
        </div>

        <!-- Requirements List Tab -->
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-lg px-6 py-3">
          <span class="text-white text-sm">Requirements List</span>
        </div>
      </main>
    </div>
  </div>
</template>