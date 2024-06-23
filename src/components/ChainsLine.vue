<template>
  <div
    :class="[$style.root]"
    ref="rootEl">
    <svg
      :class="[$style.svg]"
      ref="svgEl">
      <path
        d=""
        ref="pathEl" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import type { Line } from './types'

// bending
const COEFFICIENT = 0.25

const props = withDefaults(
  defineProps<{
    line: Line
  }>(),
  {
    line: () => ({
      from: {
        x: 0,
        y: 0,
      },
      id: '',
      to: {
        x: 0,
        y: 0,
      },
    }),
  },
)

const rootEl = ref<HTMLDivElement | null>(null)
const svgEl = ref<null | SVGElement>(null)
const pathEl = ref<null | SVGPathElement>(null)

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

const rafId = ref<null | number>(null)

watch(
  () => props.line,
  () => {
    if (rafId.value) {
      cancelAnimationFrame(rafId.value)
    }
    rafId.value = requestAnimationFrame(() => {
      if (rootEl.value && svgEl.value && pathEl.value) {
        const { from, to } = props.line
        const width = Math.abs(to.x - from.x)
        const height = Math.abs(to.y - from.y)

        const x = Math.min(from.x, to.x)
        const y = Math.min(from.y, to.y)

        rootEl.value.style.width = `${Math.max(width, 1)}px`
        rootEl.value.style.height = `${Math.max(height, 1)}px`
        rootEl.value.style.transform = `translate3d(${x}px, ${y}px, 0)`

        pathEl.value.setAttribute(
          'd',
          getPathData({
            from: {
              x: from.x - x,
              y: from.y - y,
            },
            to: {
              x: to.x - x,
              y: to.y - y,
            },
          }),
        )
      }
    })
  },
  { deep: true, immediate: true },
)
</script>

<style module>
.root {
  display: flex;
  height: auto;
  left: 0;
  overflow: visible;
  pointer-events: none;
  position: absolute;
  top: 0;
  transform: translateZ(0);
  transform-origin: top left;
  user-select: none;
  width: auto;
  will-change: transform;
  z-index: 0;
}

.svg {
  fill: none;
  height: 100%;
  left: 0;
  overflow: visible;
  position: absolute;
  stroke: var(--color-grey-400);
  stroke-opacity: 1;
  stroke-width: 1;
  top: 0;
  transform: translateZ(0);
  transform-origin: top left;
  width: 100%;
  z-index: 0;
}
</style>
