<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { modelTestAPI } from '@/services/api'
import ColumnMappingModal from '@/components/ColumnMappingModal.vue'

const uploadedFile = ref<File | null>(null)
const fileColumns = ref<string[]>([])
const showMappingModal = ref(false)
const selectedTemplate = ref('ISO29148')
const isRunning = ref(false)
const result = ref<any>(null)
const errorMsg = ref('')
const revealedReqs = ref<Set<string>>(new Set())
const mapping = ref({ req_id: '', module: '', requirement: '' })
const fileInputRef = ref<HTMLInputElement | null>(null)

async function handleFileDrop(e: DragEvent) {
  e.preventDefault()
  const f = e.dataTransfer?.files?.[0]
  if (f) await loadFile(f)
}

async function handleFileInput(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) await loadFile(f)
}

async function loadFile(f: File) {
  uploadedFile.value = f
  result.value = null
  errorMsg.value = ''
  try {
    const text = await f.text()
    const firstLine = text.split('\n')[0] ?? ''
    const cols = firstLine.split(/[,;]/).map(h => h.trim().replace(/^"|"$/g, ''))
    fileColumns.value = cols
    await nextTick()
    showMappingModal.value = true
  } catch {
    errorMsg.value = 'Could not read file columns'
  }
}

function handleMappingConfirm(m: any) {
  mapping.value = { req_id: m.reqId || '', module: m.module || '', requirement: m.requirement }
  showMappingModal.value = false
}

function handleMappingClose() {
  showMappingModal.value = false
  uploadedFile.value = null
  fileColumns.value = []
}

async function runTest() {
  if (!uploadedFile.value || !mapping.value.requirement) return
  isRunning.value = true
  errorMsg.value = ''
  result.value = null
  revealedReqs.value = new Set()
  try {
    result.value = await modelTestAPI.run(uploadedFile.value, mapping.value, selectedTemplate.value)
  } catch (e: any) {
    errorMsg.value = e.message || 'Unknown error'
  } finally {
    isRunning.value = false
  }
}

function toggleReveal(reqId: string) {
  const next = new Set(revealedReqs.value)
  if (next.has(reqId)) next.delete(reqId)
  else next.add(reqId)
  revealedReqs.value = next
}

function isRevealed(reqId: string) {
  return revealedReqs.value.has(reqId)
}

// modelName returns the provider label for a given model key + req column_order
function modelName(mk: string) {
  return result.value?.reveal?.[mk] ?? mk
}

function getAnalyzed(modelKey: string, reqId: string) {
  return result.value?.[modelKey]?.analysis?.results?.find((r: any) => r.req_id === reqId) ?? null
}

function getSuggestion(modelKey: string, reqId: string) {
  return result.value?.[modelKey]?.suggestions?.results?.find((r: any) => r.req_id === reqId) ?? null
}

function scoreNum(score: string | undefined) {
  return parseInt(((score ?? '0/9').split('/')[0] ?? '0'), 10)
}

function scoreBg(score: string | undefined) {
  const n = scoreNum(score)
  if (n >= 8) return 'bg-green-500'
  if (n >= 5) return 'bg-yellow-500'
  return 'bg-red-500'
}

const requirements = computed(() => result.value?.requirements ?? [])
const ready = computed(() => !!uploadedFile.value && !!mapping.value.requirement)
const avgScore = (mk: string) => result.value?.[mk]?.analysis?.summary?.average_score ?? '—'
const sugCount = (mk: string) => result.value?.[mk]?.suggestions?.summary?.suggestions_generated ?? 0
</script>

