<script setup lang="ts">
import type { StudyMode } from '../types/study'
import { pronunciationByCard } from '../data/audio'
import { studyDecks } from '../data/decks'

const { play, stop, loading, playing, error } = usePronunciationAudio()
const selectedId = shallowRef<string>()
const mode = shallowRef<StudyMode>('ja')
const kanaRows = [
  { id: 'vowels', readings: ['a', 'i', 'u', 'e', 'o'] },
  { id: 'k', readings: ['ka', 'ki', 'ku', 'ke', 'ko'] },
  { id: 's', readings: ['sa', 'shi', 'su', 'se', 'so'] },
  { id: 't', readings: ['ta', 'chi', 'tsu', 'te', 'to'] },
  { id: 'n', readings: ['na', 'ni', 'nu', 'ne', 'no'] },
  { id: 'h', readings: ['ha', 'hi', 'fu', 'he', 'ho'] },
  { id: 'm', readings: ['ma', 'mi', 'mu', 'me', 'mo'] },
  { id: 'y', readings: ['ya', 'yu', 'yo'] },
  { id: 'r', readings: ['ra', 'ri', 'ru', 're', 'ro'] },
  { id: 'w', readings: ['wa', 'wi', 'we', 'wo'] },
  { id: 'nasal', readings: ['n'] },
]
const groupedDecks = studyDecks.map(deck => ({
  ...deck,
  groups: deck.mode === 'ja'
    ? kanaRows.map(row => ({ id: row.id, cards: row.readings.flatMap(reading => deck.cards.filter(card => card.reading === reading)) }))
    : [{ id: 'zhuyin', cards: deck.cards }],
}))
const visibleDecks = computed(() => groupedDecks.filter(deck => deck.mode === mode.value))

watch(mode, () => {
  stop()
  selectedId.value = undefined
})
</script>

<template>
  <div class="space-y-10 py-8 sm:py-12">
    <header class="space-y-3">
      <h1 class="text-3xl font-semibold text-highlighted">{{ $t('audioTest.title') }}</h1>
      <p class="text-sm text-muted">{{ $t('audioTest.description') }}</p>
    </header>
    <ModeSelector :mode="mode" @change="mode = $event" />
    <section v-for="deck in visibleDecks" :key="deck.id" class="space-y-4" :aria-labelledby="`heading-${deck.id}`">
      <h2 :id="`heading-${deck.id}`" class="text-xl font-medium text-highlighted">{{ $t(deck.labelKey) }} <span class="text-sm text-muted">({{ deck.cards.length }})</span></h2>
      <div v-for="group in deck.groups" :key="group.id" class="space-y-3" :data-kana-row="deck.mode === 'ja' ? group.id : undefined">
        <h3 v-if="deck.mode === 'ja'" class="text-sm font-medium text-muted">{{ $t(`audioTest.rows.${group.id}`) }}</h3>
        <ul class="grid gap-3" :class="deck.mode === 'ja' ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-[repeat(auto-fill,minmax(8rem,1fr))]'">
          <li v-for="card in group.cards" :key="card.id" :data-card-id="card.id">
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
      </div>
    </section>
  </div>
</template>

<style scoped>
</style>
