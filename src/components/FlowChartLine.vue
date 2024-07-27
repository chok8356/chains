<template>
  <svg
    :class="$style.root"
    height="100%"
    width="100%">
    <g>
      <path :d="d" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Line } from './types'

const props = defineProps<{
  line: Line
}>()

const d = computed(() => {
  const { end, start } = props.line
  const dist =
    Math.sqrt((end.x - start.x) * (end.x - start.x) + (end.y - start.y) * (end.y - start.y)) * 0.25
  return `M ${start.x}, ${start.y} C ${start.x}, ${start.y + dist}, ${end.x}, ${end.y - dist}, ${end.x}, ${end.y}`
})
</script>

<style module>
.root {
  fill: none;
  height: auto;
  left: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  stroke: var(--color-background-400);
  stroke-opacity: 1;
  stroke-width: 1;
  top: 0;
  transform-origin: top left;
  width: auto;
  will-change: contents;
  z-index: 0;
}
</style>
