<script setup lang="ts">
import { ref } from 'vue';
import ProjectCard from './components/ProjectCard.vue';
import NewProjectCard from './components/NewProjectCard.vue';
import StudioPage from './components/StudioPage.vue';
import type { Project } from './types/project';

const projects = ref<Project[]>([
  {
    id: 1,
    title: 'เว็บไซต์สอนกันกับเรื่องสำเจอร์',
    lastModified: '2 hours ago',
    created: 'Aug 10, 2025'
  },
  {
    id: 2,
    title: 'แอปพลิเคชันสำหรับดูแลบัญชี',
    lastModified: '2 hours ago',
    created: 'Aug 10, 2025'
  },
  {
    id: 3,
    title: 'website omakase',
    lastModified: '2 hours ago',
    created: 'Aug 10, 2025'
  },
  {
    id: 4,
    title: 'Personal Money Management app',
    lastModified: '2 hours ago',
    created: 'Aug 10, 2025'
  },
  {
    id: 5,
    title: 'Project A',
    lastModified: '2 hours ago',
    created: 'Aug 10, 2025'
  }
]);

const selectedProject = ref<Project | null>(null);

const handleCreate = () => {
  const newProject: Project = {
    id: Date.now(),
    title: 'New Project',
    lastModified: 'Just now',
    created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
  projects.value.unshift(newProject);
  selectedProject.value = newProject;
};

const handleOpenProject = (project: Project) => {
  selectedProject.value = project;
};

const handleEdit = (id: number) => {
  const project = projects.value.find(p => p.id === id);
  if (project) {
    selectedProject.value = project;
  }
};

const handleDuplicate = (id: number) => {
  const project = projects.value.find(p => p.id === id);
  if (project) {
    const duplicated: Project = {
      ...project,
      id: Date.now(),
      title: `${project.title} (Copy)`,
      lastModified: 'Just now',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    projects.value.unshift(duplicated);
  }
};

const handleDelete = (id: number) => {
  projects.value = projects.value.filter(p => p.id !== id);
};

const handleBack = () => {
  selectedProject.value = null;
};
</script>

<template>
  <!-- Studio Page View -->
  <StudioPage
    v-if="selectedProject"
    :project="selectedProject"
    @back="handleBack"
  />

  <!-- Dashboard View -->
  <div v-else class="w-full h-full bg-gray-900 text-white flex flex-col">
    <!-- Header -->
    <header class="flex justify-between items-center px-8 py-6 flex-shrink-0">
      <h1 class="text-4xl font-bold">
        Im<span class="font-light">Req</span>
      </h1>
      <button class="p-2 hover:bg-gray-800 rounded-full transition">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    </header>

    <!-- Projects Grid with Scroll -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        <NewProjectCard @create="handleCreate" />
        
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          @click="handleOpenProject(project)"
          @edit="handleEdit"
          @duplicate="handleDuplicate"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>