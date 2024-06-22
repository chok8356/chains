<template>
  <svg
    :class="$style.root"
    height="100%"
    width="100%">
    <g
      :key="lineId"
      v-for="(line, lineId) in lines">
      <path
        :d="getPath(line)"
        :style="{
          strokeWidth: scale,
        }" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { Line, Lines } from './types'

withDefaults(
  defineProps<{
    lines: Lines
    scale?: number
  }>(),
  {
    lines: () => ({}),
    scale: 1,
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
  height: 100%;
  pointer-events: none;
  stroke: var(--color-grey-400);
  stroke-opacity: 1;
  width: 100%;
}
</style>
