<script setup lang="ts">
import type { StudyMode } from '../../types/study'

defineProps<{ mode: StudyMode }>()
const emit = defineEmits<{ change: [mode: StudyMode] }>()
</script>

<template>
  <div
    class="
      mx-auto flex w-fit gap-1 rounded-[1rem]
      border border-default bg-muted p-1
    "
    role="group"
    :aria-label="$t('study.mode')"
  >
    <button
      v-for="value in (['ja', 'tw'] as const)"
      :key="value"
      type="button"
      class="
        flex cursor-pointer items-center gap-2 rounded-[0.7rem]
        px-4 py-3 text-sm text-muted
        aria-pressed:bg-card aria-pressed:text-highlighted aria-pressed:shadow-sm
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
