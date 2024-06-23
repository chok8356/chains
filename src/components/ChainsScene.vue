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
          :scale="scale" />

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

import { type Block, type Blocks, SceneEntityType } from './types'

// calculate time 1000ms / 144ps = 6ms
const THROTTLE_TIME = 6

const SCENE_SCALE = {
  max: 3,
  min: 0.1,
}

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

const sceneOffset = ref<{ x: number; y: number }>({
  x: 0,
  y: 0,
})

const scale = ref(1)

const dragging = ref(false)
const draggingBlockId = ref<Block['id'] | null>(null)

const mouse = {
  x: 0,
  y: 0,
}

// events
const mousedown = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  if (target === captureEl.value) {
    dragging.value = true
    mouse.x = e.clientX
    mouse.y = e.clientY
  } else {
    const closestEl = target.closest('[data-type]') as HTMLElement | null
    if (closestEl) {
      const id = Number(closestEl.id)
      const type = Number(closestEl.dataset.type)
      if (type === SceneEntityType.Block) {
        draggingBlockId.value = id
        mouse.x = e.clientX - blocks.value[id].x * scale.value
        mouse.y = e.clientY - blocks.value[id].y * scale.value
      }
    }
  }
}

const mousemove = (e: MouseEvent) => {
  if (dragging.value) {
    sceneOffset.value.x += e.clientX - mouse.x
    sceneOffset.value.y += e.clientY - mouse.y
    mouse.x = e.clientX
    mouse.y = e.clientY
  }
  if (draggingBlockId.value !== null) {
    blocks.value[draggingBlockId.value].x = (e.clientX - mouse.x) / scale.value
    blocks.value[draggingBlockId.value].y = (e.clientY - mouse.y) / scale.value
  }
}

const mouseup = () => {
  dragging.value = false
  draggingBlockId.value = null
}

const wheel = (e: WheelEvent) => {
  e.preventDefault()

  if (!canvasEl.value) return

  const zoomIntensity = 0.001
  const oldScale = scale.value
  const newScale = Math.min(
    Math.max(SCENE_SCALE.min, oldScale - e.deltaY * zoomIntensity),
    SCENE_SCALE.max,
  )

  const mouseX = e.clientX - canvasEl.value.getBoundingClientRect().left
  const mouseY = e.clientY - canvasEl.value.getBoundingClientRect().top

  // Вычисляем координаты курсора относительно центра контейнера
  const offsetX = (mouseX - sceneOffset.value.x) / oldScale
  const offsetY = (mouseY - sceneOffset.value.y) / oldScale

  // Обновляем масштаб
  scale.value = newScale

  // Корректируем координаты сцены, чтобы сцена оставалась на месте курсора
  sceneOffset.value.x = mouseX - offsetX * newScale
  sceneOffset.value.y = mouseY - offsetY * newScale
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
  () => sceneOffset.value,
  () => {
    if (sceneRafId.value) {
      cancelAnimationFrame(sceneRafId.value)
    }
    sceneRafId.value = requestAnimationFrame(() => {
      if (blocksEl.value) {
        blocksEl.value.style.transform = `translate3d(${sceneOffset.value.x}px, ${sceneOffset.value.y}px, 0) scale(${scale.value})`
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

  if (canvasEl.value) {
    sceneOffset.value.x = canvasEl.value.clientWidth / 2
    sceneOffset.value.y = canvasEl.value.clientHeight / 2
  }

  if (captureEl.value) {
    captureEl.value.addEventListener('mousedown', mousedown)
    captureEl.value.addEventListener('wheel', wheel)
    document.documentElement.addEventListener('mousemove', mousemove)
    document.documentElement.addEventListener('mouseup', mouseup)
  }
})

onBeforeUnmount(() => {
  if (captureEl.value) {
    captureEl.value.removeEventListener('mousedown', mousedown)
    captureEl.value.removeEventListener('wheel', wheel)
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
  left: 0;
  position: absolute;
  top: 0;
  transform: translate3d(0, 0, 0);
  transform-origin: top left;
  width: 0;
  will-change: contents;
}

.center {
  background-color: var(--color-red);
  border-radius: 50%;
  height: 12px;
  width: 12px;
}
</style>
