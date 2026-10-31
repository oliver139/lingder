<script setup lang="ts">
import type { Rating, StudyCard, StudyDeck } from '../../types/study'

const props = defineProps<{
  card: StudyCard
  deck: StudyDeck
  readingDisplay: 'visible' | 'reveal'
}>()
const emit = defineEmits<{ rate: [id: string, rating: Rating] }>()
const surface = useTemplateRef<HTMLElement>('surface')
const revealed = shallowRef(false)
const committed = shallowRef(false)
const showReading = computed(() => props.readingDisplay === 'visible' || revealed.value)

function rate(rating: Rating) {
  if (committed.value) {
    return
  }
  committed.value = true
  emit('rate', props.card.id, rating)
}

const { offset, dragging, moved, cancel } = useCardGesture(surface, rate)

watch(() => props.card.id, () => {
  cancel()
  revealed.value = false
  committed.value = false
})
watch(() => props.readingDisplay, () => {
  revealed.value = false
})

function keydown(event: KeyboardEvent) {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
    return
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(event.key)) {
    event.preventDefault()
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    rate('review')
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    rate('mastered')
  } else if (event.key === ' ' || event.key === 'Enter') {
    revealed.value = true
  }
}
</script>

<template>
  <div class="relative mx-auto w-full max-w-100">
    <div
      class="
        absolute inset-0 transform-[rotate(-4deg)_translateY(10px)] rounded-[1.75rem] border
        border-accented bg-stack opacity-60
      "
      aria-hidden="true"
    />
    <div
      class="
        absolute inset-0 transform-[rotate(4deg)_translateY(7px)] rounded-[1.75rem] border
        border-accented bg-stack
      "
      aria-hidden="true"
    />
    <div
      ref="surface"
      class="
        study-card relative flex min-h-85 touch-none
        flex-col items-center rounded-[1.75rem] border border-accented
        bg-card p-6 shadow-card select-none
        motion-reduce:transition-none
        max-[480px]:min-h-75
      "
      :class="dragging ? 'cursor-grabbing transition-none' : 'cursor-grab transition-transform duration-180 ease-out'"
      :style="{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 25}deg)` }"
      role="button"
      tabindex="0"
      :aria-label="$t('study.cardLabel', { script: $t(deck.labelKey), prompt: card.prompt })"
      aria-describedby="card-help card-reading"
      @keydown="keydown"
      @click="!moved && (revealed = true)"
    >
      <div
        class="
          flex w-full justify-between text-xs tracking-[0.06em]
          text-muted
        "
      >
        <span>{{ $t(deck.labelKey) }}</span>
        <span v-if="card.historical" class="text-primary">{{ $t('study.historicalBadge') }}</span>
        <span v-else aria-hidden="true">✦</span>
      </div>
      <span class="card-character block text-[clamp(5rem,20vw,7rem)] leading-[1.7]" :class="deck.fontFamily === 'kana' ? 'font-kana' : 'font-zhuyin'" :lang="deck.language">{{ card.prompt }}</span>
      <span id="card-reading" :class="showReading ? 'font-serif text-[1.6rem]' : 'my-1.5 text-base text-primary'" lang="en" aria-live="polite">{{ showReading ? card.reading : $t('study.tapReveal') }}</span>
      <span class="mt-auto pt-4 text-[0.7rem] text-muted">{{ $t(showReading ? 'study.takeYourTime' : 'study.revealHint') }}</span>
    </div>
  </div>
</template>

<style scoped>
</style>
