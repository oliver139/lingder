<script setup lang="ts">
import type { StudyMode } from '../../types/study'

defineProps<{ mode: StudyMode }>()
const emit = defineEmits<{ change: [mode: StudyMode] }>()
</script>

<template>
  <div
    class="
      relative isolate mx-auto grid w-fit
      max-w-full grid-cols-2 rounded-[1rem] border border-default
      bg-muted p-1
    "
    role="group"
    :aria-label="$t('study.mode')"
  >
    <div class="pointer-events-none absolute inset-1 -z-10" aria-hidden="true">
      <div
        class="
          h-full w-1/2 rounded-[0.7rem] bg-primary shadow-sm
          transition-transform duration-250 ease-in-out
          motion-reduce:transition-none
        "
        :class="mode === 'tw' ? 'translate-x-full' : 'translate-x-0'"
      />
    </div>
    <button
      v-for="value in (['ja', 'tw'] as const)"
      :key="value"
      type="button"
      class="
        flex cursor-pointer items-center justify-center gap-2
        rounded-[0.7rem] px-4 py-3 text-sm font-medium
        text-muted transition-colors duration-250
        hover:text-highlighted
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
        aria-pressed:text-inverted
        motion-reduce:transition-none
      "
      :aria-pressed="mode === value"
      @click="emit('change', value)"
    >
      <span class="text-xl" :lang="value === 'ja' ? 'ja' : 'zh-Hant-TW'">{{ value === 'ja' ? 'あ' : 'ㄅ' }}</span>
      {{ $t(`study.modeName.${value}`) }}
    </button>
  </div>
</template>

<style scoped>
</style>
