import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'

// Adapted from https://github.com/vueuse/vueuse/blob/main/vitest.config.ts
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@@': fileURLToPath(new URL('.', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
    },
    dedupe: ['vue', '@vue/runtime-core'],
  },
  test: {
    clearMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['tests/**/*.{test,spec}.ts', 'app/**/*.{test,spec}.ts'],
          exclude: [...configDefaults.exclude, '**/*.browser.{test,spec}.ts'],
          setupFiles: ['./tests/setup.ts'],
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
          },
        },
        test: {
          name: 'browser',
          include: ['tests/**/*.browser.{test,spec}.ts', 'app/**/*.browser.{test,spec}.ts'],
          setupFiles: ['vitest-browser-vue'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              contextOptions: {
                locale: 'en-US',
                timezoneId: 'UTC',
              },
            }),
            instances: [
              { browser: 'chromium' },
              { browser: 'webkit' },
            ],
          },
        },
      },
    ],
  },
})
