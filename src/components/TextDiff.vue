<!-- TextDiff.vue - Word-level diff visualization component -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  original: string
  suggested: string
  showDiff?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDiff: true
})

interface DiffPart {
  value: string
  added?: boolean
  removed?: boolean
}

// Simple word-level diff algorithm
const computeDiff = (original: string, suggested: string): DiffPart[] => {
  const originalWords = original.split(/(\s+)/)
  const suggestedWords = suggested.split(/(\s+)/)

  // Use LCS-based diff
  const result: DiffPart[] = []

  // Build LCS table
  const m = originalWords.length
  const n = suggestedWords.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalWords[i - 1] === suggestedWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find diff
  let i = m, j = n
  const diff: DiffPart[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalWords[i - 1] === suggestedWords[j - 1]) {
      diff.unshift({ value: originalWords[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ value: suggestedWords[j - 1], added: true })
      j--
    } else if (i > 0) {
      diff.unshift({ value: originalWords[i - 1], removed: true })
      i--
    }
  }

  // Merge consecutive same-type parts
  for (const part of diff) {
    const last = result[result.length - 1]
    if (last && last.added === part.added && last.removed === part.removed) {
      last.value += part.value
    } else {
      result.push({ ...part })
    }
  }

  return result
}

const diffParts = computed(() => {
  if (!props.showDiff) {
    return [{ value: props.suggested }]
  }
  return computeDiff(props.original, props.suggested)
})
</script>

<template>
  <span class="diff-container">
    <template v-for="(part, index) in diffParts" :key="index">
      <span
        v-if="part.removed"
        class="bg-red-100 text-red-700 line-through px-0.5"
      >{{ part.value }}</span>
      <span
        v-else-if="part.added"
        class="bg-green-100 text-green-700 underline px-0.5"
      >{{ part.value }}</span>
      <span v-else>{{ part.value }}</span>
    </template>
  </span>
</template>

<style scoped>
.diff-container {
  word-break: break-word;
}
</style>
