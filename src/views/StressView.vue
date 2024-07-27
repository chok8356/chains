<template>
  <FlowChart v-model:value="blocks" />
</template>

<script setup lang="ts">
import type { Blocks } from '@/components/types'

import FlowChart from '@/components/FlowChart.vue'
import { ref } from 'vue'

const blocks = ref<Blocks>({})

const fillScene = (count = 250, perRow = 25) => {
  let row = 0

  for (let i = 0; i < count; i++) {
    const isFirstInRow = i % perRow === 0
    const columnIndex = i % perRow

    if (isFirstInRow && i !== 0) row++

    const x = columnIndex * 200
    const y = isFirstInRow ? row * 400 : row * 400 + 200

    blocks.value[i] = {
      id: i,
      parentId: row * perRow,
      x,
      y,
    }
  }
}

fillScene()
</script>
