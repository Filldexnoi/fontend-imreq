<!-- Create Project Modal - Enhanced with File Upload and Template Selection -->
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
const selectedTemplate = ref('ISO29148');
const referenceFiles = ref<File[]>([]);
const errorMessage = ref('');
const showTemplateInfo = ref(false);

const templates = [
  {
    value: 'EARS',
    label: 'EARS',
    description: 'Easy Approach to Requirements Syntax - A pattern-based template using WHEN, WHILE, WHERE, IF, THEN clauses for clear and unambiguous requirements.'
  },
  {
    value: 'ISO29148',
    label: 'ISO 29148',
    description: 'International standard format with requirements structured as: [Condition] [Subject] [Action] [Object] [Constraint], using "shall" for mandatory requirements.'
  }
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx']

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const invalid = Array.from(target.files).filter(f => {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
      return !ALLOWED_EXTENSIONS.includes(ext)
    })
    if (invalid.length > 0) {
      errorMessage.value = `Unsupported file type: ${invalid.map(f => f.name).join(', ')}. Allowed: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX.`
      target.value = ''
      return
    }
    const newFiles = Array.from(target.files);
    referenceFiles.value = [...referenceFiles.value, ...newFiles];
  }
  target.value = '';
};

const removeFile = (index: number) => {
  referenceFiles.value.splice(index, 1);
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const handleSubmit = async () => {
  if (!projectName.value || !projectDescription.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  try {
    errorMessage.value = '';
    const projectId = await projectStore.createProject(
      projectName.value,
      projectDescription.value,
      selectedTemplate.value,
      referenceFiles.value.length > 0 ? referenceFiles.value : undefined
    );

    // Navigate to the new project
    router.push(`/projects/${projectId}/origin-requirements`);

    emit('close');
  } catch (e: any) {
    console.error('Create project error:', e);
    errorMessage.value = e.message || 'Failed to create project';
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
      class="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <!-- Modal Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
          <span class="text-white text-sm font-bold">IR</span>
        </div>
        <h2 class="text-2xl font-bold text-white">Create New Project</h2>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
        <p class="text-red-400 text-sm">{{ errorMessage }}</p>
      </div>

      <!-- Project Name Input -->
      <div class="mb-5">
        <label class="block text-white text-sm mb-2">Project Name <span class="text-red-400">*</span></label>
        <input
          v-model="projectName"
          type="text"
          placeholder="Enter project name"
          class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Project Description Textarea -->
      <div class="mb-5">
        <label class="block text-white text-sm mb-2">Project Description <span class="text-red-400">*</span></label>
        <textarea
          v-model="projectDescription"
          placeholder="Enter project description"
          rows="3"
          class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        ></textarea>
      </div>

      <!-- Upload Reference Files -->
      <div class="mb-5">
        <label class="block text-white text-sm mb-2">Upload Reference Files</label>
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="flex items-center gap-4 mb-3">
            <label class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg cursor-pointer transition text-sm">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                @change="handleFileSelect"
                class="hidden"
              />
              Choose Files
            </label>
            <span class="text-gray-400 text-sm">PDF, DOC, TXT, CSV, Excel supported</span>
          </div>

          <!-- File List -->
          <div v-if="referenceFiles.length > 0" class="space-y-2">
            <div
              v-for="(file, index) in referenceFiles"
              :key="index"
              class="flex items-center justify-between bg-gray-600 rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="text-white text-sm truncate max-w-xs">{{ file.name }}</span>
                <span class="text-gray-400 text-xs">({{ formatFileSize(file.size) }})</span>
              </div>
              <button
                @click="removeFile(index)"
                class="p-1 hover:bg-gray-500 rounded transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-400">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <p v-else class="text-gray-500 text-sm">No files selected</p>
        </div>
      </div>

      <!-- Requirement Template -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-white text-sm">Requirement Template</label>
          <button
            @click="showTemplateInfo = !showTemplateInfo"
            class="text-blue-400 text-sm hover:text-blue-300 transition flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            View Descriptions
          </button>
        </div>

        <select
          v-model="selectedTemplate"
          class="w-full px-4 py-3 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="template in templates" :key="template.value" :value="template.value">
            {{ template.label }}
          </option>
        </select>

        <!-- Template Info Panel -->
        <div v-if="showTemplateInfo" class="mt-3 bg-gray-700 rounded-lg p-4">
          <h4 class="text-white font-semibold mb-3">Template Descriptions</h4>
          <div class="space-y-3">
            <div
              v-for="template in templates"
              :key="template.value"
              :class="[
                'p-3 rounded-lg border-2 transition',
                selectedTemplate === template.value
                  ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                  : 'border-gray-600 bg-gray-600'
              ]"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-white font-medium">{{ template.label }}</span>
                <span v-if="selectedTemplate === template.value" class="text-blue-400 text-xs">(Selected)</span>
              </div>
              <p class="text-gray-300 text-sm">{{ template.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between mt-8">
        <button
          @click="handleClose"
          class="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition"
        >
          Cancel
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
          {{ projectStore.isLoading ? 'Creating...' : 'Create Project' }}
        </button>
      </div>
    </div>
  </div>
</template>
