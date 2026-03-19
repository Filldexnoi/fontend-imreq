<script setup lang="ts">
import { ref, computed } from 'vue'
import { RULES_MAP } from '@/constants/rules'

const props = defineProps<{ name: string }>()

const rule = computed(() => RULES_MAP[props.name])
const showTooltip = ref(false)
</script>

<template>
  <span
    v-if="rule"
    class="relative inline-flex items-center"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <!-- Badge -->
    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300 cursor-help leading-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      {{ rule.name }}
    </span>

    <!-- Tooltip -->
    <div
      v-if="showTooltip"
      class="absolute bottom-full left-0 mb-1.5 z-50 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700 p-3 pointer-events-none"
    >
      <p class="font-semibold text-amber-400 mb-1">{{ rule.name }}</p>
      <p class="text-gray-300 leading-relaxed">{{ rule.description }}</p>
      <p class="text-gray-500 mt-1.5">ISO/IEC/IEEE 29148 §{{ rule.section }}</p>
      <!-- Arrow -->
      <div class="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
    </div>
  </span>
</template>
