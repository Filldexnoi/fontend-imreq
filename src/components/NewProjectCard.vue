<!-- New Project Card -->
<script setup lang="ts">
const emit = defineEmits<{
  create: [];
}>();

const handleCreate = () => {
  emit('create');
};
</script>

<template>
  <button
    @click="handleCreate"
    class="bg-gray-100 text-gray-900 rounded-2xl p-8 h-32 flex items-center justify-center hover:bg-gray-200 transition group"
  >
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
      class="mr-3 group-hover:scale-110 transition"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    <span class="text-xl font-semibold">New</span>
  </button>
</template>