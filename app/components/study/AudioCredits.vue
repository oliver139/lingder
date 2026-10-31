<script setup lang="ts">
import { pronunciationGroups } from '../../data/audio'
</script>

<template>
  <UModal :title="$t('study.audio.credits')" :description="$t('study.audio.creditsDescription')" :ui="{ content: 'max-w-2xl', body: 'max-h-[65dvh] overflow-y-auto' }">
    <UButton color="neutral" variant="link" class="p-0 text-[0.65rem]" :label="$t('study.audio.credits')" />
    <template #body>
      <div class="space-y-6">
        <section v-for="group in pronunciationGroups" :key="group.mode" class="space-y-3">
          <h3 class="font-semibold text-highlighted">{{ $t(`study.modeName.${group.mode}`) }}</h3>
          <p v-if="group.mode === 'tw'" class="text-sm">2017 © 教育部，國語注音符號手冊-開放部件。<br>此素材依「創用CC 姓名標示 4.0 國際版本」授權條款進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。</p>
          <p v-if="group.mode === 'ja'" class="text-sm">{{ $t('study.audio.japaneseCredit') }}</p>
          <p class="text-sm text-muted">{{ $t(group.mode === 'ja' ? 'study.audio.japaneseProcessing' : 'study.audio.processing') }}</p>
          <details class="rounded-lg border border-default">
            <summary class="cursor-pointer p-3 text-sm font-medium">{{ $t('study.audio.recordings', { count: group.recordings.length }) }}</summary>
            <ul class="divide-y divide-default px-3">
              <li v-for="recording in group.recordings" :key="recording.id" class="space-y-1 py-3 text-sm">
                <p><span class="mr-2 font-serif text-xl">{{ recording.label }}</span>{{ recording.author }}</p>
                <p class="flex flex-wrap gap-4">
                  <a :href="recording.sourceUrl" class="text-primary underline" target="_blank" rel="noopener noreferrer">{{ $t('study.audio.source') }}</a>
                  <a :href="recording.licenseUrl" class="text-primary underline" target="_blank" rel="noopener noreferrer">{{ recording.license }}</a>
                </p>
              </li>
            </ul>
          </details>
        </section>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
</style>
