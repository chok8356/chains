<template>
  <svg
    :class="$style.root"
    :stroke-width="gridStrokeWidth"
    height="100%"
    width="100%"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern
        :height="gridSize"
        :width="gridSize"
        id="diagonalHatch"
        patternTransform="rotate(90)"
        patternUnits="userSpaceOnUse">
        <line
          :y2="gridSize"
          x1="0"
          x2="0"
          y1="0" />
      </pattern>
      <pattern
        :height="gridSize"
        :width="gridSize"
        id="diagonalHatch2"
        patternTransform="rotate(0)"
        patternUnits="userSpaceOnUse">
        <line
          :y2="gridSize"
          x1="0"
          x2="0"
          y1="0" />
      </pattern>
    </defs>
    <rect
      fill="url(#diagonalHatch)"
      height="100%"
      width="100%" />
    <rect
      fill="url(#diagonalHatch2)"
      height="100%"
      width="100%" />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    scale?: number
    size?: number
  }>(),
  {
    scale: 1,
    size: 15,
  },
)

const gridSize = computed(() => {
  return props.size * props.scale
})

const gridStrokeWidth = computed(() => {
  return 0.5 * props.scale
})
</script>

<style module>
.root {
  fill: none;
  height: calc(100% + 2px);
  left: -1px;
  pointer-events: none;
  position: absolute;
  stroke: var(--color-grey-400);
  stroke-opacity: 1;
  top: -1px;
  width: calc(100% + 2px);
}
</style>
