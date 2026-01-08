<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  create: [projectName: string, projectDescription: string];
  close: [];
}>();

const projectName = ref('');
const projectDescription = ref('');

const handleSubmit = () => {
  if (projectName.value && projectDescription.value) {
    emit('create', projectName.value, projectDescription.value);
  }
};

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
        <div class="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
          <span class="text-white text-sm font-bold">IR</span>
        </div>
        <h2 class="text-2xl font-bold text-white">ImReq</h2>
      </div>

      <!-- Project Name Input -->
      <div class="mb-6">
        <label class="block text-white text-sm mb-2">ชื่อของโปรเจกต์</label>
        <input
          v-model="projectName"
          type="text"
          placeholder="ชื่อของโปรเจกต์"
          class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Project Description Textarea -->
      <div class="mb-6">
        <label class="block text-white text-sm mb-2">คำอธิบายเกี่ยวกับโปรเจกต์</label>
        <textarea
          v-model="projectDescription"
          placeholder="คำอธิบายเกี่ยวกับโปรเจกต์"
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
          :disabled="!projectName || !projectDescription"
          :class="[
            'px-8 py-3 rounded-full transition',
            projectName && projectDescription
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          ]"
        >
          ต่อไป
        </button>
      </div>
    </div>
  </div>
</template>