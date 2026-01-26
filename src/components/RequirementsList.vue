<script setup lang="ts">
import { ref, computed } from 'vue';
import UploadButton from './UploadButton.vue';
import type { Requirement } from '@/types/project';

interface Props {
  requirements: Requirement[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  fileUploaded: [file: File];
}>();

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 10;

const filteredRequirements = computed(() => {
  if (!searchQuery.value) return props.requirements;
  
  const query = searchQuery.value.toLowerCase();
  return props.requirements.filter(req => 
    req.id.toLowerCase().includes(query) ||
    req.module.toLowerCase().includes(query) ||
    req.requirement.toLowerCase().includes(query)
  );
});

const totalPages = computed(() => 
  Math.ceil(filteredRequirements.value.length / itemsPerPage)
);

const paginatedRequirements = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredRequirements.value.slice(start, end);
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const hasRequirements = computed(() => props.requirements.length > 0);

const handleFileUploaded = (file: File) => {
  emit('fileUploaded', file);
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header with Search -->
    <div class="bg-gray-700 px-6 py-4 flex items-center justify-between">
      <h2 class="text-white font-semibold">Requirements List</h2>
      
      <div v-if="hasRequirements" class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหา"
          class="w-64 px-4 py-2 pr-10 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
    </div>

    <!-- Empty State - Upload Button -->
    <div v-if="!hasRequirements" class="flex-1 flex items-center justify-center bg-gray-800">
      <UploadButton @file-uploaded="handleFileUploaded" />
    </div>

    <!-- Requirements Table -->
    <div v-else class="flex-1 overflow-hidden flex flex-col">
      <div class="flex-1 overflow-auto">
        <table class="w-full bg-white">
          <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ReqID</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Module</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requirement</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="req in paginatedRequirements" :key="req.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-900">{{ req.id }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ req.module }}</td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ req.requirement }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-gray-800 px-6 py-4 flex items-center justify-end gap-2">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-1 rounded transition text-sm',
            currentPage === page
              ? 'bg-white text-gray-900'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          ]"
        >
          {{ page }}
        </button>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="px-3 py-1 rounded transition text-sm bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ต่อไป
        </button>
      </div>
    </div>
  </div>
</template>