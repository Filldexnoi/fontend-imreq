<!-- CriteriaReference.vue - ISO 29148 §5.2.5 criteria + EARS reference panel -->
<script setup lang="ts">
import { ref } from 'vue'

const show = ref(false)
const activeTab = ref<'criteria' | 'ears' | 'iso29148'>('criteria')

const criteria = [
  {
    name: 'Appropriate',
    section: '§5.2.5.1',
    icon: '✓',
    color: 'blue',
    short: 'Suitable level of abstraction for its entity.',
    detail: 'The requirement is appropriate for the level of entity to which it refers. It avoids unnecessary constraints on architecture or design, allowing implementation independence to the extent possible.',
    tip: 'Don\'t specify "how" to implement — focus on "what" the system must do.',
  },
  {
    name: 'Complete',
    section: '§5.2.5.2',
    icon: '◉',
    color: 'green',
    short: 'Self-contained; no external info needed to understand it.',
    detail: 'The requirement sufficiently describes the necessary capability, characteristic, constraint, or quality factor to meet the entity need without needing other information to understand it.',
    tip: 'Avoid references like "as described elsewhere" or "TBD".',
  },
  {
    name: 'Conforming',
    section: '§5.2.5.3',
    icon: '⬡',
    color: 'indigo',
    short: 'Follows the project\'s approved template and style.',
    detail: 'The individual item conforms to an approved standard template and style for writing requirements, when applicable (e.g., ISO 29148 or EARS syntax).',
    tip: 'Use "shall" for mandatory requirements. ISO 29148: "The [system] shall [action]". EARS: "WHEN [trigger], the [system] shall [action]".',
  },
  {
    name: 'Correct',
    section: '§5.2.5.4',
    icon: '★',
    color: 'yellow',
    short: 'Accurately represents the actual stakeholder need.',
    detail: 'The requirement is an accurate representation of the entity need from which it was transformed. It does not introduce errors or misrepresent the original intent.',
    tip: 'Requires domain knowledge or reference documents (SRS, user stories, BRD) to validate.',
  },
  {
    name: 'Feasible',
    section: '§5.2.5.5',
    icon: '⚡',
    color: 'orange',
    short: 'Realizable within cost, schedule, and technical constraints.',
    detail: 'The requirement can be realized within system constraints (e.g., cost, schedule, technical) with acceptable risk. Infeasible requirements should be revised or removed.',
    tip: 'Requires project context documents to assess accurately.',
  },
  {
    name: 'Necessary',
    section: '§5.2.5.6',
    icon: '◆',
    color: 'red',
    short: 'Without it, there is a real capability deficiency.',
    detail: 'The requirement defines an essential capability or constraint. If omitted, a deficiency exists that no other requirement can cover. It must be currently applicable — not obsolete.',
    tip: 'Requires reference to system scope documents to validate necessity.',
  },
  {
    name: 'Singular',
    section: '§5.2.5.7',
    icon: '①',
    color: 'purple',
    short: 'States exactly one capability, constraint, or quality factor.',
    detail: 'The requirement states a single capability, characteristic, constraint, or quality factor. A single requirement may have multiple conditions under which it applies, but must not bundle separate functions.',
    tip: 'Watch for "and" connecting two distinct functions — split those into separate requirements.',
  },
  {
    name: 'Unambiguous',
    section: '§5.2.5.8',
    icon: '◎',
    color: 'teal',
    short: 'Only one valid interpretation possible.',
    detail: 'The requirement is stated so that it can be interpreted in only one way. It uses simple, concise language and avoids vague terms, pronouns without clear referents, and subjective adjectives.',
    tip: 'Avoid: "fast", "easy", "robust", "user-friendly", "appropriate", "etc."',
  },
  {
    name: 'Verifiable',
    section: '§5.2.5.9',
    icon: '⊛',
    color: 'pink',
    short: 'Can be proven by inspection, analysis, test, or demo.',
    detail: 'The requirement is structured and worded such that its realization can be proven (verified) to the customer\'s satisfaction. Verifiability is enhanced when the requirement is measurable.',
    tip: 'Replace superlatives ("maximum", "minimum", "best") with exact numbers. E.g., "within 2 seconds" instead of "quickly".',
  },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
}

