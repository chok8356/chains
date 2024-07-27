<template>
  <svg :class="$style.root">
    <pattern
      :height="gridSize"
      :patternTransform="`translate(-${dotSize},-${dotSize})`"
      :width="gridSize"
      :x="scene.center.x"
      :y="scene.center.y"
      id="dots-pattern"
      patternUnits="userSpaceOnUse">
      <circle
        :cx="dotSize"
        :cy="dotSize"
        :r="dotSize / 2"></circle>
    </pattern>
    <rect
      fill="url(#dots-pattern)"
      height="100%"
      width="100%"
      x="0"
      y="0"></rect>
  </svg>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  scene: {
    center: {
      x: number
      y: number
    }
    scale: number
  }
}>()

const gridSize = computed(() => {
  return 40 * props.scene.scale
})

const dotSize = computed(() => {
  return 2 * props.scene.scale
})
</script>

<style module>
.root {
  fill: none;
  height: 100%;
  pointer-events: none;
  width: 100%;

  circle {
    fill: var(--color-background-500);
    stroke: none;
  }
}
</style>
