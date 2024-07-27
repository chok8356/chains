<template>
  <div
    :class="$style.root"
    @mousedown.passive.stop="mousedown"
    @wheel.passive.stop.capture="wheel"
    ref="rootEl">
    <div :class="$style.renderer">
      <FlowChartGrid :scene="scene" />
      <div
        :class="$style.blocks"
        :style="{
          transform: `translate3d(${scene.center.x}px, ${scene.center.y}px, 0) scale(${scene.scale})`,
        }">
        <div :class="$style.center"></div>
        <FlowChartLine
          :key="lineId"
          :line="line"
          v-for="(line, lineId) in lines"
          v-memo="[
            line.start.x,
            line.start.y,
            line.start.id,
            line.end.x,
            line.end.y,
            line.end.id,
          ]" />

        <FlowChartLine
          :key="`${draggingLine.start.id}:${draggingLine.end.id}`"
          :line="draggingLine"
          v-if="draggingLine" />

        <FlowChartNode
          :dragging="node.id === draggingNodeId"
          :key="node.id"
          :node="node"
          :selected="node.id === selectedNodeId"
          @input="inputNode(node.id)"
          @mousedown.passive.stop="mousedownNode(node.id)"
          @output="outputNode(node.id)"
          v-for="node in nodes"
          v-memo="[node.x, node.y, node.id === draggingNodeId, node.id === selectedNodeId]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BLOCK_SIZE, SCENE_SCALE, ZOOM_INTENSITY } from '@/components/constants'
import FlowChartGrid from '@/components/FlowChartGrid.vue'
import FlowChartLine from '@/components/FlowChartLine.vue'
import FlowChartNode from '@/components/FlowChartNode.vue'
import { type Blocks, type Line, type Node } from '@/components/types'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const props = defineProps<{
  value?: Blocks
}>()

defineEmits<{
  (e: 'update:value', value: any): void
}>()

const rootEl = ref<HTMLDivElement>()

const rafId = ref<number>()

const dragging = ref(false)
const draggingNodeId = ref<Node['id']>()
const selectedNodeId = ref<Node['id']>()

// Graph
const nodes = ref<Record<Node['id'], Node>>({})

const lines = ref<Record<string, Line>>({})

const draggingLine = ref<Line>()

const createLineId = (startId: Node['id'], endId: Node['id']) => `${startId}:${endId}`

const createLine = (startId: Node['id'], endId: Node['id']): Line => {
  const start = nodes.value[startId]!
  const end = nodes.value[endId]!

  return {
    end: {
      id: end.id,
      x: end.x + BLOCK_SIZE.width / 2,
      y: end.y,
    },
    start: {
      id: start.id,
      x: start.x + BLOCK_SIZE.width / 2,
      y: start.y + BLOCK_SIZE.height,
    },
  }
}

const addNode = (id: Node['id'], x: number, y: number, inputId?: Node['id']): void => {
  if (nodes.value[id]) throw new Error(`Node with id ${id} already exists`)

  nodes.value[id] = {
    id,
    inputId,
    outputIds: new Set(),
    x,
    y,
  }

  if (inputId) {
    const entryPoint = nodes.value[inputId]

    if (entryPoint) {
      entryPoint.outputIds.add(id)
      lines.value[createLineId(inputId, id)] = createLine(inputId, id)
    }
  }
}

const moveNode = (id: Node['id'], deltaX: number, deltaY: number): void => {
  const node = nodes.value[id]

  if (!node) throw new Error(`Node with id ${id} does not exist`)

  node.x += deltaX
  node.y += deltaY

  if (node.inputId) {
    const inputLine = lines.value[createLineId(node.inputId, node.id)]

    if (inputLine) {
      inputLine.end.x += deltaX
      inputLine.end.y += deltaY
    }
  }

  for (const outputId of node.outputIds) {
    const outputLine = lines.value[createLineId(node.id, outputId)]

    if (outputLine) {
      outputLine.start.x += deltaX
      outputLine.start.y += deltaY
    }
  }
}

const changeParentNode = (nodeId: Node['id'], newParentId?: Node['id']): void => {
  const node = nodes.value[nodeId]

  if (!node) throw new Error(`Node with id ${nodeId} does not exist`)

  if (node.inputId) {
    const oldParent = nodes.value[node.inputId]
    if (oldParent) {
      oldParent.outputIds.delete(nodeId)
      const oldLineId = createLineId(node.inputId, nodeId)
      delete lines.value[oldLineId]
    }
  }

  node.inputId = newParentId

  if (newParentId) {
    const newParent = nodes.value[newParentId]
    if (newParent) {
      newParent.outputIds.add(nodeId)
      const newLineId = createLineId(newParentId, nodeId)
      lines.value[newLineId] = createLine(newParentId, nodeId)
    }
  }
}

