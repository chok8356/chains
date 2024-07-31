<template>
  <div :class="$style.root">
    <div :class="$style.routers">
      <RouterLink
        :class="$style.link"
        :to="{ name: 'Base' }">
        Base
      </RouterLink>
      <RouterLink
        :class="$style.link"
        :to="{ name: 'Stress' }">
        Stress
      </RouterLink>
    </div>

    <div :class="$style.controls">
      <div
        :class="$style.iconWrapper"
        @click="changeTheme">
        <IconSunFill
          :class="$style.icon"
          v-if="theme === 'dark'" />
        <IconMoonClearFill
          :class="$style.icon"
          v-else />
      </div>

      <div
        :class="$style.iconWrapper">
        <IconQuestionLine
          :class="$style.icon"
          @mouseenter="showHint = true"
          @mouseleave="showHint = false" />
        <div
          :class="$style.hint"
          v-if="showHint">
          <span>
            <b>CTRL + LMB</b>  on Node: Select multiple nodes
          </span>
          <span>
            <b>CTRL + LMB</b>  on Scene: Drag-Select nodes
          </span>
        </div>
      </div>
    </div>
    <div :class="$style.scene">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/use/use-theme'
import IconMoonClearFill from '@/components/icons/IconMoon.vue'
import IconSunFill from '@/components/icons/IconSun.vue'
import IconQuestionLine from '@/components/icons/IconQuestion.vue'

const { changeTheme, theme } = useTheme()

const showHint = ref(false)
</script>

<style module>
.root {
  background-color: var(--color-background-10);
  display: grid;
  height: 100%;
  outline: none;
  position: relative;
  user-select: none;
  width: 100%;
}

.routers {
  color: var(--color-text);
  display: flex;
  gap: 16px;
  left: 12px;
  position: absolute;
  top: 12px;
  z-index: 10;
}

.controls {
  color: var(--color-text);
  display: flex;
  gap: 16px;
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 10;
}

.iconWrapper {
  position: relative;
}

.icon {
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  font-size: 24px;
  position: relative;

  &:hover {
    color: var(--color-primary);
  }
}

.hint {
  background-color: var(--color-background-0);
  border-radius: 12px;
  bottom: 0;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  gap: 8px;
  left: 0;
  padding: 12px;
  position: absolute;
  transform: translate(-100%, 100%);
  width: auto;

  span {
    white-space: nowrap;
  }
}

.link {
  color: var(--color-text);
  font-size: 16px;
  text-decoration: none;

  &:hover {
    color: var(--color-primary);
  }
}

.scene {
  height: 100%;
  width: 100%;
}
</style>
