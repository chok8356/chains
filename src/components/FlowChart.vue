<template>
  <div
    :class="$style.root"
    @mousedown.passive.stop="mousedown"
    @wheel.passive.capture.stop="wheel"
    ref="rootEl">
    <FlowChartGrid :scene="scene" />
    <div
      :class="$style.scene"
      :style="{
        transform: `translate3d(${scene.center.x}px, ${scene.center.y}px, 0) scale(${scene.scale})`,
      }">
      <div :class="$style.center" />

      <div :class="$style.lines">
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
      </div>

      <FlowChartLine
        :key="`${draggingLine.start.id}:${draggingLine.end.id}`"
        :line="draggingLine"
        v-if="draggingLine" />

      <FlowChartNode
        :dragging="draggingNodes && selectedNodeIds.has(node.id)"
        :key="node.id"
        :node="node"
        :selected="selectedNodeIds.has(node.id)"
        @input-end="inputEndNode(node.id)"
        @input-start="inputStartNode(node.id)"
        @mousedown="(e) => mousedownNode(e, node.id)"
        @output-start="outputStartNode(node.id)"
        v-for="node in nodes"
        v-memo="[node.x, node.y, draggingNodes, selectedNodeIds.has(node.id)]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { Blocks, Line, Node } from '@/components/types'

import { BLOCK_SIZE, SCENE_SCALE, ZOOM_INTENSITY } from '@/components/constants'
import FlowChartGrid from '@/components/FlowChartGrid.vue'
import FlowChartLine from '@/components/FlowChartLine.vue'
import FlowChartNode from '@/components/FlowChartNode.vue'

const props = defineProps<{
  value: Blocks
}>()

defineEmits<{
  (e: 'update:value', value: any): void
}>()

const rootEl = ref<HTMLDivElement>()

let animationFrameId: null | number = null

const dragging = ref(false)
const draggingNodes = ref(false)

const draggingLine = ref<Line>()

const selectedNodeIds = ref<Set<Node['id']>>(new Set())

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

const mouse = {
  current: { x: 0, y: 0 },
  start: { x: 0, y: 0 },
}

// Graph
const nodes = ref<Record<Node['id'], Node>>({})

const lines = ref<Record<string, Line>>({})

const createLineId = (startId: Node['id'], endId: Node['id']) => `${startId}:${endId}`

function createLine(startId: Node['id'], endId: Node['id']): Line {
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

function addNode(id: Node['id'], x: number, y: number, inputId: Node['id'] | undefined): void {
  if (nodes.value[id]) {
    throw new Error(`Node with id ${id} already exists`)
  }

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

function moveNode(id: Node['id'], deltaX: number, deltaY: number): void {
  const node = nodes.value[id]

  if (!node) {
    throw new Error(`Node with id ${id} does not exist`)
  }

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

function changeParentNode(nodeId: Node['id'], newParentId: Node['id'] | undefined): void {
  const node = nodes.value[nodeId]

  if (!node) {
    throw new Error(`Node with id ${nodeId} does not exist`)
  }

  if (node.inputId !== undefined) {
    const oldParent = nodes.value[node.inputId]
    if (oldParent) {
      oldParent.outputIds.delete(nodeId)
      delete lines.value[createLineId(node.inputId, nodeId)]
    }
  }

  node.inputId = newParentId

  if (newParentId !== undefined) {
    const newParent = nodes.value[newParentId]
    if (newParent) {
      newParent.outputIds.add(nodeId)
      lines.value[createLineId(newParentId, nodeId)] = createLine(newParentId, nodeId)
    }
  }
}

// Graph Depth-First Search
function checkNodeHasCycle(nodeId: Node['id'], newParentId: Node['id'] | undefined): boolean {
  const visited = new Set<Node['id']>()
  const stack = [nodeId]

  while (stack.length > 0) {
    const currentId = stack.pop()!

    if (currentId === newParentId) {
      return true
    }

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

// Events
function wheel(e: WheelEvent) {
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

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  animationFrameId = requestAnimationFrame(() => {
    scene.center.x -= (mouseX - scene.center.x) * (scaleRatio - 1)
    scene.center.y -= (mouseY - scene.center.y) * (scaleRatio - 1)

    scene.scale = newScale
  })
}

function mousedown(e: MouseEvent) {
  dragging.value = true

  selectedNodeIds.value = new Set()

  mouse.start.x = e.clientX
  mouse.start.y = e.clientY
}

function mouseup() {
  setTimeout(() => {
    dragging.value = false
    draggingNodes.value = false
    draggingLine.value = undefined
  }, 0)
}

function mousemove(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()

  mouse.current.x = e.clientX
  mouse.current.y = e.clientY

  const deltaX = mouse.current.x - mouse.start.x
  const deltaY = mouse.current.y - mouse.start.y

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  animationFrameId = requestAnimationFrame(() => {
    if (dragging.value) {
      scene.center.x += deltaX
      scene.center.y += deltaY
    }

    if (draggingNodes.value) {
      for (const nodeId of selectedNodeIds.value) {
        moveNode(nodeId, deltaX / scene.scale, deltaY / scene.scale)
      }
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
function mousedownNode(e: MouseEvent, nodeId: Node['id']) {
  if (e.ctrlKey) {
    if (selectedNodeIds.value.has(nodeId)) {
      selectedNodeIds.value.delete(nodeId)
    }
    else {
      selectedNodeIds.value.add(nodeId)
    }
  }
  else {
    if (selectedNodeIds.value.has(nodeId)) {
      draggingNodes.value = true
    }
    else {
      selectedNodeIds.value = new Set([nodeId])
      draggingNodes.value = true
    }
  }
}

function outputStartNode(nodeId: Node['id']) {
  const node = nodes.value[nodeId]

  const x = node.x + BLOCK_SIZE.width / 2
  const y = node.y + BLOCK_SIZE.height

  draggingLine.value = {
    end: {
      id: undefined,
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

function inputStartNode(nodeId: Node['id']) {
  const node = nodes.value[nodeId]

  if (node.inputId !== undefined) {
    const inputNode = nodes.value[node.inputId]

    draggingLine.value = {
      end: {
        id: undefined,
        x: node.x + BLOCK_SIZE.width / 2,
        y: node.y,
      },
      start: {
        id: inputNode.id,
        x: inputNode.x + BLOCK_SIZE.width / 2,
        y: inputNode.y + BLOCK_SIZE.height,
      },
    }

    changeParentNode(nodeId, undefined)
  }
}

function inputEndNode(nodeId: Node['id']) {
  if (draggingLine.value !== undefined) {
    const { id: newParentId } = draggingLine.value.start

    if (newParentId !== nodeId) {
      if (checkNodeHasCycle(nodeId, newParentId)) {
        throw new Error(`Cyclic dependency was found: ${nodeId} and ${newParentId}`)
      }
      else {
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
    const { height, left, top, width } = rootEl.value.getBoundingClientRect()
    scene.position.left = left
    scene.position.top = top
    scene.center.x = width / 2
    scene.center.y = height / 2
  }

  document.documentElement.addEventListener('mousemove', mousemove, true)
  document.documentElement.addEventListener('mouseup', mouseup, true)
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
  inset: 0;
  overflow: hidden;
  position: relative;
  transform: translate3d(0, 0, 0);
  width: 100%;
}

.scene {
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

.lines {
  height: 0;
  left: 0;
  position: absolute;
  top: 0;
  transform: translate3d(0, 0, 0);
  transform-origin: top left;
  width: 0;
  will-change: transform;
}
</style>
