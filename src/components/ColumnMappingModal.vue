<!-- Column Mapping Modal -->
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

// Use special sentinel values for "none" selections
const NONE_VALUE = '__none__'

const mapping = ref({
  reqId: NONE_VALUE,
  module: NONE_VALUE,
  requirement: ''
})

const handleConfirm = () => {
  if (isValid()) {
    emit('confirm', {
      reqId: mapping.value.reqId === NONE_VALUE ? '' : mapping.value.reqId,
      module: mapping.value.module === NONE_VALUE ? '' : mapping.value.module,
      requirement: mapping.value.requirement
    })
  }
}

const handleClose = () => {
  emit('close')
}

const isValid = () => {
  return mapping.value.requirement !== ''
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
        <h2 class="text-xl font-bold text-white mb-2">Column Mapping</h2>
        <p class="text-gray-400 text-sm">File: {{ fileName }}</p>
      </div>

      <!-- Mapping Fields -->
      <div class="space-y-4 mb-8">
        <!-- ReqID Mapping (Optional) -->
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-white font-semibold">ReqID</h3>
              <span class="text-xs text-gray-400 bg-gray-600 px-2 py-0.5 rounded">Optional</span>
            </div>
            <p class="text-gray-400 text-xs">
              Identifier for each requirement (e.g. REQ001, REQ002). If not selected, it will be auto-generated.
            </p>
          </div>
          <select
            v-model="mapping.reqId"
            class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="NONE_VALUE">None (Auto-generate)</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- Module Mapping (Optional) -->
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-white font-semibold">Module</h3>
              <span class="text-xs text-gray-400 bg-gray-600 px-2 py-0.5 rounded">Optional</span>
            </div>
            <p class="text-gray-400 text-xs">
              Group or category of the requirement (e.g. User Authentication). If not selected, this column will be hidden.
            </p>
          </div>
          <select
            v-model="mapping.module"
            class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="NONE_VALUE">None</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>

        <!-- Requirement Mapping (Required) -->
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="mb-3">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-white font-semibold">Requirement</h3>
              <span class="text-xs text-red-400 bg-red-900 bg-opacity-30 px-2 py-0.5 rounded">Required</span>
            </div>
            <p class="text-gray-400 text-xs">
              * Description of the system requirement
            </p>
          </div>
          <select
            v-model="mapping.requirement"
            class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>Select a column</option>
            <option v-for="col in columns" :key="col" :value="col">{{ col }}</option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between">
        <button
          @click="handleClose"
          class="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition"
        >
          Cancel
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
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
