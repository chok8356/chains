<template>
  <div
    :class="$style.root"
    ref="rootEl">
    <div
      :class="$style.canvas"
      ref="canvasEl">
      <div
        :class="$style.renderer"
        ref="rendererEl">
        <ChainsGrid
          :class="$style.grid"
          :scale="scale" />

        <div
          :class="$style.blocks"
          ref="blocksEl">
          <div :class="$style.center"></div>
          <ChainsLines :lines="lines" />

          <ChainsSceneBlock
            :block="block"
            :dragging="block.id === draggingBlockId"
            :key="block.id"
            :selected="selected[block.id]"
            v-for="block in blocks"
            v-memo="[block.x, block.y, block.id === draggingBlockId, selected[block.id]]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChainsGrid from '@/components/ChainsGrid.vue'
import ChainsLines from '@/components/ChainsLines.vue'
import ChainsSceneBlock from '@/components/ChainsSceneBlock.vue'
import { throttle } from 'lodash-es'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { BLOCK_SIZE, SCENE_SCALE, THROTTLE, ZOOM_INTENSITY } from './constants'
import { type Block, type Blocks, type Lines, SceneEntityType } from './types'

const props = withDefaults(
  defineProps<{
    value: Blocks
  }>(),
  {
    value: () => ({}),
  },
)

defineEmits<{
  (e: 'update:value', value: Blocks): void
}>()

const rootEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLDivElement | null>(null)
const rendererEl = ref<HTMLDivElement | null>(null)
const blocksEl = ref<HTMLDivElement | null>(null)

const rafId = ref<null | number>(null)

const blocks = ref<Blocks>({})

const lines = ref<Lines>({})

const sceneOffset = ref({
  x: 0,
  y: 0,
})

const scale = ref(1)

const dragging = ref(false)

const draggingBlockId = ref<Block['id'] | null>(null)

const selected = ref<Record<Block['id'], true>>({})

const canvasPosition = ref({
  left: 0,
  top: 0,
})

const mouse = ref({
  x: 0,
  y: 0,
})

// events
const mousedown = throttle((e: MouseEvent) => {
  e.preventDefault()
  const target = e.target as HTMLElement
  if (target === rendererEl.value) {
    selected.value = {}
    dragging.value = true
    mouse.value.x = e.clientX
    mouse.value.y = e.clientY
  }
  if (blocksEl.value?.contains(target)) {
    e.stopPropagation()
    const closestEl = target.closest('[data-type]') as HTMLElement | null
    if (closestEl) {
      const id = Number(closestEl.id)
      const type = Number(closestEl.dataset.type)
      if (type === SceneEntityType.Block) {
        draggingBlockId.value = id
        mouse.value.x = e.clientX - blocks.value[id].x * scale.value
        mouse.value.y = e.clientY - blocks.value[id].y * scale.value
      }
    }
  }
}, THROTTLE)

const mousemove = throttle((e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (dragging.value) {
    sceneOffset.value.x += e.clientX - mouse.value.x
    sceneOffset.value.y += e.clientY - mouse.value.y
    mouse.value.x = e.clientX
    mouse.value.y = e.clientY
  }
  if (draggingBlockId.value !== null) {
    blocks.value[draggingBlockId.value].x = (e.clientX - mouse.value.x) / scale.value
    blocks.value[draggingBlockId.value].y = (e.clientY - mouse.value.y) / scale.value

    const block = blocks.value[draggingBlockId.value]
    if (rafId.value) cancelAnimationFrame(rafId.value)
    rafId.value = requestAnimationFrame(() => animateLines(block))
  }
}, THROTTLE)

const mouseup = throttle((e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  selected.value = {}
  if (draggingBlockId.value !== null) {
    selected.value[draggingBlockId.value] = true
  }
  dragging.value = false
  draggingBlockId.value = null
}, THROTTLE)

