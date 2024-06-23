<template>
  <svg
    :class="$style.root"
    height="100%"
    width="100%">
    <g>
      <path
        :d="getPathData(line)"
        :key="line.id"
        v-for="line in lines"
        v-memo="[line.id, line.from.x, line.from.y, line.to.x, line.to.y]" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { Lines } from './types'

// bending
const COEFFICIENT = 0.25

withDefaults(
  defineProps<{
    lines: Lines
  }>(),
  {
    lines: () => ({}),
  },
)

const getPathData = ({
  from,
  to,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
}) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  const control1 = { x: from.x, y: from.y + distance * COEFFICIENT }
  const control2 = { x: to.x, y: to.y - distance * COEFFICIENT }
  return `M ${from.x},${from.y} C ${control1.x},${control1.y} ${control2.x},${control2.y} ${to.x},${to.y}`
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
