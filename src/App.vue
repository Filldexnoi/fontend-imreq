<!-- App.vue - Fixed to use Vue Router -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useProjectStore } from '@/stores/project';

const store = useProjectStore();

// Load projects on app mount
onMounted(async () => {
  try {
    await store.fetchProjects();
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
});
</script>

<template>
  <div class="w-full h-screen overflow-hidden">
    <router-view />
  </div>
</template>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100vh;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1f2937;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>