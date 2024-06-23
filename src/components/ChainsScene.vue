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
        <ChainsGrid
          :class="$style.grid"
          :scale="scale" />

        <div
          :class="$style.blocks"
          ref="blocksEl">
          <div :class="$style.center"></div>
          <ChainsLine
            :key="line.id"
            :line="line"
            v-for="line in lines"
            v-memo="[line.id, line.from.x, line.from.y, line.to.x, line.to.y]" />

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
import ChainsLine from '@/components/ChainsLine.vue'
import ChainsSceneBlock from '@/components/ChainsSceneBlock.vue'
import { cloneDeep } from 'lodash-es'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { BLOCK_SIZE, SCENE_SCALE, ZOOM_INTENSITY } from './constants'
import { type Block, type Blocks, type Line, type Lines, SceneEntityType } from './types'

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
const captureEl = ref<HTMLDivElement | null>(null)
const blocksEl = ref<HTMLDivElement | null>(null)

const blocks = ref<Blocks>({})

const lines = ref<Lines>({})

const sceneOffset = ref<{ x: number; y: number }>({
  x: 0,
  y: 0,
})

const scale = ref(1)

const dragging = ref(false)

const draggingBlockId = ref<Block['id'] | null>(null)

const selected = ref<Record<Block['id'], true>>({})

const mouse = {
  x: 0,
  y: 0,
}

// events
const mousedown = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  if (target === captureEl.value) {
    selected.value = {}
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
    const block = blocks.value[draggingBlockId.value]
    block.x = (e.clientX - mouse.x) / scale.value
    block.y = (e.clientY - mouse.y) / scale.value

    // if (block.parentId !== null) {
    //   const parentBlock = blocks.value[block.parentId]
    //   lines.value[getLineId(block, parentBlock)] = getLine(block, parentBlock)
    // }
    //
    // const childIds = blocksReverseDependencyTree.value[block.id]
    // if (childIds.length) {
    //   for (const childId of childIds) {
    //     const childBlock = blocks.value[childId]
    //     lines.value[getLineId(childBlock, block)] = getLine(childBlock, block)
    //   }
    // }
  }
}

const mouseup = () => {
  selected.value = {}
  if (draggingBlockId.value !== null) {
    selected.value[draggingBlockId.value] = true
  }
  dragging.value = false
  draggingBlockId.value = null
}

const wheel = (e: WheelEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (!canvasEl.value) return
  const oldScale = scale.value
  const newScale = Math.min(
    Math.max(Math.exp(Math.log(oldScale) + Math.sign(-e.deltaY) * ZOOM_INTENSITY), SCENE_SCALE.min),
    SCENE_SCALE.max,
  )
  const mouseX = e.clientX - canvasEl.value.getBoundingClientRect().left
  const mouseY = e.clientY - canvasEl.value.getBoundingClientRect().top
  const offsetX = (mouseX - sceneOffset.value.x) / oldScale
  const offsetY = (mouseY - sceneOffset.value.y) / oldScale
  scale.value = newScale
  sceneOffset.value.x = mouseX - offsetX * newScale
  sceneOffset.value.y = mouseY - offsetY * newScale
}

const getLineId = (block: Block, parentBlock: Block) => {
  return `${parentBlock.id}_${block.id}`
}

const getLine = (block: Block, parentBlock: Block): Line => {
  return {
    from: { x: parentBlock.x + BLOCK_SIZE.width / 2, y: parentBlock.y + BLOCK_SIZE.height },
    id: getLineId(block, parentBlock),
    to: { x: block.x + BLOCK_SIZE.width / 2, y: block.y },
  }
}

const getLines = () => {
  const result: Lines = {}
  for (const id in blocks.value) {
    const block = blocks.value[id]
    if (block.parentId !== null) {
      const parentBlock = blocks.value[block.parentId]
      if (parentBlock) {
        result[getLineId(block, parentBlock)] = getLine(block, parentBlock)
      }
    }
  }
  return result
}

// const blocksReverseDependencyTree = ref<Record<number, number[]>>({})

// const getBlocksReverseDependencyTree = (blocks: Blocks) => {
//   const result: Record<number, number[]> = {}
//
//   for (const blockId in blocks) {
//     if (blockId in blocks) {
//       result[Number(blockId)] = []
//     }
//   }
//
//   for (const blockId in blocks) {
//     if (blockId in blocks) {
//       const block = blocks[blockId]
//       if (block.parentId !== null) {
//         if (!result[block.parentId]) {
//           result[block.parentId] = []
//         }
//         result[block.parentId].push(block.id)
//       }
//     }
//   }
//
//   return result
// }

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

// update blocks connections
const blocksRafId = ref<null | number>(null)

watch(
  () => blocks.value,
  () => {
    if (blocksRafId.value) {
      cancelAnimationFrame(blocksRafId.value)
    }
    blocksRafId.value = requestAnimationFrame(() => {
      lines.value = getLines()
    })
  },
  { deep: true, immediate: true },
)

onMounted(async () => {
  await nextTick()
  blocks.value = cloneDeep(props.value)
  // blocksReverseDependencyTree.value = getBlocksReverseDependencyTree(blocks.value)
  lines.value = getLines()
  if (rootEl.value) {
    resizeObserver.observe(rootEl.value)
  }
  if (canvasEl.value) {
    sceneOffset.value.x = canvasEl.value.clientWidth / 2
    sceneOffset.value.y = canvasEl.value.clientHeight / 2
  }
  if (captureEl.value) {
    captureEl.value.addEventListener('mousedown', mousedown)
    captureEl.value.addEventListener('wheel', wheel, { capture: true, passive: false })
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
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
}
</style>
