<template>
  <div
    :class="$style.root"
    ref="rootEl">
    <div
      :class="$style.canvas"
      ref="canvasEl">
      <div
        :class="$style.renderer"
        ref="captureEl">
        <!--grid-->
        <ChainsGrid
          :class="$style.grid"
          :scale="scene.scale" />

        <div
          :class="$style.blocks"
          ref="blocksEl">
          <div :class="$style.center"></div>
          <ChainsSceneBlock
            :block="block"
            :dragging="block.id === draggingBlockId"
            :height="BLOCK_SIZE.height"
            :key="block.id"
            :selected="false"
            :width="BLOCK_SIZE.width"
            v-for="block in blocks"
            v-memo="[block, block.id === draggingBlockId]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChainsGrid from '@/components/ChainsGrid.vue'
import ChainsSceneBlock from '@/components/ChainsSceneBlock.vue'
import { cloneDeep } from 'lodash-es'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { type Block, type Blocks, type Scene, SceneEntitityType } from './types'

// calculate time 1000ms / 144ps = 6ms
const THROTTLE_TIME = 6

const BLOCK_SIZE = {
  height: 98,
  width: 168,
}

const props = withDefaults(
  defineProps<{
    value: Blocks
  }>(),
  {
    value: () => ({}),
  },
)

const emit = defineEmits<{
  (e: 'update:value', value: Blocks): void
}>()

const rootEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLDivElement | null>(null)
const captureEl = ref<HTMLDivElement | null>(null)
const blocksEl = ref<HTMLDivElement | null>(null)

const blocks = ref<Blocks>({})

const scene = ref<Scene>({
  scale: 1,
  x: 0,
  y: 0,
})

const dragging = ref(false)
const draggingBlockId = ref<Block['id'] | null>(null)

const mouse = ref<{ x: number; y: number }>({
  x: 0,
  y: 0,
})

// events
const mousedown = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  if (target === captureEl.value) {
    dragging.value = true
    mouse.value.x = e.clientX - scene.value.x
    mouse.value.y = e.clientY - scene.value.y
  } else {
    const closestEl = target.closest('[data-type]') as HTMLElement | null
    if (closestEl) {
      const id = Number(closestEl.id)
      const type = Number(closestEl.dataset.type)
      if (type === SceneEntitityType.Block) {
        draggingBlockId.value = id
        mouse.value.x = e.clientX - blocks.value[draggingBlockId.value].x
        mouse.value.y = e.clientY - blocks.value[draggingBlockId.value].y
      }
    }
  }
}

const mousemove = (e: MouseEvent) => {
  if (dragging.value) {
    scene.value.x = e.clientX - mouse.value.x
    scene.value.y = e.clientY - mouse.value.y
  }
  if (draggingBlockId.value !== null) {
    blocks.value[draggingBlockId.value].x = e.clientX - mouse.value.x
    blocks.value[draggingBlockId.value].y = e.clientY - mouse.value.y
  }
}

const mouseup = () => {
  dragging.value = false
  draggingBlockId.value = null
}

// resize canvas
const canvasSize = ref<{ height: number; width: number }>({
  height: 0,
  width: 0,
})

const canvasRafId = ref<null | number>(null)

const resizeObserver = new ResizeObserver(() => {
  if (canvasRafId.value) {
    cancelAnimationFrame(canvasRafId.value)
  }
  canvasRafId.value = requestAnimationFrame(() => {
    if (rootEl.value && canvasEl.value) {
      const { height, width } = rootEl.value.getBoundingClientRect()
      canvasSize.value.width = width
      canvasSize.value.height = height
      canvasEl.value.style.width = `${canvasSize.value.width}px`
      canvasEl.value.style.height = `${canvasSize.value.height}px`
    }
  })
})

// update scene position
const sceneRafId = ref<null | number>(null)

watch(
  () => scene.value,
  () => {
    if (sceneRafId.value) {
      cancelAnimationFrame(sceneRafId.value)
    }
    sceneRafId.value = requestAnimationFrame(() => {
      if (blocksEl.value) {
        blocksEl.value.style.transform = `translate3d(${scene.value.x}px, ${scene.value.y}px, 0) scale(${scene.value.scale})`
      }
    })
  },
  { deep: true, immediate: true },
)

onMounted(async () => {
  await nextTick()

  blocks.value = cloneDeep(props.value)

  if (rootEl.value) {
    resizeObserver.observe(rootEl.value)
  }

  if (captureEl.value) {
    captureEl.value.addEventListener('mousedown', mousedown)
    document.documentElement.addEventListener('mousemove', mousemove)
    document.documentElement.addEventListener('mouseup', mouseup)
  }
})

onBeforeUnmount(() => {
  if (captureEl.value) {
    captureEl.value.removeEventListener('mousedown', mousedown)
    document.documentElement.removeEventListener('mousemove', mousemove)
    document.documentElement.removeEventListener('mouseup', mouseup)
  }
})
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
  transform: translateZ(0);
  width: 0;
  will-change: contents;
}

.center {
  background-color: var(--color-red);
  border-radius: 50%;
  height: 12px;
  width: 12px;
}

.capture {
  display: block;
  inset: 0;
  overflow: initial;
  pointer-events: initial;
  position: absolute;
}
</style>
