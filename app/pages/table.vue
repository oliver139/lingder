<script setup lang="ts">
import { pronunciationByCard } from '../data/audio'
import { studyDecks } from '../data/decks'

const { play, loading, playing, error } = usePronunciationAudio()
const selectedId = shallowRef<string>()
</script>

<template>
  <div class="space-y-10 py-8 sm:py-12">
    <header class="space-y-3">
      <h1 class="text-3xl font-semibold text-highlighted">{{ $t('audioTest.title') }}</h1>
      <p class="text-sm text-muted">{{ $t('audioTest.description') }}</p>
    </header>
    <section v-for="deck in studyDecks" :key="deck.id" class="space-y-4" :aria-labelledby="`heading-${deck.id}`">
      <h2 :id="`heading-${deck.id}`" class="text-xl font-medium text-highlighted">{{ $t(deck.labelKey) }} <span class="text-sm text-muted">({{ deck.cards.length }})</span></h2>
      <ul class="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
        <li v-for="card in deck.cards" :key="card.id" :data-card-id="card.id">
          <UButton
            class="
              flex size-full cursor-pointer flex-col gap-2
              rounded-md border border-default p-3 text-center
            "
            :class="selectedId === card.id && (loading || playing) ? 'bg-primary/10' : 'bg-card'"
            variant="ghost"
            trailing
            :icon="selectedId === card.id && loading ? 'i-lucide-loader-circle' : selectedId === card.id && playing ? 'i-lucide-audio-lines' : 'i-lucide-volume-2'"
            :ui="{ trailingIcon: selectedId === card.id && loading ? 'mt-auto animate-spin motion-reduce:animate-none' : 'mt-auto' }"
            :aria-label="$t('audioTest.play', { script: $t(deck.labelKey), character: card.prompt })"
            :aria-busy="selectedId === card.id && loading"
            @click="selectedId = card.id; play(pronunciationByCard[card.id]!.src)"
          >
            <span class="text-4xl/relaxed font-normal text-highlighted" :class="deck.fontFamily === 'kana' ? 'font-kana' : 'font-zhuyin'" :lang="deck.language">{{ card.prompt }}</span>
            <span class="text-sm font-normal text-muted">{{ card.reading }}</span>
            <span v-if="card.historical" class="text-xs font-normal text-muted">{{ $t('study.historicalBadge') }}</span>
            <span v-if="selectedId === card.id && error" class="text-xs text-error" role="alert">{{ $t('study.audio.error') }}</span>
          </UButton>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
</style>
