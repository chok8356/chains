<template>
  <svg
    :class="$style.root"
    height="100%"
    width="100%">
    <g
      :key="lineId"
      v-for="(line, lineId) in lines">
      <path :d="getPath(line)" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { Line, Lines } from './types'

withDefaults(
  defineProps<{
    lines: Lines
  }>(),
  {
    lines: () => ({}),
  },
)

const distance = ({ end, start }: Line) => {
  return Math.sqrt((end.x - start.x) * (end.x - start.x) + (end.y - start.y) * (end.y - start.y))
}

const getPath = ({ end, start }: Line) => {
  const dist = distance({ end, start }) * 0.25
  return `M ${start.x}, ${start.y} C ${start.x}, ${start.y + dist}, ${end.x}, ${end.y - dist}, ${end.x}, ${end.y}`
}
</script>

<style module>
.root {
  fill: none;
  height: auto;
  left: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  stroke: var(--color-grey-400);
  stroke-opacity: 1;
  stroke-width: 1;
  top: 0;
  transform-origin: top left;
  width: auto;
  will-change: transform;
  z-index: 0;
}
</style>
