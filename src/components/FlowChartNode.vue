<template>
  <div
    :class="[
      $style.root,
      {
        [$style.dragging]: dragging,
        [$style.selected]: selected,
      },
    ]"
    :style="{
      transform: `translate3d(${props.node.x}px, ${props.node.y}px, 0)`,
    }"
    @mousedown.passive.capture.stop="mousedown"
    @mouseup.passive.capture.stop="mouseup">
    <div
      :class="[$style.connectionPoint, $style.connectionPointInput]"
      ref="input" />
    <div :class="$style.header">
      <span :class="$style.text"> id: {{ node.id }} </span>
    </div>
    <div :class="$style.content">
      <slot>
        <code>
          x: {{ node.x }}
          <br>
          y: {{ node.y }}
        </code>
      </slot>
    </div>
    <div
      :class="[$style.connectionPoint, $style.connectionPointOutput]"
      ref="output" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Node } from './types'

const props = defineProps<{
  dragging: boolean
  node: Node
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'input-end', value: MouseEvent): void
  (e: 'input-start', value: MouseEvent): void
  (e: 'mousedown', value: MouseEvent): void
  (e: 'mouseup', value: MouseEvent): void
  (e: 'output-start', value: MouseEvent): void
}>()

const input = ref<HTMLDivElement>()
const output = ref<HTMLDivElement>()

function mousedown(e: MouseEvent) {
  if (e.target === input.value!) {
    emit('input-start', e)
    return
  }
  if (e.target === output.value!) {
    emit('output-start', e)
    return
  }
  emit('mousedown', e)
}

function mouseup(e: MouseEvent) {
  if (e.target === input.value!) {
    emit('input-end', e)
    return
  }
  emit('mouseup', e)
}
</script>

<style module>
.root {
  background-color: var(--color-background-100);
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
}

.dragging {
  box-shadow: 0 16px 32px -4px var(--box-shadow);
  cursor: grabbing;
  z-index: 3;
}

.selected {
  border-color: var(--color-primary-400);
  z-index: 2;
}

.header {
  align-items: center;
  background-color: var(--color-primary-400);
  border-radius: 8px;
  display: flex;
  gap: 8px;
  height: 28px;
  padding: 8px;
  width: 100%;

  .text {
    color: var(--color-white);
    display: block;
    flex-grow: 1;
    font-size: 12px;
    font-weight: bold;
    line-height: 16px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }
}

.content {
  color: var(--color-text-100);
  display: block;
  font-size: 12px;
  height: auto;
  max-height: calc(100% - 28px);
  max-width: 100%;
  overflow: hidden;
  padding: 4px 8px;
  text-overflow: ellipsis;
  width: 100%;

  code {
    white-space: nowrap;
  }
}

.connectionPoint {
  background-color: var(--color-primary-400);
  border: 2px solid var(--color-background-100);
  border-radius: 50%;
  cursor: pointer;
  height: 8px;
  left: 50%;
  position: absolute;
  width: 8px;
  z-index: 4;
}

.connectionPointInput {
  left: 50%;
  top: -2px;
  transform: translate(-50%, -50%);

  &:hover {
    transform: translate(-50%, -50%) scale(1.5);
  }
}

.connectionPointOutput {
  bottom: -2px;
  left: 50%;
  transform: translate(-50%, 50%);

  &:hover {
    transform: translate(-50%, 50%) scale(1.5);
  }
}
</style>
