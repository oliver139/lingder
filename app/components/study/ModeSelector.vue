<script setup lang="ts">
import type { StudyMode } from '../../types/study'

defineProps<{ mode: StudyMode }>()
const emit = defineEmits<{ change: [mode: StudyMode] }>()
</script>

<template>
  <div class="mode-selector" role="group" :aria-label="$t('study.mode')">
    <button
      v-for="value in (['ja', 'tw'] as const)"
      :key="value"
      type="button"
      :class="{ selected: mode === value }"
      :aria-pressed="mode === value"
      @click="emit('change', value)"
    >
      <span class="mode-glyph" :lang="value === 'ja' ? 'ja' : 'zh-Hant-TW'">{{ value === 'ja' ? 'あ' : 'ㄅ' }}</span>
      {{ $t(`study.modeName.${value}`) }}
    </button>
  </div>
</template>

<style scoped>
.mode-selector { display: flex; gap: .3rem; width: fit-content; margin-inline: auto; border: 1px solid var(--ui-border); padding: .3rem; border-radius: 1rem; background: var(--ui-bg-muted); }
.mode-selector button { display: flex; gap: .5rem; align-items: center; padding: .7rem 1.1rem; border-radius: .7rem; font-size: .85rem; cursor: pointer; color: var(--ui-text-muted); }
.mode-selector button.selected { background: var(--study-card); color: var(--ui-text-highlighted); box-shadow: 0 2px 8px -4px var(--study-shadow); }
.mode-glyph { font-size: 1.2rem; }
</style>