const wheel = throttle((e: WheelEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (!canvasEl.value) return
  const oldScale = scale.value
  const newScale = Math.min(
    Math.max(Math.exp(Math.log(oldScale) + Math.sign(-e.deltaY) * ZOOM_INTENSITY), SCENE_SCALE.min),
    SCENE_SCALE.max,
  )
  const mouseX = e.clientX - canvasPosition.value.left
  const mouseY = e.clientY - canvasPosition.value.top
  const offsetX = (mouseX - sceneOffset.value.x) / oldScale
  const offsetY = (mouseY - sceneOffset.value.y) / oldScale
  scale.value = newScale
  sceneOffset.value.x = mouseX - offsetX * newScale
  sceneOffset.value.y = mouseY - offsetY * newScale
}, THROTTLE)

const getLineId = (block: Block, parentBlock: Block) => {
  return `${parentBlock.id}_${block.id}`
}

const getLine = (block: Block, parentBlock: Block) => {
  return {
    x1: parentBlock.x + BLOCK_SIZE.width / 2,
    x2: block.x + BLOCK_SIZE.width / 2,
    y1: parentBlock.y + BLOCK_SIZE.height,
    y2: block.y,
  }
}

const getLines = (blocks: Blocks) => {
  const result: Lines = {}
  for (const id in blocks) {
    const block = blocks[id]
    if (block.parentId !== null) {
      const parentBlock = blocks[block.parentId]
      if (parentBlock) {
        result[getLineId(block, parentBlock)] = getLine(block, parentBlock)
      }
    }
  }
  return result
}

const blocksReverseDependencyTree = ref<Record<number, number[]>>({})

const getBlocksReverseDependencyTree = (blocks: Blocks) => {
  const result: Record<number, number[]> = {}
  for (const blockId in blocks) {
    if (blockId in blocks) {
      result[Number(blockId)] = []
    }
  }
  for (const blockId in blocks) {
    if (blockId in blocks) {
      const block = blocks[blockId]
      if (block.parentId !== null) {
        if (!result[block.parentId]) {
          result[block.parentId] = []
        }
        result[block.parentId].push(block.id)
      }
    }
  }
  return result
}

// update line position
const animateLines = (block: Block) => {
  if (block.parentId !== null && blocks.value[block.parentId]) {
    lines.value[getLineId(block, blocks.value[block.parentId])] = getLine(
      block,
      blocks.value[block.parentId],
    )
  }

  const childIds = blocksReverseDependencyTree.value[block.id]
  if (childIds.length) {
    for (const childId of childIds) {
      if (blocks.value[childId]) {
        lines.value[getLineId(blocks.value[childId], block)] = getLine(blocks.value[childId], block)
      }
    }
  }
}

// update scene position
const animateScene = () => {
  if (blocksEl.value) {
    blocksEl.value.style.transform = `translate3d(${sceneOffset.value.x}px, ${sceneOffset.value.y}px, 0) scale(${scale.value})`
  }
}
watch(
  () => sceneOffset.value,
  () => {
    if (rafId.value) cancelAnimationFrame(rafId.value)
    rafId.value = requestAnimationFrame(animateScene)
  },
  { deep: true, flush: 'post' },
)

onMounted(async () => {
  await nextTick()
  blocks.value = { ...props.value }
  lines.value = getLines(blocks.value)
  blocksReverseDependencyTree.value = getBlocksReverseDependencyTree(blocks.value)
  if (canvasEl.value) {
    const { left, top } = canvasEl.value.getBoundingClientRect()
    canvasPosition.value.left = left
    canvasPosition.value.top = top
    sceneOffset.value.x = canvasEl.value.clientWidth / 2
    sceneOffset.value.y = canvasEl.value.clientHeight / 2
  }
  if (canvasEl.value) {
    canvasEl.value.addEventListener('mousedown', mousedown)
    canvasEl.value.addEventListener('wheel', wheel, true)
  }
  document.documentElement.addEventListener('mousemove', mousemove, true)
  document.documentElement.addEventListener('mouseup', mouseup, true)
  animateScene()
})

onBeforeUnmount(() => {
  if (canvasEl.value) {
    canvasEl.value.removeEventListener('mousedown', mousedown)
    canvasEl.value.removeEventListener('wheel', wheel)
  }
  document.documentElement.removeEventListener('mousemove', mousemove)
  document.documentElement.removeEventListener('mouseup', mouseup)
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
  left: 50%;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
}
</style>
