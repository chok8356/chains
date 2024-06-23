<template>
  <div :class="$style.root">
    <div :class="$style.sidebar">Sidebar</div>
    <div :class="$style.header">Header</div>
    <div :class="$style.scene">
      <ChainsScene v-model:value="blocks" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Blocks } from '@/components/types'

import ChainsScene from '@/components/ChainsScene.vue'
import { onMounted, ref } from 'vue'

const blocks = ref<Blocks>({})

onMounted(() => {
  const count = 1000
  const perRow = 100
  let row = 0

  for (let i = 0; i < count; i++) {
    if (i % perRow === 0 && i !== 0) {
      row++
    }
    blocks.value[i] = {
      id: i,
      // parentId: i - perRow,
      parentId: 0,
      type: 'EmailActionHandler',
      x: (i % perRow) * 200,
      y: row * 200,
    }
  }

  // blocks.value[1] = {
  //   id: 1,
  //   parentId: null,
  //   type: 'EmailActionHandler',
  //   x: 0,
  //   y: -140,
  // }
  //
  // blocks.value[2] = {
  //   id: 2,
  //   parentId: 1,
  //   type: 'SMSActionHandler',
  //   x: 0,
  //   y: 0,
  // }
  //
  // blocks.value[3] = {
  //   id: 3,
  //   parentId: 1,
  //   type: 'PushActionHandler',
  //   x: -200,
  //   y: 0,
  // }
  //
  // blocks.value[4] = {
  //   id: 4,
  //   parentId: 3,
  //   type: 'ConditionActionHandler',
  //   x: -200,
  //   y: 140,
  // }
  //
  // blocks.value[5] = {
  //   id: 5,
  //   parentId: 3,
  //   type: 'ConditionActionHandler',
  //   x: 0,
  //   y: 140,
  // }
})
</script>

<style module>
.root {
  background-color: var(--color-warm-grey-50);
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 40px 1fr;
  height: 100%;
  outline: none;
  position: relative;
  user-select: none;
  width: 100%;
}

.sidebar {
  background-color: var(--color-white);
  border-right: 1px solid var(--color-grey-200);
  grid-column: 1 / 1;
  grid-row: 1 / 3;
  height: 100%;
  padding: 16px;
  width: 100%;
}

.header {
  align-items: center;
  background-color: var(--color-white);
  display: flex;
  grid-column: 2 / 2;
  grid-row: 1 / 1;
  height: 40px;
  padding: 0 16px;
  width: 100%;
}

.scene {
  box-shadow: inset 0 0 24px -12px rgb(0 0 0 / 20%);
  grid-column: 2 / 2;
  grid-row: 2 / 2;
  height: 100%;
  width: 100%;
}
</style>
