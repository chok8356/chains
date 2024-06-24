<template>
  <svg
    :class="$style.root"
    height="100%"
    width="100%">
    <g>
      <path
        :d="getPath(line)"
        :key="lineId"
        v-for="(line, lineId) in lines"
        v-memo="[line.x1, line.y1, line.x2, line.y2]" />
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

const getPath = (line: Line) => {
  const dist =
    Math.sqrt(
      (line.x2 - line.x1) * (line.x2 - line.x1) + (line.y2 - line.y1) * (line.y2 - line.y1),
    ) * 0.25
  return `M ${line.x1}, ${line.y1} C ${line.x1}, ${line.y1 + dist}, ${line.x2}, ${line.y2 - dist}, ${line.x2}, ${line.y2}`
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
  will-change: contents;
  z-index: 0;
}
</style>
