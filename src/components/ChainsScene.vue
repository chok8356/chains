<template>
  <div :class="$style.root">
    <!--blocks container-->
    <div
      :class="$style.blocks"
      @contextmenu.capture.stop="handleContextMenu"
      @mousedown.capture.stop="handleDown"
      @wheel.capture.stop="handleWheel"
      ref="blocksEl">
      <div
        :class="$style.scene"
        ref="sceneEl">
        <template
          :key="block.id"
          v-for="block in blocks">
          <div
            :class="$style.block"
            :ref="(el) => setBlocksRefs(el, block.id)">
            {{ block.id }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { throttle } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Block, Blocks, ICoords, Lines, Scene } from './types'

import ChainsSceneBlock from './ChainsSceneBlock.vue'

const SCENE_SCALE = {
  max: 3,
  min: 0.1,
}

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

const lines = ref<Lines>({})

const moveRafId = ref<null | number>(null)
const moveTimeout = ref<null | number>(null)
const wheelRafId = ref<null | number>(null)
const wheelTimeout = ref<null | number>(null)

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
const sceneEl = ref<HTMLDivElement | null>(null)

const blocksEls = ref<Record<Block['id'], HTMLDivElement>>({})

const setBlocksRefs = (el: any, id: number) => {
  if (el) {
    blocksEls.value[id] = el
  } else {
    delete blocksEls.value[id]
  }
}

const sceneStyle = computed(() => {
  const { x, y } = scene.value.center
  return {
    transform: `translate3d(${x}px, ${y}px, 0) scale(${scene.value.scale})`,
    transformOrigin: 'top left',
  }
})

const handleMove = throttle((e: MouseEvent) => {
  if (dragging.value) {
    // scene.value.center.x = e.clientX - mouse.value.start.x
    // scene.value.center.y = e.clientY - mouse.value.start.y
    if (moveRafId.value) {
      cancelAnimationFrame(moveRafId.value)
    }
    moveRafId.value = requestAnimationFrame(() => {
      scene.value.center.x = e.clientX - mouse.value.start.x
      scene.value.center.y = e.clientY - mouse.value.start.y
    })
  }
}, THROTTLE_TIME)

const handleDown = (e: MouseEvent) => {
  dragging.value = true
  mouse.value.start.x = e.clientX - scene.value.center.x
  mouse.value.start.y = e.clientY - scene.value.center.y
}

const handleUp = () => {
  dragging.value = false
}

const handleWheel = throttle((e: WheelEvent) => {
  scene.value.scale = Math.max(
    SCENE_SCALE.min,
    Math.min(SCENE_SCALE.max, (scene.value.scale += e.deltaY > 0 ? -0.1 : 0.1)),
  )

  // if (wheelRafId.value) {
  //   cancelAnimationFrame(wheelRafId.value)
  // }
  // wheelRafId.value = requestAnimationFrame(() => {
  //   scene.value.scale = Math.max(
  //     SCENE_SCALE.min,
  //     Math.min(SCENE_SCALE.max, (scene.value.scale += e.deltaY > 0 ? -0.1 : 0.1)),
  //   )
  // })
}, THROTTLE_TIME)

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  return false
}

onMounted(async () => {
  await nextTick()

  document.documentElement.addEventListener('mousemove', handleMove)
  document.documentElement.addEventListener('mouseup', handleUp)
})

onBeforeUnmount(() => {
  document.documentElement.removeEventListener('mousemove', handleMove)
  document.documentElement.removeEventListener('mouseup', handleUp)
})

const sceneRafId = ref<null | number>(null)

watch(
  () => scene.value,
  () => {
    if (sceneRafId.value) {
      cancelAnimationFrame(sceneRafId.value)
    }
    sceneRafId.value = requestAnimationFrame(() => {
      if (sceneEl.value) {
        sceneEl.value.style.transform = `translate3d(${scene.value.center.x}px, ${scene.value.center.y}px, 0) scale(${scene.value.scale})`
      }
    })
  },
  { deep: true },
)

const blocksRafId = ref<null | number>(null)
watch(
  () => props.blocks,
  () => {
    if (blocksRafId.value) {
      cancelAnimationFrame(blocksRafId.value)
    }
    blocksRafId.value = requestAnimationFrame(() => {
      for (const blockId in props.blocks) {
        const { x, y } = props.blocks[blockId].coords
        blocksEls.value[blockId].style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    })
  },
  { deep: true },
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

.blocks {
  height: 100%;
  left: 0;
  position: relative;
  top: 0;
  transform: translateZ(0);
  width: 100%;
  z-index: 0;
}

.listener {
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 1;
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

.block {
  background-color: var(--color-white);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 4px 8px transparent;
  cursor: grab;
  height: auto;
  min-height: 98px;
  overflow: hidden;
  padding: 4px;
  position: absolute;
  transition:
    box-shadow 200ms,
    border-color 200ms;
  user-select: none;
  width: 168px;
  will-change: transform;
  z-index: 1;
}
</style>
