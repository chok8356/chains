import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  return {
    css: {
      modules: {
        generateScopedName: isProduction ? '[hash:base64:5]' : '[local]--[hash:base64:5]',
        localsConvention: 'camelCaseOnly',
      },
    },
    plugins: [
      vue(),
      vueDevTools({
        launchEditor: 'webstorm',
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
