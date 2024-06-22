<template>
  <div :class="$style.root">
    <!--grid-->
    <ChainsGrid
      :class="$style.grid"
      :scale="scene.scale" />

    <!--lines-->
    <ChainsLines
      :class="$style.lines"
      :lines="lines"
      :scale="scene.scale" />

    <!--blocks container-->
    <div
      :class="$style.blocks"
      @contextmenu.capture.stop="handleContextMenu"
      @mousedown.capture.stop="handleDown"
      @wheel.capture.stop="handleWheel"
      ref="blocksEl">
      <div
        :class="$style.scene"
        :style="sceneStyles">
        <ChainsSceneBlock
          :block="block"
          :dragging="block.id === draggingBlockId"
          :key="block.id"
          :ref="(el) => setBlocksRefs(el, block.id)"
          :selected="selected[block.id]"
          @mousedown="handleDownBlock(block)"
          @mouseup="handleUpBlock(block)"
          v-for="block in blocks"
          v-memo="[block.id === draggingBlockId, selected[block.id]]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Block, Blocks, ICoords, Line, Lines, Scene } from './types'

import ChainsGrid from './ChainsGrid.vue'
import ChainsLines from './ChainsLines.vue'
import ChainsSceneBlock from './ChainsSceneBlock.vue'

const SCENE_SCALE = {
  max: 1.5,
  min: 0.2,
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

const mouse = ref<{ current: ICoords; last: ICoords }>({
  current: { x: 0, y: 0 },
  last: { x: 0, y: 0 },
})

const dragging = ref<boolean>(false)
const draggingBlockId = ref<Block['id'] | null>(null)

const selected = ref<Record<Block['id'], true>>({})

const blocksEl: any = ref(null)

const blocksEls: any = ref({})

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

  const diffX = mouse.value.current.x - mouse.value.last.x
  const diffY = mouse.value.current.y - mouse.value.last.y

  mouse.value.last.x = mouse.value.current.x
  mouse.value.last.y = mouse.value.current.y

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
  const target = getTarget(e)

  const newMouse = getMousePosition(blocksEl.value, e)
  mouse.value.current.x = newMouse.x
  mouse.value.current.y = newMouse.y

  mouse.value.last.x = mouse.value.current.x
  mouse.value.last.y = mouse.value.current.y

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

const handleWheelScroll = (step: number, zoomingCenter: ICoords) => {
  const deltaScale = Math.pow(1.1, step)
  scene.value.scale *= deltaScale

  if (scene.value.scale < SCENE_SCALE.min) {
    scene.value.scale = SCENE_SCALE.min
    return
  }

  if (scene.value.scale > SCENE_SCALE.max) {
    scene.value.scale = SCENE_SCALE.max
    return
  }

  const deltaOffsetX = (zoomingCenter.x - scene.value.center.x) * (deltaScale - 1)
  const deltaOffsetY = (zoomingCenter.y - scene.value.center.y) * (deltaScale - 1)

  scene.value.center.x -= deltaOffsetX
  scene.value.center.y -= deltaOffsetY
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

  handleWheelScroll(delta * step, mouse.value.current)
}

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  return false
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
  let x = scene.value.center.x + block.coords.x * scene.value.scale
  let y = scene.value.center.y + block.coords.y * scene.value.scale

  const blockEl = blocksEls.value[block.id]

  if (blockEl) {
    const { height, width } = blockEl.getBoundingClientRect()

    x += width / 2

    if (parent) {
      y += height
    }
  }

  return { x, y }
}

const sceneRafId = ref<null | number>(null)
const sceneStyles = ref<{ transform: string }>({
  transform: ``,
})

watch(
  () => scene.value,
  () => {
    if (sceneRafId.value) {
      cancelAnimationFrame(sceneRafId.value)
    }
    sceneRafId.value = requestAnimationFrame(() => {
      lines.value = getLines()
      const {
        center: { x, y },
        scale,
      } = scene.value
      sceneStyles.value.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
    })
  },
  { deep: true, immediate: true },
)

onMounted(async () => {
  await nextTick()

  scene.value.center.x = blocksEl.value.clientWidth / 2
  scene.value.center.y = blocksEl.value.clientHeight / 2
  lines.value = getLines()

  document.documentElement.addEventListener('mousemove', handleMove)
  document.documentElement.addEventListener('mouseup', handleUp)
})

onBeforeUnmount(() => {
  document.documentElement.removeEventListener('mousemove', handleMove)
  document.documentElement.removeEventListener('mouseup', handleUp)
})
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

.grid {
  height: calc(100% + 2px);
  left: -1px;
  position: absolute;
  top: -1px;
  width: calc(100% + 2px);
}

.lines {
  height: 100%;
  left: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 0;
}

.scene {
  height: 0;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translateZ(0);
  transform-origin: top left;
  width: 0;
  will-change: contents;
  z-index: 0;
}

.blocks {
  height: 100%;
  left: 0;
  position: relative;
  top: 0;
  transform: translateZ(0);
  width: 100%;
  z-index: 0;
}
</style>
