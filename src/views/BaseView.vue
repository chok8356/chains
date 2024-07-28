<template>
  <FlowChart v-model:value="blocks" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Blocks } from '@/components/types'

import FlowChart from '@/components/FlowChart.vue'

const blocks = ref<Blocks>({
  1: {
    id: 1,
    x: 0,
    y: -300,
  },
  2: {
    id: 2,
    parentId: 1,
    x: 200,
    y: -50,
  },
  3: {
    id: 3,
    parentId: 1,
    x: -200,
    y: -50,
  },
  4: {
    id: 4,
    parentId: 3,
    x: -350,
    y: 250,
  },
  5: {
    id: 5,
    parentId: 3,
    x: 0,
    y: 140,
  },
  6: {
    id: 6,
    x: 0,
    y: 340,
  },
})
</script>
