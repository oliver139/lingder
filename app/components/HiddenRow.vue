<script setup lang="ts">
import type { Arrayable } from '@vueuse/core'

defineProps<{
  show: boolean
  contentClass?: Arrayable<string | Record<string, string>>
}>()
</script>

<template>
  <div
    class="hidden-row"
    :class="{ show }"
    :inert="!show"
  >
    <div class="inner-container">
      <div class="inner-wrapper" :class="contentClass">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.hidden-row {
  @apply grid grid-rows-[0fr];
  @apply opacity-0 invisible;
  @apply overflow-hidden;
  @apply transition-[opacity,visibility,grid-template-rows] motion-reduce:transition-none;
}
.hidden-row.show {
  @apply grid-rows-[1fr];
  @apply opacity-100 visible;
}
.inner-container {
  @apply overflow-hidden;
}
</style>
