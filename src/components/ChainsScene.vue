<template>
  <div :class="$style.root">
    <!--grid-->
    <ChainsGrid :scale="scene.scale" />

    <!--blocks container-->
    <div
      :class="$style.blocks"
      @contextmenu.prevent
      @mousedown="handleDown"
      @wheel.prevent="handleWheel"
      ref="blocksEl">
      <div
        :class="$style.scene"
        :style="sceneStyle"
        ref="sceneEl">
        <ChainsLines :lines="lines" />

        <ChainsSceneBlock
          :block="block"
          :dragging="block.id === draggingBlockId"
          :key="block.id"
          :ref="(el) => setBlocksRefs(el, block.id)"
          :selected="selected[block.id]"
          @mousedown="handleDownBlock(block)"
          @mouseup="handleUpBlock(block)"
          v-for="block in blocks" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ChainsGrid from '@/components/ChainsGrid.vue'
import ChainsLines from '@/components/ChainsLines.vue'
import ChainsSceneBlock from '@/components/ChainsSceneBlock.vue'
import { cloneDeep } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Block, Blocks, ICoords, Line, Lines, Scene } from './types'

const SCENE_SCALE = {
  max: 2,
  min: 0.1,
}

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

const lines = ref<Lines>({})

const scene = ref<Scene>({
  center: { x: 0, y: 0 },
  scale: 1,
})

const mouse = ref<{ current: ICoords; start: ICoords }>({
  current: { x: 0, y: 0 },
  start: { x: 0, y: 0 },
})

const dragging = ref<boolean>(false)

const draggingBlockId = ref<Block['id'] | null>(null)

const selected = ref<Record<Block['id'], true>>({})

const blocksEl = ref<HTMLDivElement | null>(null)

const blocksEls = ref<Record<Block['id'], HTMLDivElement>>({})

const setBlocksRefs = (cmp: any, id: number) => {
  if (cmp?.rootEl) {
    blocksEls.value[id] = cmp?.rootEl
  } else {
    delete blocksEls.value[id]
  }
}

const blocksReverseDependencyTree = computed(() => {
  const result: Record<number, number[]> = {}

  for (const blockId in props.blocks) {
    if (blockId in props.blocks) {
      result[Number(blockId)] = []
    }
  }

  for (const blockId in props.blocks) {
    if (blockId in props.blocks) {
      const block = props.blocks[blockId]
      if (block.parentId !== null) {
        if (!result[block.parentId]) {
          result[block.parentId] = []
        }
        result[block.parentId].push(block.id)
      }
    }
  }

  return result
})

const getTarget = (e: Event) => {
  return (e.target as HTMLElement) || (e.srcElement as HTMLElement)
}

const getOffsetRect = (element: HTMLElement) => {
  const box = element.getBoundingClientRect()

  const scrollTop = window.pageYOffset
  const scrollLeft = window.pageXOffset

  const top = box.top + scrollTop
  const left = box.left + scrollLeft

  return { left: Math.round(left), top: Math.round(top) }
}

const getMousePosition = (element: HTMLElement, event: MouseEvent) => {
  const mouseX = event.pageX || event.clientX + document.documentElement.scrollLeft
  const mouseY = event.pageY || event.clientY + document.documentElement.scrollTop

  const offset = getOffsetRect(element)
  const x = mouseX - offset.left
  const y = mouseY - offset.top

  return {
    x: x,
    y: y,
  }
}

const handleMove = (e: MouseEvent) => {
  if (!blocksEl.value) return
  if (e.ctrlKey) return

  const newMouse = getMousePosition(blocksEl.value, e)
  mouse.value.current.x = newMouse.x
  mouse.value.current.y = newMouse.y

  const diffX = mouse.value.current.x - mouse.value.start.x
  const diffY = mouse.value.current.y - mouse.value.start.y

  mouse.value.start.x = mouse.value.current.x
  mouse.value.start.y = mouse.value.current.y

  if (dragging.value) {
    scene.value.center.x += diffX
    scene.value.center.y += diffY
  }

  if (draggingBlockId.value !== null) {
    const block = cloneDeep(props.blocks[draggingBlockId.value])

    const line = getLine(block)
    if (line) {
      lines.value[getLineId(block)] = line
    }

    const childIds = blocksReverseDependencyTree.value[block.id]
    if (childIds.length) {
      for (const childId of childIds) {
        const childBlock = props.blocks[childId]
        const line = getLine(childBlock)
        if (line) {
          lines.value[getLineId(childBlock)] = line
        }
      }
    }

    const x = block.coords.x + diffX / scene.value.scale
    const y = block.coords.y + diffY / scene.value.scale

    emit('update:blocks', {
      ...props.blocks,
      [block.id]: {
        ...block,
        coords: {
          x,
          y,
        },
      },
    })
  }
}

