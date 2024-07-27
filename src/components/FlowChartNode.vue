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
    }">
    <div
      :class="[$style.connectionPoint, $style.connectionPointInput]"
      @mouseup.passive.capture="input"></div>
    <div :class="$style.header">
      <span :class="$style.text"> id: {{ node.id }} </span>
    </div>
    <div :class="$style.content">
      <slot>
        <code>
          x: {{ node.x }}
          <br />
          y: {{ node.y }}
        </code>
      </slot>
    </div>
    <div
      :class="[$style.connectionPoint, $style.connectionPointOutput]"
      @mousedown.passive.stop.capture="output"></div>
  </div>
</template>

<script setup lang="ts">
import { type Node } from './types'

const props = defineProps<{
  dragging: boolean
  node: Node
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'input'): void
  (e: 'output'): void
}>()

const input = () => {
  emit('input')
}

const output = () => {
  emit('output')
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
  box-shadow: 0 12px 24px 2px var(--box-shadow);
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
  background-color: var(--color-background-100);
  border: 1px solid var(--color-primary-400);
  border-radius: 50%;
  cursor: pointer;
  height: 6px;
  left: 50%;
  position: absolute;
  width: 6px;
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