const earsPrterns = [
  {
    type: 'Ubiquitous',
    keyword: 'always',
    color: 'blue',
    template: 'The [system] shall [action].',
    example: 'The system shall encrypt all stored passwords using bcrypt.',
    when: 'Requirement is always active — no trigger or condition needed.',
  },
  {
    type: 'Event-driven',
    keyword: 'WHEN',
    color: 'green',
    template: 'WHEN [trigger event], the [system] shall [action].',
    example: 'WHEN the user submits the login form, the system shall validate credentials within 1 second.',
    when: 'Requirement is triggered by a discrete event.',
  },
  {
    type: 'State-driven',
    keyword: 'WHILE',
    color: 'purple',
    template: 'WHILE [system state], the [system] shall [action].',
    example: 'WHILE the user is logged in, the system shall display the session timeout counter.',
    when: 'Requirement is active only during a sustained state.',
  },
  {
    type: 'Unwanted behavior',
    keyword: 'IF … THEN',
    color: 'red',
    template: 'IF [unwanted condition], THEN the [system] shall [response].',
    example: 'IF the database connection fails, THEN the system shall display an error message and retry after 5 seconds.',
    when: 'Requirement handles an error or undesired situation.',
  },
  {
    type: 'Optional feature',
    keyword: 'WHERE',
    color: 'orange',
    template: 'WHERE [optional feature is included], the [system] shall [action].',
    example: 'WHERE the export module is enabled, the system shall allow users to download reports in CSV format.',
    when: 'Requirement applies only when an optional feature is present.',
  },
]

const earsColorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  red: 'bg-red-50 border-red-200 text-red-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
}
const earsKeywordColor: Record<string, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  red: 'bg-red-600',
  orange: 'bg-orange-600',
}

const writingTips = [
  'Use active voice: "The system shall..." not "It shall be ensured that..."',
  'One requirement = one function. Split compound requirements using "and".',
  'Include measurable values: numbers, percentages, time units, counts.',
  'Avoid pronouns without clear referents ("it", "they", "this").',
  'Define all acronyms and technical terms in a glossary.',
  'Use positive statements: "shall display" not "shall not fail to display".',
]
</script>

