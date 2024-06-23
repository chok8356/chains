<template>
  <div
    :class="$style.root"
    ref="rootEl">
    <div
      :class="$style.canvas"
      :style="{
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
      }">
      <div :class="$style.renderer">
        <!--grid-->
        <ChainsGrid
          :class="$style.grid"
          :scale="scene.scale" />

        <div
          :class="$style.blocks"
          :style="sceneStyle">
          <ChainsSceneBlock
            :block="block"
            :dragging="false"
            :key="block.id"
            :selected="false"
            v-for="block in blocks" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChainsGrid from '@/components/ChainsGrid.vue'
import ChainsSceneBlock from '@/components/ChainsSceneBlock.vue'
import { throttle } from 'lodash-es'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Blocks, Scene } from './types'

// calculate time 1000ms / 144ps = 6ms
const THROTTLE_TIME = 6

const props = withDefaults(
  defineProps<{
    blocks: Blocks
  }>(),
  {
    blocks: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update:blocks', blocks: Blocks): void
}>()

const rootEl = ref<HTMLDivElement | null>(null)

const resizeObserverCallback = throttle(() => {
  if (rootEl.value) {
    const { height, width } = rootEl.value.getBoundingClientRect()
    canvasSize.value.width = width
    canvasSize.value.height = height
  }
}, THROTTLE_TIME)

const resizeObserver = new ResizeObserver(resizeObserverCallback)

const canvasSize = ref<{ height: number; width: number }>({
  height: 0,
  width: 0,
})

const blocksLocal = ref<Blocks>({})

const scene = ref<Scene>({
  scale: 1,
  x: 0,
  y: 0,
})

onMounted(async () => {
  await nextTick()
  if (rootEl.value) {
    resizeObserver.observe(rootEl.value)
  }
})

onBeforeUnmount(() => {})

const sceneRafId = ref<null | number>(null)
const sceneStyle = ref<{ transform: string }>({
  transform: ``,
})

watch(
  () => scene.value,
  () => {
    if (sceneRafId.value) {
      cancelAnimationFrame(sceneRafId.value)
    }
    sceneRafId.value = requestAnimationFrame(() => {
      const { scale, x, y } = scene.value
      sceneStyle.value.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    })
  },
  { deep: true, immediate: true },
)
</script>

<style module>
.root {
  display: block;
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.canvas {
  display: block;
  inset: 0;
  overflow: hidden;
  pointer-events: initial;
  position: absolute;
}

.renderer {
  inset: 0;
  overflow: hidden;
  position: absolute;
}

.grid {
  height: calc(100% + 2px);
  left: -1px;
  position: absolute;
  top: -1px;
  width: calc(100% + 2px);
}

.blocks {
  height: 0;
  left: 50%;
  position: absolute;
  top: 50%;
  width: 0;
  will-change: contents;
}
</style>
