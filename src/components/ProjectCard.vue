<!-- ProjectCard -->
<script setup lang="ts">
import { ref } from 'vue';
import type { Project } from '@/types/project';
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import EditProjectModal from './EditProjectModal.vue'

interface Props {
  project: Project;
}

const props = defineProps<Props>();

const router = useRouter()
const store = useProjectStore()

const goToProject = (id : string) => {
  router.push(`/projects/${id}/origin-requirements`)
}

const showMenu = ref(false);
const isDeleting = ref(false);
const showEditModal = ref(false);

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const handleEdit = () => {
  showMenu.value = false;
  showEditModal.value = true;
};

const handleDelete = async () => {
  if (!confirm(`Are you sure you want to delete "${props.project.title}"?`)) {
    return;
  }

  showMenu.value = false;
  isDeleting.value = true;

  try {
    await store.deleteProject(props.project.id);
    // Refresh projects list after successful deletion
    await store.fetchProjects();
  } catch (error) {
    console.error('Failed to delete project:', error);
    alert('Failed to delete project');
  } finally {
    isDeleting.value = false;
  }
};

const closeMenu = () => {
  showMenu.value = false;
};

const handleProjectUpdated = () => {
  // Modal will close automatically via emit('close')
  // Projects list will be refreshed by the modal
};
</script>

<template>
  <div
    class="bg-gray-100 text-gray-900 rounded-2xl p-6 h-32 flex flex-col justify-between hover:bg-gray-200 transition cursor-pointer relative"
  >
    <div @click="goToProject(project.id)" class="flex justify-between items-start flex-1">
      <h3 class="font-semibold text-sm line-clamp-2 pr-6">
        {{ project.title }}
      </h3>
      <button
        @click.stop="toggleMenu"
        class="p-1 hover:bg-gray-300 rounded transition flex-shrink-0"
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

    <div @click="goToProject(project.id)" class="text-xs text-gray-600 space-y-0.5">
      <p>Last modified: {{ project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '-' }}</p>
      <p>Created: {{ new Date(project.created_at).toLocaleDateString() }}</p>
    </div>

    <!-- Loading overlay -->
    <div v-if="isDeleting" class="absolute inset-0 bg-gray-100 bg-opacity-80 rounded-2xl flex items-center justify-center z-20">
      <div class="flex flex-col items-center gap-2">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
        <p class="text-xs text-gray-600">Deleting...</p>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <div
      v-if="showMenu"
      class="absolute top-12 right-6 bg-white shadow-lg rounded-lg p-2 z-30 min-w-32 border border-gray-200"
    >
      <button
        @click.stop="handleEdit"
        class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>
      <button
        @click.stop="handleDelete"
        class="w-full text-left px-3 py-2 hover:bg-red-50 rounded text-sm text-red-600 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Delete
      </button>
    </div>

    <!-- Overlay to close menu -->
    <div
      v-if="showMenu"
      @click.stop="closeMenu"
      class="fixed inset-0 z-20"
    ></div>

    <!-- Edit Modal -->
    <EditProjectModal
      v-if="showEditModal"
      :project="project"
      @close="showEditModal = false"
      @updated="handleProjectUpdated"
    />
  </div>
</template>