const handleDown = (e: MouseEvent) => {
  if (!blocksEl.value) return
  const target = getTarget(e)

  const newMouse = getMousePosition(blocksEl.value, e)
  mouse.value.current.x = newMouse.x
  mouse.value.current.y = newMouse.y

  mouse.value.start.x = mouse.value.current.x
  mouse.value.start.y = mouse.value.current.y

  if (e.button === 0) {
    if (target === blocksEl.value) {
      selected.value = {}
      dragging.value = true
    }
  }
}

const handleDownBlock = (block: Block) => {
  draggingBlockId.value = block.id
}

const handleUp = () => {
  selected.value = {}
  if (draggingBlockId.value !== null) {
    selected.value[draggingBlockId.value] = true
  }

  dragging.value = false
  draggingBlockId.value = null
}

const handleUpBlock = (block: Block) => {
  selected.value[block.id] = true
}

const handleWheel = async (e: WheelEvent) => {
  if (e.preventDefault) e.preventDefault()

  const target = getTarget(e)
  if (!(blocksEl.value && blocksEl.value.contains(target))) return

  let step = -0.005
  let delta = e.deltaY

  if (e.ctrlKey) {
    delta -= e.deltaY * 0.001
    step = -0.0005
  }

  if (delta % 100 !== 0) {
    delta = (delta * 100) / 3
  }

  const deltaScale = Math.pow(1.1, delta * step)
  scene.value.scale *= deltaScale

  if (scene.value.scale < SCENE_SCALE.min) {
    scene.value.scale = SCENE_SCALE.min
    return
  }

  if (scene.value.scale > SCENE_SCALE.max) {
    scene.value.scale = SCENE_SCALE.max
    return
  }

  const deltaOffsetX = (mouse.value.current.x - scene.value.center.x) * (deltaScale - 1)
  const deltaOffsetY = (mouse.value.current.y - scene.value.center.y) * (deltaScale - 1)

  scene.value.center.x -= deltaOffsetX
  scene.value.center.y -= deltaOffsetY
}

const getLineId = (block: Block) => {
  return `${block.parentId}:${block.id}`
}

const getLines = (): Lines => {
  const lines: Lines = {}

  for (const blockId in props.blocks) {
    const block = props.blocks[blockId]

    const line = getLine(block)

    if (line) {
      lines[getLineId(block)] = line
    }
  }

  return lines
}

const getLine = (block: Block): Line | null => {
  const parentBlock = block.parentId !== null ? props.blocks[block.parentId] : null
  if (!parentBlock) return null

  const blockLinkCoords = getConnectionPos(block)
  const parentBlockLinkCoords = getConnectionPos(parentBlock, true)

  return {
    end: {
      x: blockLinkCoords.x,
      y: blockLinkCoords.y,
    },
    start: {
      x: parentBlockLinkCoords.x,
      y: parentBlockLinkCoords.y,
    },
  }
}

const getConnectionPos = (block: Block, parent = false) => {
  let { x, y } = block.coords

  const blockEl = blocksEls.value[block.id]

  if (blockEl) {
    const { height, width } = blockEl.getBoundingClientRect()

    x += width / 2 / scene.value.scale

    if (parent) {
      y += height / scene.value.scale
    }
  }

  return { x, y }
}

onMounted(async () => {
  await nextTick()

  if (blocksEl.value) {
    scene.value.center.x = blocksEl.value.clientWidth / 2
    scene.value.center.y = blocksEl.value.clientHeight / 2
    lines.value = getLines()
  }

  document.documentElement.addEventListener('mousemove', handleMove)
  document.documentElement.addEventListener('mouseup', handleUp)
})

onBeforeUnmount(() => {
  document.documentElement.removeEventListener('mousemove', handleMove)
  document.documentElement.removeEventListener('mouseup', handleUp)
})

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
      const {
        center: { x, y },
        scale,
      } = scene.value
      sceneStyle.value.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    })
  },
  { deep: true, immediate: true },
)
</script>

<style module>
.root {
  height: 100%;
  overflow: hidden;
  position: relative;
  user-select: none;
  width: 100%;
  z-index: 0;
}

.blocks {
  height: 100%;
  left: 0;
  overflow: hidden;
  position: relative;
  top: 0;
  transform: translateZ(0);
  width: 100%;
  z-index: 0;
}

.scene {
  height: 0;
  overflow: visible;
  position: absolute;
  transform: translateZ(0);
  transform-origin: top left;
  width: 0;
  will-change: contents;
  z-index: 0;
}
</style>
