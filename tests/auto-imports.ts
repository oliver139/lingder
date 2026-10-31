// Standalone tests supply only the Vue/Pinia/VueUse auto-import boundary.
// Nuxt runtime and plugins remain intentionally absent.
import { useEventListener, useIntervalFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { vi } from 'vitest'
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

for (const [name, value] of Object.entries({ defineStore, ref, shallowRef, computed, watch, onMounted, nextTick, useTemplateRef, useEventListener, useIntervalFn })) {
  vi.stubGlobal(name, value)
}
