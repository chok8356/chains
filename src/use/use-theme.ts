import { onMounted, ref, watch } from 'vue'

type Theme = 'auto' | 'dark'

const PREFIX = 'vue3-flowchart@'

function getPrefix(key: string) {
  return PREFIX + key
}

export function useTheme() {
  const theme = ref<Theme>('auto')

  function changeTheme() {
    theme.value = theme.value === 'dark' ? 'auto' : 'dark'
  }

  function setThemeAttribute() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  function removeThemeAttribute() {
    document.documentElement.removeAttribute('data-theme')
  }

  function toggleThemeAttribute(value: boolean) {
    if (value) {
      setThemeAttribute()
    }
    else {
      removeThemeAttribute()
    }
  }

  onMounted(() => {
    theme.value = (localStorage.getItem(getPrefix('theme')) as Theme) || 'auto'
    toggleThemeAttribute(window?.matchMedia?.('(prefers-color-scheme: dark)').matches)
  })

  watch(
    () => theme.value,
    () => {
      localStorage.setItem(getPrefix('theme'), theme.value)
      toggleThemeAttribute(theme.value !== 'auto')
    },
  )

  return {
    changeTheme,
    theme,
  }
}
