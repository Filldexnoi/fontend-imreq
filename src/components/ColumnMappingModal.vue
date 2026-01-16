<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  fileName: string
  columns: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  confirm: [mapping: ColumnMapping]
  close: []
}>()

interface ColumnMapping {
  reqId: string
  module: string
  requirement: string
}

const mapping = ref<ColumnMapping>({
  reqId: '',
  module: '',
  requirement: ''
})

const handleConfirm = () => {
  if (isValid()) {
    emit('confirm', mapping.value)
  }
}

const handleClose = () => {
  emit('close')
}

const isValid = () => {
  return mapping.value.reqId && mapping.value.module && mapping.value.requirement
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="handleClose"
  >
    <div
      @click.stop
      class="bg-gray-800 rounded-2xl p-8 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <!-- Modal Header -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-white mb-2">จับคู่คอลัมน์</h2>
        <p class="text-gray-400 text-sm">ไฟล์: {{ fileName }}</p>
      </div>

      <!-- Mapping Fields -->
      <div class="space-y-4 mb-8">
        <!-- ReqID Mapping -->
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="mb-3">
            <h3 class="text-white font-semibold mb-1">ReqID</h3>
            <p class="text-gray-400 text-xs">
              * รหัสที่ใช้ระบุความต้องการแต่ละตัว (เช่น REQ001, REQ002)
            </p>
          </div>
          <select
            v-model="mapping.reqId"
            class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>เลือกคอลัมน์</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- Module Mapping -->
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="mb-3">
            <h3 class="text-white font-semibold mb-1">Module</h3>
            <p class="text-gray-400 text-xs">
              * กลุ่มหรือหมวดหมู่ของความต้องการ (เช่น User Authentication, Transaction Recording)
            </p>
          </div>
          <select
            v-model="mapping.module"
            class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>เลือกคอลัมน์</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- Requirement Mapping -->
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="mb-3">
            <h3 class="text-white font-semibold mb-1">Requirement</h3>
            <p class="text-gray-400 text-xs">
              * รายละเอียดของความต้องการของระบบ
            </p>
          </div>
          <select
            v-model="mapping.requirement"
            class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>เลือกคอลัมน์</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>
      </div>

      <!-- Preview Section -->
      <div v-if="isValid()" class="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 class="text-white font-semibold mb-3">ตัวอย่างการจับคู่</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between text-gray-300">
            <span>ReqID:</span>
            <span class="text-blue-400">{{ mapping.reqId }}</span>
          </div>
          <div class="flex justify-between text-gray-300">
            <span>Module:</span>
            <span class="text-blue-400">{{ mapping.module }}</span>
          </div>
          <div class="flex justify-between text-gray-300">
            <span>Requirement:</span>
            <span class="text-blue-400">{{ mapping.requirement }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between">
        <button
          @click="handleClose"
          class="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition"
        >
          ยกเลิก
        </button>
        <button
          @click="handleConfirm"
          :disabled="!isValid()"
          :class="[
            'px-8 py-3 rounded-full transition',
            isValid()
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          ]"
        >
          บันทึก
        </button>
      </div>
    </div>
  </div>
</template>