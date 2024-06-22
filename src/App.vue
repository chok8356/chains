<template>
  <div :class="$style.root">
    <ChainsScene v-model:blocks="blocks" />
  </div>
</template>

<script setup lang="ts">
import type { Blocks } from '@/components/types'

import ChainsScene from '@/components/ChainsScene.vue'
import { onMounted, ref } from 'vue'

const blocks = ref<Blocks>({})

const getRandomNumberInRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

onMounted(() => {
  const range = 100
  const count = 0

  for (let i = 0; i < count; i++) {
    blocks.value[i] = {
      coords: {
        x: getRandomNumberInRange(-range, range) * i,
        y: getRandomNumberInRange(-range, range) * i
      },
      id: i,
      parentId: null,
      type: 'EmailActionHandler'
    }
  }

  blocks.value[1] = {
    coords: {
      x: 0,
      y: -300
    },
    id: 1,
    parentId: null,
    type: 'EmailActionHandler'
  }

  blocks.value[2] = {
    coords: {
      x: 0,
      y: 0
    },
    id: 2,
    parentId: 1,
    type: 'SMSActionHandler'
  }

  blocks.value[3] = {
    coords: {
      x: -200,
      y: 0
    },
    id: 3,
    parentId: 1,
    type: 'PushActionHandler'
  }

  blocks.value[4] = {
    coords: {
      x: -300,
      y: 300
    },
    id: 4,
    parentId: 3,
    type: 'ConditionActionHandler'
  }

  blocks.value[5] = {
    coords: {
      x: 0,
      y: 300
    },
    id: 5,
    parentId: 3,
    type: 'ConditionActionHandler'
  }
})
</script>

<style module>
.root {
  background-color: var(--color-warm-grey-50);
  display: flex;
  height: 100vh;
  max-height: 100vh;
  min-height: 100vh;
  outline: none;
  position: relative;
  user-select: none;
}
</style>
