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
      borderColor: selected ? settings.color : 'transparent',
      boxShadow: dragging ? `0px 21px 28px ${boxShadowColor}` : '',
    }"
    ref="rootEl">
    <div
      :class="$style.header"
      :style="{ backgroundColor: settings.color }">
      <div :class="$style.icon" />
      <span :class="$style.text">
        {{ settings.text }}
      </span>
      <div :class="[$style.icon, $style.iconEdit]" />
    </div>
    <div :class="$style.content">
      <slot>
        <pre>
            <code>
              {{ block.coords }}
            </code>
        </pre>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { colord } from 'colord'
import { computed, ref } from 'vue'

import { type Block, getBlockSettings } from './types'

const props = withDefaults(
  defineProps<{
    block: Block
    dragging: boolean
    selected: boolean
  }>(),
  {
    block: () => ({
      coords: {
        x: 0,
        y: 0,
      },
      id: -1,
      parentId: null,
      type: 'StatusActionHandler',
    }),
    dragging: false,
    selected: false,
  },
)

const rootEl = ref<HTMLDivElement | null>(null)

const settings = getBlockSettings(props.block)

const boxShadowColor = computed(() => {
  return colord(settings.color).alpha(0.2).toRgbString()
})

defineExpose({
  rootEl,
})
</script>

<style module>
.root {
  background-color: var(--color-white);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 4px 8px transparent;
  cursor: grab;
  height: auto;
  min-height: 98px;
  overflow: hidden;
  padding: 4px;
  position: absolute;
  transition:
    box-shadow 200ms,
    border-color 200ms;
  user-select: none;
  width: 168px;
  z-index: 1;

  .iconEdit {
    cursor: pointer;
    display: none;
  }

  &:hover {
    .iconEdit {
      display: block;
    }
  }
}

.dragging {
  cursor: grabbing;
  z-index: 3;
}

.selected {
  z-index: 2;
}

.header {
  align-items: center;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  height: 28px;
  padding: 8px;
  width: 100%;

  .icon {
    color: var(--color-white);
    font-size: 16px;
  }

  .text {
    color: var(--color-white);
    display: block;
    flex-grow: 1;
    font-size: 12px;
    line-height: 16px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.content {
  display: block;
  height: auto;
  max-height: calc(100% - 28px);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>
