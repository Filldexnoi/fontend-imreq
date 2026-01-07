<script setup lang="ts">
import { ref } from 'vue';
import type { Project } from '@/types/project';

interface Props {
  project: Project;
}

defineProps<Props>();
const emit = defineEmits<{
  edit: [id: number];
  duplicate: [id: number];
  delete: [id: number];
}>();

const showMenu = ref(false);

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const handleEdit = () => {
  emit('edit', props.project.id);
  showMenu.value = false;
};

const handleDuplicate = () => {
  emit('duplicate', props.project.id);
  showMenu.value = false;
};

const handleDelete = () => {
  emit('delete', props.project.id);
  showMenu.value = false;
};
</script>

<template>
  <div
    class="bg-gray-100 text-gray-900 rounded-2xl p-6 h-32 flex flex-col justify-between hover:bg-gray-200 transition cursor-pointer relative"
  >
    <div class="flex justify-between items-start">
      <h3 class="font-semibold text-sm line-clamp-2 pr-6">
        {{ project.title }}
      </h3>
      <button
        @click.stop="toggleMenu"
        class="p-1 hover:bg-gray-300 rounded transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
    </div>

    <div class="text-xs text-gray-600 space-y-0.5">
      <p>Last modified: {{ project.lastModified }}</p>
      <p>Created: {{ project.created }}</p>
    </div>

    <!-- Dropdown Menu -->
    <div
      v-if="showMenu"
      class="absolute top-12 right-6 bg-white shadow-lg rounded-lg p-2 z-10 min-w-32"
    >
      <button
        @click="handleEdit"
        class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
      >
        Edit
      </button>
      <button
        @click="handleDuplicate"
        class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
      >
        Duplicate
      </button>
      <button
        @click="handleDelete"
        class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-red-600"
      >
        Delete
      </button>
    </div>
  </div>
</template>