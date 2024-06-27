<template>
  <div
    :class="[
      $style.root,
      {
        [$style.dragging]: dragging,
        [$style.selected]: selected,
      },
    ]"
    :data-block-type="SceneBlockType.Block"
    :id="String(block.id)"
    ref="blockEl">
    <div
      :class="[$style.connectionPoint, $style.connectionPointInput]"
      :data-event-type="SceneEventType.Input"
      :style="{ borderColor: settings.color }"></div>
    <div
      :class="$style.header"
      :style="{ backgroundColor: settings.color }">
      <div :class="$style.icon" />
      <span :class="$style.text">
        {{ settings.text }}
      </span>
      <div :class="[$style.icon, $style.iconEdit]" />
    </div>
    <div :class="$style.content">
      <slot>
        <code> {{ block.x }} {{ block.y }} </code>
      </slot>
    </div>
    <div
      :class="[$style.connectionPoint, $style.connectionPointOutput]"
      :data-event-type="SceneEventType.Output"
      :style="{ borderColor: settings.color }"></div>
  </div>
</template>

<script setup lang="ts">
import { colord } from 'colord'
import { onMounted, ref, watch } from 'vue'

import { type Block, SceneBlockType, SceneEventType } from './types'
import { getBlockSettings } from './utils'

const props = withDefaults(
  defineProps<{
    block: Block
    dragging: boolean
    selected: boolean
  }>(),
  {
    block: () => ({
      id: -1,
      parentId: null,
      type: 'StatusActionHandler',
      x: 0,
      y: 0,
    }),
    dragging: false,
    selected: false,
  },
)

const blockEl = ref<HTMLDivElement | null>(null)

const settings = getBlockSettings(props.block)
const shadowColor = colord(settings.color).alpha(0.2).toRgbString()

const animate = () => {
  if (blockEl.value) {
    blockEl.value.style.transform = `translate3d(${props.block.x}px, ${props.block.y}px, 0)`
    blockEl.value.style.borderColor = props.selected ? settings.color : 'transparent'
    blockEl.value.style.boxShadow = props.dragging ? `0px 21px 28px ${shadowColor}` : ''
  }
}

const rafId = ref<null | number>(null)

watch(
  () => props,
  () => {
    if (rafId.value) cancelAnimationFrame(rafId.value)
    rafId.value = requestAnimationFrame(animate)
  },
  { deep: true, flush: 'post' },
)

onMounted(animate)
</script>

<style module>
.root {
  background-color: var(--color-white);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 4px 8px transparent;
  cursor: grab;
  height: 98px;
  padding: 4px;
  position: absolute;
  transform: translateZ(0);
  transform-origin: top left;
  transition:
    box-shadow 200ms,
    border-color 200ms;
  user-select: none;
  width: 168px;
  will-change: transform;
  z-index: 1;

  .iconEdit {
    cursor: pointer;
    display: none;
  }

  &:hover {
    .iconEdit {
      display: block;
    }
  }
}

.dragging {
  cursor: grabbing;
  z-index: 3;
}

.selected {
  z-index: 2;
}

.header {
  align-items: center;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  height: 28px;
  padding: 8px;
  width: 100%;

  .icon {
    color: var(--color-white);
    font-size: 16px;
  }

  .text {
    color: var(--color-white);
    display: block;
    flex-grow: 1;
    font-size: 12px;
    line-height: 16px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.content {
  display: block;
  height: auto;
  max-height: calc(100% - 28px);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.connectionPoint {
  background-color: var(--color-white);
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  height: 8px;
  left: 50%;
  position: absolute;
  width: 8px;
  z-index: 4;
}

.connectionPointInput {
  top: -2px;
  transform: translate(-50%, -50%);

  &:hover {
    transform: translate(-50%, -50%) scale(1.5);
  }
}

.connectionPointOutput {
  bottom: -2px;
  transform: translate(-50%, 50%);

  &:hover {
    transform: translate(-50%, 50%) scale(1.5);
  }
}
</style>
