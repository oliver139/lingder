<script setup lang="ts">
import type { StudyMode } from '../../types/study'
import { studyDecks } from '../../data/decks'

const props = defineProps<{ mode: StudyMode, mastered: string[] }>()
const emit = defineEmits<{ restore: [id: string] }>()
const cards = computed(() => studyDecks.filter(deck => deck.mode === props.mode).flatMap(deck => deck.cards.filter(card => props.mastered.includes(card.id)).map(card => ({ ...card, deck }))))
</script>

<template>
  <details class="rounded-[1rem] border border-default bg-card p-5">
    <summary class="cursor-pointer text-sm font-medium">{{ $t('study.collection') }} <span class="float-right text-primary">{{ mastered.length }}</span></summary>
    <p class="mt-5 mb-3 text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.collectionHint') }}</p>
    <p v-if="!cards.length" class="text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.collectionEmpty') }}</p>
    <ul v-else class="grid max-h-90 gap-3 overflow-y-auto p-1">
      <li v-for="card in cards" :key="card.id" class="flex items-center gap-3">
        <span class="text-[2rem]" :class="card.deck.fontFamily === 'kana' ? 'font-kana' : 'font-zhuyin'" :lang="card.deck.language">{{ card.prompt }}</span>
        <span class="flex-1 text-sm">{{ card.reading }}<small class="block text-[0.65rem] text-muted">{{ $t(card.deck.labelKey) }}</small></span>
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :aria-label="$t('study.restoreLabel', { prompt: card.prompt, script: $t(card.deck.labelKey) })"
          @click="emit('restore', card.id)"
        >
          {{ $t('study.restore') }}
        </UButton>
      </li>
    </ul>
  </details>
</template>

<style scoped>
</style>