<template>
  <!-- Trigger button -->
  <button
    @click="show = true"
    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
    title="View ISO 29148 criteria & EARS reference"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
    Reference
  </button>

  <!-- Slide-over panel -->
  <Teleport to="body">
    <Transition name="slide">
      <div v-if="show" class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-40" @click="show = false"></div>

        <!-- Panel -->
        <div class="relative w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700 flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-white">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                </svg>
              </div>
              <div>
                <h2 class="text-white font-semibold text-sm">Requirement Quality Reference</h2>
                <p class="text-gray-400 text-xs">ISO/IEC/IEEE 29148 · EARS</p>
              </div>
            </div>
            <button @click="show = false" class="p-1.5 hover:bg-gray-700 rounded-lg transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              @click="activeTab = 'criteria'"
              :class="['px-5 py-3 text-sm font-medium transition border-b-2', activeTab === 'criteria' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700']"
            >
              9 Criteria
              <span class="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">§5.2.5</span>
            </button>
            <button
              @click="activeTab = 'ears'"
              :class="['px-5 py-3 text-sm font-medium transition border-b-2', activeTab === 'ears' ? 'border-green-600 text-green-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700']"
            >
              EARS Patterns
              <span class="ml-1.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">5 types</span>
            </button>
            <button
              @click="activeTab = 'iso29148'"
              :class="['px-5 py-3 text-sm font-medium transition border-b-2', activeTab === 'iso29148' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700']"
            >
              ISO 29148 Style
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto">

            <!-- Tab: 9 Criteria -->
            <div v-if="activeTab === 'criteria'" class="p-5 space-y-3">
              <p class="text-xs text-gray-500 mb-4">Each requirement is evaluated against all 9 quality characteristics defined in ISO/IEC/IEEE 29148:2018 §5.2.5.</p>
              <div
                v-for="c in criteria"
                :key="c.name"
                class="border rounded-xl overflow-hidden"
                :class="colorMap[c.color].split(' ')[2]"
              >
                <div class="flex items-start gap-3 p-3" :class="colorMap[c.color]">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-lg leading-none flex-shrink-0">{{ c.icon }}</span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-bold text-sm">{{ c.name }}</span>
                        <span class="text-xs opacity-70 font-mono">{{ c.section }}</span>
                      </div>
                      <p class="text-xs mt-0.5 opacity-80">{{ c.short }}</p>
                    </div>
                  </div>
                </div>
                <div class="bg-white px-4 py-3 space-y-2">
                  <p class="text-xs text-gray-700 leading-relaxed">{{ c.detail }}</p>
                  <div class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-500 flex-shrink-0 mt-0.5"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="12" r="10"/><path d="M12 17h.01"/></svg>
                    <p class="text-xs text-amber-700">{{ c.tip }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: EARS Patterns -->
            <div v-if="activeTab === 'ears'" class="p-5 space-y-4">
              <p class="text-xs text-gray-500 mb-2">EARS (Easy Approach to Requirements Syntax) provides 5 patterns that make requirements precise and testable by using structured keywords.</p>
              <div class="bg-gray-900 rounded-xl p-4 text-xs text-gray-300 mb-4 font-mono leading-relaxed">
                <span class="text-gray-500"># General EARS structure</span><br/>
                <span class="text-green-400">[optional: WHEN/WHILE/IF/WHERE condition]</span>,<br/>
                <span class="text-blue-400">the [system name]</span>
                <span class="text-yellow-400"> shall </span>
                <span class="text-white">[action/behavior]</span>
                <span class="text-gray-400"> [optional: measurable criteria]</span>.
              </div>

              <div
                v-for="p in earsPrterns"
                :key="p.type"
                class="border rounded-xl overflow-hidden"
                :class="earsColorMap[p.color].split(' ')[1]"
              >
                <div class="flex items-center gap-3 px-4 py-3" :class="earsColorMap[p.color]">
                  <span :class="['px-2.5 py-1 rounded-lg text-white text-xs font-bold font-mono flex-shrink-0', earsKeywordColor[p.color]]">{{ p.keyword }}</span>
                  <span class="font-semibold text-sm">{{ p.type }}</span>
                </div>
                <div class="bg-white px-4 py-3 space-y-2">
                  <p class="text-xs text-gray-500 italic">{{ p.when }}</p>
                  <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs text-gray-700">{{ p.template }}</div>
                  <div class="flex items-start gap-2">
                    <span class="text-xs text-gray-400 flex-shrink-0 mt-0.5">e.g.</span>
                    <p class="text-xs text-gray-600 italic">{{ p.example }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: ISO 29148 Style -->
            <div v-if="activeTab === 'iso29148'" class="p-5 space-y-4">
              <p class="text-xs text-gray-500">ISO/IEC/IEEE 29148 general guidelines for writing well-formed requirements.</p>

              <!-- Modal verbs -->
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                  <p class="text-sm font-semibold text-gray-700">Modal Verbs</p>
                </div>
                <div class="bg-white divide-y divide-gray-100">
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded font-mono flex-shrink-0">shall</span>
                    <p class="text-xs text-gray-700">Mandatory requirement — must be implemented. Use for all functional requirements.</p>
                  </div>
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded font-mono flex-shrink-0">should</span>
                    <p class="text-xs text-gray-700">Recommended but not mandatory. Use sparingly — prefer "shall" when possible.</p>
                  </div>
                  <div class="flex items-start gap-3 px-4 py-3">
                    <span class="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded font-mono flex-shrink-0">avoid</span>
                    <p class="text-xs text-gray-700">Avoid: "will", "must", "can", "may", "might" — these are ambiguous regarding obligation.</p>
                  </div>
                </div>
              </div>

              <!-- Pattern -->
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                  <p class="text-sm font-semibold text-gray-700">Standard Pattern</p>
                </div>
                <div class="bg-white px-4 py-3 space-y-3">
                  <div class="bg-gray-900 rounded-lg p-3 font-mono text-xs leading-relaxed">
                    <span class="text-blue-400">The [system]</span>
                    <span class="text-yellow-400"> shall </span>
                    <span class="text-green-400">[action]</span>
                    <span class="text-white"> [object]</span>
                    <span class="text-gray-400"> [measurable criteria]</span><span class="text-gray-500">.</span>
                  </div>
                  <div class="space-y-2 text-xs">
                    <div class="flex gap-2"><span class="text-green-600 font-medium flex-shrink-0">Good:</span><span class="text-gray-700 italic">"The system shall respond to user input within 200 milliseconds."</span></div>
                    <div class="flex gap-2"><span class="text-red-500 font-medium flex-shrink-0">Avoid:</span><span class="text-gray-500 line-through italic">"The system should be fast and user-friendly."</span></div>
                  </div>
                </div>
              </div>

              <!-- Words to avoid -->
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                  <p class="text-sm font-semibold text-gray-700">Words to Avoid (Ambiguous)</p>
                </div>
                <div class="bg-white px-4 py-3">
                  <div class="flex flex-wrap gap-2">
                    <span v-for="w in ['user-friendly','easy to use','robust','reliable','fast','efficient','flexible','scalable','maintainable','simple','intuitive','adequate','appropriate','as needed','etc.','TBD','and/or']" :key="w"
                      class="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-mono">{{ w }}</span>
                  </div>
                </div>
              </div>

              <!-- Writing tips -->
              <div class="border border-gray-200 rounded-xl overflow-hidden">
                <div class="bg-gray-100 px-4 py-2.5 border-b border-gray-200">
                  <p class="text-sm font-semibold text-gray-700">Writing Tips</p>
                </div>
                <ul class="bg-white divide-y divide-gray-100">
                  <li v-for="tip in writingTips" :key="tip" class="flex items-start gap-2 px-4 py-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-500 flex-shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p class="text-xs text-gray-700">{{ tip }}</p>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
</style>
