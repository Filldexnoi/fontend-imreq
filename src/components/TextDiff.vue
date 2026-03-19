<script setup lang="ts">
import { computed } from 'vue'
import * as Diff from 'diff' // นำเข้า library jsdiff

interface Props {
  original: string
  suggested: string
  showDiff?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDiff: true
})

// ข้อมูลที่จะแสดงผล
const diffParts = computed(() => {
  if (!props.showDiff) {
    return [{ value: props.suggested, added: false, removed: false }]
  }

  // ใช้ diffWords เพื่อเปรียบเทียบระดับคำ
  // ตัวนี้จะฉลาดพอที่จะรู้ว่าคำไหน "คงเดิม" คำไหน "เปลี่ยน" 
  // โดยไม่พังเพราะเรื่องช่องว่าง
  return Diff.diffWords(props.original, props.suggested)
})
</script>

<template>
  <div class="diff-box">
    <span class="diff-container text-sm leading-relaxed">
      <template v-for="(part, index) in diffParts" :key="index">
        <span
          v-if="part.removed"
          class="diff-removed"
        >{{ part.value }}</span>

        <span
          v-else-if="part.added"
          class="diff-added"
        >{{ part.value }}</span>

        <span v-else class="text-gray-700">{{ part.value }}</span>
      </template>
    </span>
  </div>
</template>

<style scoped>
.diff-container {
  word-break: break-word;
  white-space: pre-wrap; /* เพื่อให้เห็นการเว้นวรรคที่ถูกต้อง */
}

.diff-removed {
  background-color: #fee2e2; /* สีแดงอ่อน */
  color: #b91c1c;           /* ตัวอักษรแดง */
  text-decoration: line-through;
  padding: 0 1px;
}

.diff-added {
  background-color: #dcfce7; /* สีเขียวอ่อน */
  color: #15803d;           /* ตัวอักษรเขียว */
  text-decoration: underline;
  padding: 0 1px;
}

.diff-box {
  padding: 1.5rem;
  border-radius: 0.75rem;
  background-color: white;
  line-height: 1.8;
}
</style>