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
  <div class="card-stack">
    <div class="stack-back stack-back-far" aria-hidden="true" />
    <div class="stack-back" aria-hidden="true" />
    <div
      ref="surface"
      class="study-card"
      :class="{ dragging }"
      :style="{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 25}deg)` }"
      role="button"
      tabindex="0"
      :aria-label="$t('study.cardLabel', { script: $t(deck.labelKey), prompt: card.prompt })"
      aria-describedby="card-help"
      @keydown="keydown"
      @click="!moved && (revealed = true)"
    >
      <div class="card-topline">
        <span>{{ $t(deck.labelKey) }}</span>
        <span v-if="card.historical" class="historical-badge">{{ $t('study.historicalBadge') }}</span>
        <span v-else aria-hidden="true">✦</span>
      </div>
      <span class="card-character" :class="deck.fontFamily" :lang="deck.language">{{ card.prompt }}</span>
      <span v-if="showReading" class="card-reading" lang="en">{{ card.reading }}</span>
      <span v-else class="card-reveal">{{ $t('study.tapReveal') }}</span>
      <span class="card-footnote">{{ $t(showReading ? 'study.takeYourTime' : 'study.revealHint') }}</span>
    </div>
  </div>
</template>

<style scoped>
.card-stack { position: relative; width: min(100%, 25rem); margin-inline: auto; }
.stack-back { position: absolute; inset: 0; border: 1px solid var(--ui-border-accented); border-radius: 1.75rem; background: var(--study-stack); transform: rotate(4deg) translateY(7px); }
.stack-back-far { transform: rotate(-4deg) translateY(10px); opacity: .6; }
.study-card { position: relative; display: flex; min-height: 340px; padding: 1.6rem; flex-direction: column; align-items: center; border: 1px solid var(--ui-border-accented); border-radius: 1.75rem; background: var(--study-card); box-shadow: 0 16px 48px -24px var(--study-shadow); cursor: grab; touch-action: none; user-select: none; transition: transform 180ms ease-out; }
.dragging { cursor: grabbing; transition: none; }
.card-topline { display: flex; justify-content: space-between; width: 100%; font-size: .75rem; letter-spacing: .06em; color: var(--ui-text-muted); }
.historical-badge { color: var(--ui-primary); }
.card-character { display: block; font-size: clamp(5rem, 20vw, 7rem); line-height: 1.7; }
.card-reading { font-size: 1.6rem; }
.card-reveal { margin-block: .4rem; color: var(--ui-primary); font-size: 1rem; }
.card-footnote { margin-top: auto; padding-top: 1rem; color: var(--ui-text-muted); font-size: .7rem; }
@media (max-width: 480px) { .study-card { min-height: 300px; } }
@media (prefers-reduced-motion: reduce) { .study-card { transition: none; } }
</style>
