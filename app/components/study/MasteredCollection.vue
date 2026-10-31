<script setup lang="ts">
import type { StudyMode } from '../../types/study'
import { studyDecks } from '../../data/decks'

const props = defineProps<{ mode: StudyMode, mastered: string[] }>()
const emit = defineEmits<{ restore: [id: string] }>()
const cards = computed(() => studyDecks.filter(deck => deck.mode === props.mode).flatMap(deck => deck.cards.filter(card => props.mastered.includes(card.id)).map(card => ({ ...card, deck }))))
</script>

<template>
  <details class="study-panel">
    <summary>{{ $t('study.collection') }} <span class="collection-count">{{ mastered.length }}</span></summary>
    <p class="panel-note collection-intro">{{ $t('study.collectionHint') }}</p>
    <p v-if="!cards.length" class="panel-note">{{ $t('study.collectionEmpty') }}</p>
    <ul v-else class="mastered-list">
      <li v-for="card in cards" :key="card.id">
        <span class="mastered-character" :class="card.deck.fontFamily" :lang="card.deck.language">{{ card.prompt }}</span>
        <span class="mastered-reading">{{ card.reading }}<small>{{ $t(card.deck.labelKey) }}</small></span>
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
.collection-count { float: right; color: var(--ui-primary); }
.collection-intro { margin-block: 1.2rem .8rem; }
.mastered-list { display: grid; gap: .8rem; max-height: 360px; overflow-y: auto; padding: .25rem; }
.mastered-list li { display: flex; align-items: center; gap: .8rem; }
.mastered-character { font-size: 2rem; }
.mastered-reading { flex: 1; font-size: .9rem; }
.mastered-reading small { display: block; font-size: .65rem; color: var(--ui-text-muted); }
</style>
