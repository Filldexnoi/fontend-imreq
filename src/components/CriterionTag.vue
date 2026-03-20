<!-- CriterionTag.vue - Shows §5.2.5 / EARS badge with tooltip for a criterion name -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ criterion: string }>()

interface Tag {
  label: string
  color: string        // tailwind color key
  tooltip: string
}

const CRITERION_TAGS: Record<string, Tag[]> = {
  Appropriate: [{ label: 'Appropriate', color: 'blue',   tooltip: 'ISO 29148 §5.2.5.1 — Appropriate: Requirement is suitable for its level of abstraction and avoids unnecessary design constraints.' }],
  Complete:    [{ label: 'Complete',    color: 'blue',   tooltip: 'ISO 29148 §5.2.5.2 — Complete: Requirement is self-contained and understandable without external information.' }],
  Conforming:  [{ label: 'Conforming',  color: 'blue',   tooltip: 'ISO 29148 §5.2.5.3 — Conforming: Requirement follows an approved template and writing style (ISO 29148 or EARS).' },
                { label: 'EARS',        color: 'green',  tooltip: 'EARS (Easy Approach to Requirements Syntax): Ubiquitous · Event-driven (WHEN) · State-driven (WHILE) · Unwanted behavior (IF…THEN) · Optional feature (WHERE).' }],
  Correct:     [{ label: 'Correct',     color: 'blue',   tooltip: 'ISO 29148 §5.2.5.4 — Correct: Requirement accurately represents the stakeholder need. Validated against reference documents.' }],
  Feasible:    [{ label: 'Feasible',    color: 'blue',   tooltip: 'ISO 29148 §5.2.5.5 — Feasible: Requirement can be realized within project constraints (cost, schedule, technology).' }],
  Necessary:   [{ label: 'Necessary',   color: 'blue',   tooltip: 'ISO 29148 §5.2.5.6 — Necessary: Omitting this requirement would leave a real capability gap not covered by any other requirement.' }],
  Singular:    [{ label: 'Singular',    color: 'blue',   tooltip: 'ISO 29148 §5.2.5.7 — Singular: States exactly one capability or constraint. Requirements joined by "and" covering distinct functions should be split.' }],
  Unambiguous: [{ label: 'Unambiguous', color: 'blue',   tooltip: 'ISO 29148 §5.2.5.8 — Unambiguous: Only one valid interpretation. Avoids vague terms, unclear pronouns, and subjective adjectives.' }],
  Verifiable:  [{ label: 'Verifiable',  color: 'blue',   tooltip: 'ISO 29148 §5.2.5.9 — Verifiable: Can be proven by inspection, analysis, test, or demonstration. Measurable criteria enhance verifiability.' }],
}

const colorClass: Record<string, string> = {
  blue:  'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  green: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200',
}

const tags = computed(() => CRITERION_TAGS[props.criterion] ?? [])

const activeTooltip = ref<string | null>(null)
</script>

<template>
  <span class="inline-flex items-center gap-1 flex-wrap">
    <span
      v-for="tag in tags"
      :key="tag.label"
      class="relative inline-flex"
      @mouseenter="activeTooltip = tag.label"
      @mouseleave="activeTooltip = null"
    >
      <span
        :class="['inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border cursor-help font-mono leading-none', colorClass[tag.color]]"
      >
        {{ tag.label }}
      </span>
      <!-- Tooltip -->
      <div
        v-if="activeTooltip === tag.label"
        class="absolute bottom-full left-0 mb-2 z-50 w-72 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700 p-3 pointer-events-none"
      >
        <p class="font-bold mb-1" :class="tag.color === 'green' ? 'text-green-400' : 'text-blue-400'">{{ tag.label }}</p>
        <p class="text-gray-300 leading-relaxed">{{ tag.tooltip }}</p>
        <div class="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
      </div>
    </span>
  </span>
</template>
