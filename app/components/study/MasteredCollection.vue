<script setup lang="ts">
import type { StudyMode } from '../../types/study'
import { studyDecks } from '../../data/decks'

const props = defineProps<{ mode: StudyMode, mastered: string[] }>()
const emit = defineEmits<{ restore: [id: string] }>()
const cards = computed(() => studyDecks.filter(deck => deck.mode === props.mode).flatMap(deck => deck.cards.filter(card => props.mastered.includes(card.id)).map(card => ({ ...card, deck }))))
</script>

<template>
  <details class="rounded-[1rem] border border-default bg-card">
    <summary
      class="
        min-h-14 cursor-pointer rounded-[1rem] p-5 text-sm
        font-medium
      "
    >
      {{ $t('study.collection') }} <span class="float-right text-primary">{{ mastered.length }}</span>
    </summary>
    <div class="px-5 pb-5">
      <p class="mb-3 text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.collectionHint') }}</p>
      <p v-if="!cards.length" class="text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.collectionEmpty') }}</p>
      <ul
        v-else
        class="
          grid max-h-90 scrollbar-none grid-cols-[repeat(auto-fill,minmax(min(100%,5rem),1fr))] gap-2
          overflow-y-auto p-1
          [&::-webkit-scrollbar]:hidden
        "
      >
        <li
          v-for="card in cards"
          :key="card.id"
          class="
            flex min-w-0 flex-col items-center gap-1
            rounded-lg border border-default p-2 text-center
          "
        >
          <span class="text-[2rem] leading-tight" :class="card.deck.fontFamily === 'kana' ? 'font-kana' : 'font-zhuyin'" :lang="card.deck.language">{{ card.prompt }}</span>
          <span class="flex-1 text-sm wrap-break-word">{{ card.reading }}<small class="block text-[0.65rem] text-muted">{{ $t(card.deck.labelKey) }}</small></span>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            class="mt-1 min-h-9 w-full justify-center"
            :aria-label="$t('study.restoreLabel', { prompt: card.prompt, script: $t(card.deck.labelKey) })"
            @click="emit('restore', card.id)"
          >
            {{ $t('study.restore') }}
          </UButton>
        </li>
      </ul>
    </div>
  </details>
</template>

<style scoped>
</style>
