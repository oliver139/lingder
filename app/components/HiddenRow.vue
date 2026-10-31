<script setup lang="ts">
import type { Arrayable } from '@vueuse/core'

defineProps<{
  show: boolean
  contentClass?: Arrayable<string | Record<string, string>>
}>()
</script>

<template>
  <div
    class="grid overflow-hidden transition-[opacity,visibility,grid-template-rows] motion-reduce:transition-none"
    :class="show ? 'visible grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'"
    :inert="!show"
  >
    <div class="overflow-hidden">
      <div :class="contentClass">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
