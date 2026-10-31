<script setup lang="ts">
import type { StudyMode, StudySettings } from '../../types/study'

defineProps<{ settings: StudySettings, mode: StudyMode }>()
const emit = defineEmits<{ change: [settings: Partial<StudySettings>] }>()
</script>

<template>
  <details class="study-panel">
    <summary>{{ $t('study.settings') }}</summary>
    <div class="settings-body">
      <fieldset v-if="mode === 'ja'">
        <legend>{{ $t('study.scripts') }}</legend>
        <label v-for="script in (['hiragana', 'katakana', 'both'] as const)" :key="script"><input type="radio" name="script" :checked="settings.script === script" @change="emit('change', { script })">{{ $t(`study.${script}`) }}</label>
      </fieldset>
      <label v-if="mode === 'ja'" class="historical-setting"><input type="checkbox" :checked="settings.historical" @change="emit('change', { historical: !settings.historical })">{{ $t('study.includeHistorical') }}</label>
      <fieldset>
        <legend>{{ $t('study.dailyGoal') }}</legend>
        <label v-for="goal in ([5, 10, 20] as const)" :key="goal"><input type="radio" name="goal" :checked="settings.goal === goal" @change="emit('change', { goal })">{{ $t('study.goalOption', { count: goal }) }}</label>
      </fieldset>
      <fieldset>
        <legend>{{ $t('study.readingDisplay') }}</legend>
        <label v-for="reading in (['visible', 'reveal'] as const)" :key="reading"><input type="radio" name="reading" :checked="settings.reading === reading" @change="emit('change', { reading })">{{ $t(`study.readingOption.${reading}`) }}</label>
      </fieldset>
      <p class="panel-note">{{ $t('study.settingsHint') }}</p>
    </div>
  </details>
</template>

<style scoped>
.settings-body { display: grid; gap: 1.4rem; padding-top: 1.5rem; }
fieldset { display: flex; gap: .75rem; flex-wrap: wrap; }
legend { margin-bottom: .6rem; font-size: .8rem; font-weight: 600; }
label { display: inline-flex; align-items: center; gap: .4rem; font-size: .8rem; min-height: 32px; cursor: pointer; }
input { accent-color: var(--ui-primary); width: 1rem; height: 1rem; }
</style>
