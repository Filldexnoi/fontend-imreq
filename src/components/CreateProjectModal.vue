<!-- Create Project Modal - Fixed Version -->
<script setup lang="ts">
import { ref } from 'vue';
import { useProjectStore } from '@/stores/project';
import { useRouter } from 'vue-router';

const projectStore = useProjectStore();
const router = useRouter();

const emit = defineEmits<{
  close: []
}>();

const projectName = ref('');
const projectDescription = ref('');
const errorMessage = ref('');

const handleSubmit = async () => {
  if (!projectName.value || !projectDescription.value) {
    errorMessage.value = 'กรุณากรอกข้อมูลให้ครบถ้วน';
    return;
  }

  try {
    errorMessage.value = '';
    const projectId = await projectStore.createProject(
      projectName.value,
      projectDescription.value
    );

    // Navigate to the new project
    router.push(`/projects/${projectId}/origin-requirements`);
    
    emit('close');
  } catch (e: any) {
    console.error('Create project error:', e);
    errorMessage.value = e.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจกต์';
  }
}

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="handleClose"
  >
    <div
      @click.stop
      class="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl mx-4"
    >
      <!-- Modal Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
          <span class="text-white text-sm font-bold">IR</span>
        </div>
        <h2 class="text-2xl font-bold text-white">สร้างโปรเจกต์ใหม่</h2>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
        <p class="text-red-400 text-sm">{{ errorMessage }}</p>
      </div>

      <!-- Project Name Input -->
      <div class="mb-6">
        <label class="block text-white text-sm mb-2">ชื่อโปรเจกต์</label>
        <input
          v-model="projectName"
          type="text"
          placeholder="ชื่อโปรเจกต์"
          class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="handleSubmit"
        />
      </div>

      <!-- Project Description Textarea -->
      <div class="mb-6">
        <label class="block text-white text-sm mb-2">คำอธิบายโปรเจกต์</label>
        <textarea
          v-model="projectDescription"
          placeholder="คำอธิบายโปรเจกต์"
          rows="4"
          class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        ></textarea>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between mt-8">
        <button
          @click="handleClose"
          class="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition"
        >
          ยกเลิก
        </button>
        <button
          @click="handleSubmit"
          :disabled="!projectName || !projectDescription || projectStore.isLoading"
          :class="[
            'px-8 py-3 rounded-full transition',
            projectName && projectDescription && !projectStore.isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          ]"
        >
          {{ projectStore.isLoading ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์' }}
        </button>
      </div>
    </div>
  </div>
</template>