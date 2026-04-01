<!-- Edit Project Modal - Enhanced with File Upload and Template Selection -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProjectStore } from '@/stores/project';
import type { Project } from '@/types/project';

const projectStore = useProjectStore();

interface Props {
  project: Project;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: []
  updated: []
}>();

const projectName = ref('');
const projectDescription = ref('');
const selectedTemplate = ref('ISO29148');
const referenceFiles = ref<File[]>([]);
const existingFiles = ref<any[]>([]);
const errorMessage = ref('');
const showTemplateInfo = ref(false);
const isUpdating = ref(false);

// ✅ Track original values to detect changes
const originalValues = ref({
  title: '',
  description: '',
  template: 'ISO29148',
  filesCount: 0
});

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

// Initialize form with existing project data
onMounted(() => {
  projectName.value = props.project.title;
  projectDescription.value = props.project.description;
  selectedTemplate.value = props.project.requirement_template || 'ISO29148';
  
  // Load existing reference files
  if (props.project.reference_files && Array.isArray(props.project.reference_files)) {
    existingFiles.value = props.project.reference_files.map((file: any, index: number) => ({
      ...file,
      index
    }));
  }

  // ✅ Save original values
  originalValues.value = {
    title: props.project.title,
    description: props.project.description,
    template: props.project.requirement_template || 'ISO29148',
    filesCount: props.project.reference_files?.length || 0
  }
});

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

const removeNewFile = (index: number) => {
  referenceFiles.value.splice(index, 1);
};

const removeExistingFile = (index: number) => {
  existingFiles.value.splice(index, 1);
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

  isUpdating.value = true;
  errorMessage.value = '';

  try {
    // ✅ Check what has changed
    const titleChanged = projectName.value !== originalValues.value.title
    const descriptionChanged = projectDescription.value !== originalValues.value.description
    const templateChanged = selectedTemplate.value !== originalValues.value.template
    const hasNewFiles = referenceFiles.value.length > 0
    const filesRemoved = existingFiles.value.length !== originalValues.value.filesCount

    // If nothing changed, just close
    if (!titleChanged && !descriptionChanged && !templateChanged && !hasNewFiles && !filesRemoved) {
      emit('close')
      return
    }

    // Create FormData only with changed fields
    const formData = new FormData();
    
    if (titleChanged) {
      formData.append('title', projectName.value)
    }
    
    if (descriptionChanged) {
      formData.append('description', projectDescription.value)
    }
    
    if (templateChanged) {
      formData.append('requirement_template', selectedTemplate.value)
    }

    // Add new files if any
    if (hasNewFiles) {
      referenceFiles.value.forEach((file) => {
        formData.append('files', file)
      })
    }

    // Call update API
    await projectStore.updateProject(props.project.id, formData);

    // Refresh projects list
    await projectStore.fetchProjects();

    emit('updated');
    emit('close');
  } catch (e: any) {
    console.error('Update project error:', e);
    errorMessage.value = e.message || 'Failed to update project';
  } finally {
    isUpdating.value = false;
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
      class="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <!-- Modal Header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
          <span class="text-white text-sm font-bold">IR</span>
        </div>
        <h2 class="text-2xl font-bold text-white">Edit Project</h2>
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

      <!-- Existing Reference Files -->
      <div v-if="existingFiles.length > 0" class="mb-5">
        <label class="block text-white text-sm mb-2">Existing Reference Files</label>
        <div class="bg-gray-700 rounded-lg p-4">
          <div class="space-y-2">
            <div
              v-for="(file, index) in existingFiles"
              :key="'existing-' + index"
              class="flex items-center justify-between bg-gray-600 rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-green-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="text-white text-sm truncate max-w-xs">{{ file.name }}</span>
                <span class="text-gray-400 text-xs">({{ formatFileSize(file.size) }})</span>
                <span class="text-green-400 text-xs px-2 py-0.5 bg-green-500 bg-opacity-20 rounded">Existing</span>
              </div>
              <button
                @click="removeExistingFile(index)"
                class="p-1 hover:bg-gray-500 rounded transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-400">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload New Reference Files -->
      <div class="mb-5">
        <label class="block text-white text-sm mb-2">Upload New Reference Files</label>
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

          <!-- New File List -->
          <div v-if="referenceFiles.length > 0" class="space-y-2">
            <div
              v-for="(file, index) in referenceFiles"
              :key="'new-' + index"
              class="flex items-center justify-between bg-gray-600 rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span class="text-white text-sm truncate max-w-xs">{{ file.name }}</span>
                <span class="text-gray-400 text-xs">({{ formatFileSize(file.size) }})</span>
                <span class="text-blue-400 text-xs px-2 py-0.5 bg-blue-500 bg-opacity-20 rounded">New</span>
              </div>
              <button
                @click="removeNewFile(index)"
                class="p-1 hover:bg-gray-500 rounded transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-400">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
          <p v-else class="text-gray-500 text-sm">No new files selected</p>
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
            {{ showTemplateInfo ? 'Hide' : 'View' }} Descriptions
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
          :disabled="isUpdating"
          class="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="!projectName || !projectDescription || isUpdating"
          :class="[
            'px-8 py-3 rounded-full transition flex items-center gap-2',
            projectName && projectDescription && !isUpdating
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          ]"
        >
          <svg
            v-if="isUpdating"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="animate-spin"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 21h5v-5"/>
          </svg>
          {{ isUpdating ? 'Updating...' : 'Update Project' }}
        </button>
      </div>
    </div>
  </div>
</template>