// Check for the presence of a cycle (Depth-First Search)
const hasCycle = (nodeId: Node['id'], newParentId?: Node['id']): boolean => {
  const visited = new Set<Node['id']>()
  const stack = [nodeId]

  while (stack.length > 0) {
    const currentId = stack.pop()!
    if (currentId === newParentId) return true
    if (!visited.has(currentId)) {
      visited.add(currentId)
      const node = nodes.value[currentId]
      if (node) {
        for (const outputId of node.outputIds) {
          stack.push(outputId)
        }
      }
    }
  }

  return false
}

// Scene
const scene = reactive({
  center: {
    x: 0,
    y: 0,
  },
  position: {
    left: 0,
    top: 0,
  },
  scale: 1,
})

const mouse = reactive({
  current: { x: 0, y: 0 },
  start: { x: 0, y: 0 },
})

// Events
const wheel = (e: WheelEvent) => {
  if (rafId.value) cancelAnimationFrame(rafId.value)

  rafId.value = requestAnimationFrame(() => {
    const oldScale = scene.scale

    const newScale = Math.min(
      Math.max(
        Math.exp(Math.log(scene.scale) + Math.sign(-e.deltaY) * ZOOM_INTENSITY),
        SCENE_SCALE.min,
      ),
      SCENE_SCALE.max,
    )

    const mouseX = e.clientX - scene.position.left
    const mouseY = e.clientY - scene.position.top

    const scaleRatio = newScale / oldScale

    scene.center.x -= (mouseX - scene.center.x) * (scaleRatio - 1)
    scene.center.y -= (mouseY - scene.center.y) * (scaleRatio - 1)

    scene.scale = newScale
  })
}

const mousedown = (e: MouseEvent) => {
  dragging.value = true

  selectedNodeId.value = undefined

  mouse.start.x = e.clientX
  mouse.start.y = e.clientY
}

const mouseup = (e: MouseEvent) => {
  e.stopPropagation()

  if (draggingNodeId.value !== undefined) {
    selectedNodeId.value = draggingNodeId.value
  }

  dragging.value = false
  draggingNodeId.value = undefined
  draggingLine.value = undefined
}

const mousemove = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  mouse.current.x = e.clientX
  mouse.current.y = e.clientY

  if (rafId.value) cancelAnimationFrame(rafId.value)

  rafId.value = requestAnimationFrame(() => {
    const deltaX = mouse.current.x - mouse.start.x
    const deltaY = mouse.current.y - mouse.start.y

    if (dragging.value) {
      scene.center.x += deltaX
      scene.center.y += deltaY
    }

    if (draggingNodeId.value !== undefined) {
      moveNode(draggingNodeId.value, deltaX / scene.scale, deltaY / scene.scale)
    }

    if (draggingLine.value !== undefined) {
      draggingLine.value.end.x += deltaX / scene.scale
      draggingLine.value.end.y += deltaY / scene.scale
    }

    mouse.start.x = mouse.current.x
    mouse.start.y = mouse.current.y
  })
}

// Events Node
const mousedownNode = (nodeId: Node['id']) => {
  draggingNodeId.value = nodeId
}

const outputNode = (nodeId: Node['id']) => {
  const node = nodes.value[nodeId]

  const x = node.x + BLOCK_SIZE.width / 2
  const y = node.y + BLOCK_SIZE.height

  draggingLine.value = {
    end: {
      x,
      y,
    },
    start: {
      id: node.id,
      x,
      y,
    },
  }
}

const inputNode = (nodeId: Node['id']) => {
  if (draggingLine.value !== undefined) {
    const { id: newParentId } = draggingLine.value.start
    if (newParentId !== nodeId) {
      if (hasCycle(nodeId, draggingLine.value.start.id)) {
        throw new Error(`Cyclic dependency was found: ${nodeId} and ${newParentId}`)
      } else {
        changeParentNode(nodeId, newParentId)
      }
    }
  }
}

onMounted(() => {
  if (props.value) {
    for (const blockId in props.value) {
      const block = props.value[blockId]
      addNode(block.id, block.x, block.y, block.parentId)
    }
  }

  if (rootEl.value) {
    const { left, top } = rootEl.value.getBoundingClientRect()
    scene.position.left = left
    scene.position.top = top
    scene.center.x = rootEl.value.clientWidth / 2
    scene.center.y = rootEl.value.clientHeight / 2
  }

  document.documentElement.addEventListener('mousemove', mousemove, true)
  document.documentElement.addEventListener('mouseup', mouseup, { capture: false, passive: true })
})

onBeforeUnmount(() => {
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

.renderer {
  inset: 0;
  overflow: hidden;
  position: absolute;
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
  background-color: red;
  border-radius: 50%;
  height: 4px;
  left: 50%;
  pointer-events: none;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
}
</style>
