<script setup lang="ts">
import type { StudyMode, StudySettings } from '../../types/study'

defineProps<{ settings: StudySettings, mode: StudyMode }>()
const emit = defineEmits<{ change: [settings: Partial<StudySettings>] }>()
</script>

<template>
  <details class="rounded-[1rem] border border-default bg-card p-5">
    <summary class="cursor-pointer text-sm font-medium">{{ $t('study.settings') }}</summary>
    <div class="grid gap-6 pt-6">
      <fieldset v-if="mode === 'ja'" class="flex flex-wrap gap-3">
        <legend class="mb-2.5 text-sm font-semibold">{{ $t('study.scripts') }}</legend>
        <label
          v-for="script in (['hiragana', 'katakana', 'both'] as const)"
          :key="script"
          class="
            inline-flex min-h-8 cursor-pointer items-center gap-1.5
            text-sm
          "
        ><input
          class="size-4 accent-primary"
          type="radio"
          name="script"
          :checked="settings.script === script"
          @change="emit('change', { script })"
        >{{ $t(`study.${script}`) }}</label>
      </fieldset>
      <label
        v-if="mode === 'ja'"
        class="
          inline-flex min-h-8 cursor-pointer items-center gap-1.5
          text-sm
        "
      ><input class="size-4 accent-primary" type="checkbox" :checked="settings.historical" @change="emit('change', { historical: !settings.historical })">{{ $t('study.includeHistorical') }}</label>
      <fieldset class="flex flex-wrap gap-3">
        <legend class="mb-2.5 text-sm font-semibold">{{ $t('study.dailyGoal') }}</legend>
        <label
          v-for="goal in ([5, 10, 20] as const)"
          :key="goal"
          class="
            inline-flex min-h-8 cursor-pointer items-center gap-1.5
            text-sm
          "
        ><input
          class="size-4 accent-primary"
          type="radio"
          name="goal"
          :checked="settings.goal === goal"
          @change="emit('change', { goal })"
        >{{ $t('study.goalOption', { count: goal }) }}</label>
      </fieldset>
      <fieldset class="flex flex-wrap gap-3">
        <legend class="mb-2.5 text-sm font-semibold">{{ $t('study.readingDisplay') }}</legend>
        <label
          v-for="reading in (['visible', 'reveal'] as const)"
          :key="reading"
          class="
            inline-flex min-h-8 cursor-pointer items-center gap-1.5
            text-sm
          "
        ><input
          class="size-4 accent-primary"
          type="radio"
          name="reading"
          :checked="settings.reading === reading"
          @change="emit('change', { reading })"
        >{{ $t(`study.readingOption.${reading}`) }}</label>
      </fieldset>
      <p class="text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.settingsHint') }}</p>
    </div>
  </details>
</template>

<style scoped>
</style>
