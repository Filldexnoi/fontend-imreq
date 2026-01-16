<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import CreateProjectModal from '@/components/CreateProjectModal.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import NewProjectCard from '@/components/NewProjectCard.vue'

const store = useProjectStore()

const showCreateModal = ref(false)
const searchQuery = ref('')

onMounted(async () => {
  await store.fetchProjects()
})

const filteredProjects = computed(() => {
  let projects = [...store.projects]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    projects = projects.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }
  
  // Sort by updated date (most recent first)
  projects.sort((a, b) => {
    const aDate = a.updated_at || a.created_at
    const bDate = b.updated_at || b.created_at
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })
  
  return projects
})

const handleCreateProject = () => {
  showCreateModal.value = true
}

const handleCloseModal = () => {
  showCreateModal.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-900">
    <!-- Header -->
    <header class="px-8 py-6">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="text-4xl font-light text-white tracking-wide hover:opacity-80 transition">
          Im<span class="font-semibold">Req</span>
        </router-link>
        
        <!-- User Icon -->
        <button class="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition">
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
            class="text-gray-400"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Search Bar -->
    <div class="px-8 pb-6">
      <div class="relative max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาโปรเจกต์..."
          class="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-700 placeholder-gray-500"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="absolute left-3 top-3.5 text-gray-500"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
    </div>

    <!-- Main Content -->
    <main class="px-8 py-6">
      <!-- Loading State -->
      <div v-if="store.isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="i in 8"
          :key="i"
          class="bg-gray-800 rounded-3xl h-48 animate-pulse"
        ></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProjects.length === 0 && searchQuery" class="text-center py-20">
        <p class="text-gray-400 text-lg mb-4">ไม่พบโปรเจกต์ที่ตรงกับ "{{ searchQuery }}"</p>
        <button
          @click="searchQuery = ''"
          class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl transition"
        >
          ล้างการค้นหา
        </button>
      </div>

      <div v-else-if="store.projects.length === 0" class="text-center py-20">
        <p class="text-gray-400 text-lg mb-6">ยังไม่มีโปรเจกต์</p>
        <button
          @click="handleCreateProject"
          class="px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl font-light transition"
        >
          + สร้างโปรเจกต์แรก
        </button>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- New Project Card -->
        <NewProjectCard @click="handleCreateProject" />
        
        <!-- Project Cards -->
        <ProjectCard
          v-for="project in filteredProjects"
          :key="project.id"
          :project="project"
        />
      </div>
    </main>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="showCreateModal"
      @close="handleCloseModal"
    />
  </div>
</template>