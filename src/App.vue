<template>
  <div :class="$style.root">
    <div :class="$style.controls">
      <span
        :class="$style.icon"
        @click="changeTheme">
        <IconEclipseAlt />
      </span>
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
    <div :class="$style.scene">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import IconEclipseAlt from '@/components/icons/IconEclipseAlt.vue'
import { useTheme } from '@/use/use-theme'

const { changeTheme } = useTheme()
</script>

<style module>
.root {
  background-color: var(--color-background-200);
  display: grid;
  height: 100%;
  outline: none;
  position: relative;
  user-select: none;
  width: 100%;
}

.controls {
  color: var(--color-text-100);
  display: flex;
  flex-direction: column;
  gap: 12px;
  left: 12px;
  position: absolute;
  top: 12px;
  z-index: 10;
}

.icon {
  align-items: center;
  cursor: pointer;
  display: inline-flex;
  font-size: 24px;
  text-transform: uppercase;

  &:hover {
    color: var(--color-primary-400);
  }
}

.link {
  color: var(--color-text-100);
  font-size: 16px;
  text-decoration: none;

  &:hover {
    color: var(--color-primary-400);
  }
}

.scene {
  height: 100%;
  width: 100%;
}
</style>