<template>
  <div class="h-screen overflow-y-auto bg-gray-950 text-white">
    <!-- Header -->
    <div class="border-b border-gray-800 px-8 py-4 flex items-center gap-3">
      <span class="text-xs font-bold bg-yellow-500 text-black px-2 py-0.5 rounded">INTERNAL</span>
      <h1 class="text-lg font-bold">Blind Model Comparison Test</h1>
      <span class="text-gray-500 text-sm">— compare two LLMs without knowing which is which</span>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-8 space-y-6">

      <!-- Setup -->
      <div class="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-5">
        <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Setup</h2>

        <div class="flex items-end gap-6 flex-wrap">
          <div>
            <label class="block text-xs text-gray-400 mb-1">Template</label>
            <select
              v-model="selectedTemplate"
              class="bg-gray-800 text-white rounded-lg px-4 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ISO29148">ISO 29148</option>
              <option value="EARS">EARS</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div class="flex-1 min-w-60">
            <label class="block text-xs text-gray-400 mb-1">Requirements CSV</label>
            <div
              class="border-2 border-dashed rounded-xl px-5 py-4 text-center cursor-pointer hover:border-blue-500 transition"
              :class="uploadedFile ? 'border-blue-500 bg-blue-900/10' : 'border-gray-600'"
              @dragover.prevent
              @drop="handleFileDrop"
              @click="fileInputRef?.click()"
            >
              <input ref="fileInputRef" type="file" accept=".csv" class="hidden" @change="handleFileInput" />
              <template v-if="uploadedFile">
                <span class="text-blue-400 text-sm font-semibold">{{ uploadedFile.name }}</span>
                <span class="text-gray-400 text-xs ml-3">req col: <b class="text-white">{{ mapping.requirement }}</b></span>
                <button
                  class="ml-3 text-xs text-gray-500 hover:text-white underline"
                  @click.stop="uploadedFile = null; fileColumns = []; result = null; mapping = { req_id: '', module: '', requirement: '' }"
                >change</button>
              </template>
              <span v-else class="text-gray-500 text-sm">Drop CSV here or click to browse</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            :disabled="!ready || isRunning"
            :class="['px-8 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition',
              ready && !isRunning ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed']"
            @click="runTest"
          >
            <svg v-if="isRunning" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ isRunning ? 'Running both models…' : 'Run Blind Test' }}
          </button>
          <p v-if="isRunning" class="text-xs text-gray-400">
            Both models run simultaneously. Gemini processes one requirement at a time — may take a few minutes.
          </p>
        </div>

        <div v-if="errorMsg" class="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
          {{ errorMsg }}
        </div>
      </div>

      <!-- ── RESULTS ──────────────────────────────────────────────── -->
      <template v-if="result">

        <!-- Overall summary (no labels — blind) -->
        <div class="grid grid-cols-2 gap-4">
          <div v-for="mk in ['model_a', 'model_b']" :key="mk"
            class="bg-gray-900 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
            <div class="text-xs text-gray-500">{{ sugCount(mk) }} suggestion(s) generated</div>
            <div class="text-right">
              <div class="text-2xl font-bold text-white">{{ avgScore(mk) }}</div>
              <div class="text-xs text-gray-500">avg score</div>
            </div>
          </div>
        </div>

        <!-- Per-requirement -->
        <div v-for="req in requirements" :key="req.req_id" class="space-y-0">

          <!-- Req header + Reveal button -->
          <div class="bg-gray-800 border border-gray-700 rounded-t-xl px-5 py-3 flex items-start gap-3">
            <span class="text-xs font-mono font-bold text-gray-400 mt-0.5 shrink-0">{{ req.req_id }}</span>
            <span v-if="req.module" class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded mt-0.5 shrink-0">{{ req.module }}</span>
            <p class="text-sm text-gray-100 flex-1">{{ req.requirement }}</p>
            <button
              class="shrink-0 ml-2 px-3 py-1 rounded-full text-xs font-semibold transition"
              :class="isRevealed(req.req_id)
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                : 'border border-gray-600 text-gray-400 hover:border-yellow-500 hover:text-yellow-400'"
              @click="toggleReveal(req.req_id)"
            >
              {{ isRevealed(req.req_id) ? 'Hide' : 'Reveal' }}
            </button>
          </div>

          <!-- Side-by-side -->
          <div class="grid grid-cols-2 border-x border-b border-gray-700 rounded-b-xl overflow-hidden">
            <div
              v-for="(mk, idx) in (req.column_order ?? ['model_a', 'model_b'])"
              :key="mk"
              :class="['p-5', idx === 0 ? 'border-r border-gray-700' : '']"
            >
              <!-- Score + model name (shown after reveal) -->
              <div class="flex items-center justify-between mb-4">
                <span
                  v-if="isRevealed(req.req_id)"
                  class="text-xs font-bold text-yellow-400"
                >{{ modelName(mk) }}</span>
                <span v-else class="text-xs text-gray-600">—</span>
                <span
                  v-if="getAnalyzed(mk, req.req_id)"
                  :class="['text-xs font-bold text-white px-2.5 py-1 rounded-full', scoreBg(getAnalyzed(mk, req.req_id)?.score)]"
                >{{ getAnalyzed(mk, req.req_id)?.score }}</span>
              </div>

              <!-- Split -->
              <template v-if="getSuggestion(mk, req.req_id)?.is_split && getSuggestion(mk, req.req_id)?.split_requirements?.length">
                <div
                  v-for="s in getSuggestion(mk, req.req_id)?.split_requirements"
                  :key="s.req_id"
                  class="bg-gray-800 rounded-lg p-3 mb-2"
                >
                  <div class="text-xs font-mono text-gray-500 mb-1">{{ s.req_id }}</div>
                  <p class="text-sm text-gray-100 leading-relaxed">{{ s.requirement }}</p>
                </div>
              </template>

              <!-- Rewrite -->
              <div
                v-else-if="getSuggestion(mk, req.req_id)?.suggested_requirement"
                class="bg-gray-800 rounded-lg p-3"
              >
                <p class="text-sm text-gray-100 leading-relaxed">{{ getSuggestion(mk, req.req_id)?.suggested_requirement }}</p>
              </div>

              <!-- No suggestion -->
              <p v-else class="text-sm text-gray-600 italic">
                {{ scoreNum(getAnalyzed(mk, req.req_id)?.score) >= 9
                  ? 'Already perfect — no suggestion needed'
                  : 'No suggestion generated' }}
              </p>
            </div>
          </div>
        </div>

      </template>
    </div>

    <!-- Mapping Modal -->
    <ColumnMappingModal
      v-if="showMappingModal"
      :file-name="uploadedFile?.name || ''"
      :columns="fileColumns"
      @confirm="handleMappingConfirm"
      @close="handleMappingClose"
    />
  </div>
</template>
