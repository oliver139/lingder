<script setup lang="ts">
import type { Rating, StudyCard, StudyDeck } from '../../types/study'

const props = defineProps<{
  card: StudyCard
  deck: StudyDeck
  upcoming?: (StudyCard & { deck: StudyDeck })[]
  readingDisplay: 'visible' | 'reveal'
}>()
const emit = defineEmits<{ rate: [id: string, rating: Rating], busy: [value: boolean] }>()
const stack = useTemplateRef<HTMLElement>('stack')
const surface = shallowRef<HTMLElement | null>(null)
let animation: Animation | undefined
const revealed = shallowRef(false)
const committed = shallowRef(false)
const cards = computed(() => [{ ...props.card, deck: props.deck }, ...(props.upcoming ?? []).slice(0, 2)].map((card, index) => ({
  ...card,
  showReading: props.readingDisplay === 'visible' || (index === 0 && revealed.value),
})))

const { offset, dragging, moved, cancel } = useCardGesture(surface, rate, () => committed.value)

// Start fading when the center enters the outer 30% of the viewport.
// Resting bounds keep transformed measurements out of the pointer feedback loop.
function opacityAt(x: number, y: number, bounds: DOMRect) {
  const centerX = bounds.left + bounds.width / 2
  const centerY = bounds.top + bounds.height / 2
  const horizontalEdge = x < 0 ? centerX : window.innerWidth - centerX
  const verticalEdge = y < 0 ? centerY : window.innerHeight - centerY
  const horizontalStart = Math.max(0, horizontalEdge - window.innerWidth * 0.3)
  const verticalStart = Math.max(0, verticalEdge - window.innerHeight * 0.3)
  const horizontal = Math.max(0, Math.abs(x) - horizontalStart) / Math.max(1, horizontalEdge + bounds.width / 2 - horizontalStart)
  const vertical = Math.max(0, Math.abs(y) - verticalStart) / Math.max(1, verticalEdge + bounds.height / 2 - verticalStart)
  return Math.max(0, 1 - Math.max(horizontal, vertical))
}

const opacity = computed(() => {
  const { x, y } = offset.value
  if ((!x && !y) || !stack.value) {
    return 1
  }
  return opacityAt(x, y, stack.value.getBoundingClientRect())
})

async function rate(rating: Rating, direction?: { x: number, y: number }) {
  if (committed.value) {
    return
  }
  committed.value = true
  emit('busy', true)
  const id = props.card.id
  const element = surface.value
  if (element?.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const origin = { ...offset.value }
    const vector = direction ?? (Math.hypot(origin.x, origin.y) ? origin : rating === 'review' ? { x: 1, y: 0 } : { x: 0, y: -1 })
    const length = Math.hypot(vector.x, vector.y)
    const bounds = element.getBoundingClientRect()
    const margin = Math.hypot(element.offsetWidth, element.offsetHeight) / 2
    // Continue to the first viewport edge along the swipe, allowing for rotation.
    const horizontal = vector.x === 0 ? Infinity : (vector.x > 0 ? window.innerWidth - bounds.left + margin : bounds.right + margin) * length / Math.abs(vector.x)
    const vertical = vector.y === 0 ? Infinity : (vector.y > 0 ? window.innerHeight - bounds.top + margin : bounds.bottom + margin) * length / Math.abs(vector.y)
    const distance = Math.max(0, Math.min(horizontal, vertical))
    const x = origin.x + vector.x / length * distance
    const y = origin.y + vector.y / length * distance
    const restingBounds = stack.value!.getBoundingClientRect()
    const frames = Array.from({ length: 21 }, (_, index) => {
      const progress = index / 20
      const frameX = origin.x + (x - origin.x) * progress
      const frameY = origin.y + (y - origin.y) * progress
      const rotation = origin.x / 25 + (Math.sign(x) * 24 - origin.x / 25) * progress
      return {
        offset: progress,
        transform: `translate(${frameX}px, ${frameY}px) rotate(${rotation}deg)`,
        opacity: opacityAt(frameX, frameY, restingBounds),
      }
    })
    animation = element.animate(frames, { duration: 360, easing: 'linear', fill: 'forwards' })
    try {
      await animation.finished
    } catch {
      return
    }
  }
  if (props.card.id === id) {
    emit('rate', id, rating)
  }
}

watch(() => props.card.id, async (id) => {
  const hadFocus = stack.value?.contains(document.activeElement)
  animation?.cancel()
  animation = undefined
  cancel()
  revealed.value = false
  await nextTick()
  if (hadFocus) {
    surface.value?.focus()
  }
  const promotions = surface.value?.getAnimations?.() ?? []
  if (promotions.length) {
    await Promise.allSettled(promotions.map(animation => animation.finished))
  }
  if (props.card.id === id) {
    committed.value = false
    emit('busy', false)
  }
})
onBeforeUnmount(() => {
  animation?.cancel()
  emit('busy', false)
})
defineExpose({ rate })

watch(() => props.readingDisplay, () => {
  revealed.value = false
})

function keydown(event: KeyboardEvent) {
  if (committed.value || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
    return
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(event.key)) {
    event.preventDefault()
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    rate('review', { x: event.key === 'ArrowLeft' ? -1 : 1, y: 0 })
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    rate('mastered', { x: 0, y: event.key === 'ArrowUp' ? -1 : 1 })
  } else if (event.key === ' ' || event.key === 'Enter') {
    revealed.value = true
  }
}
</script>

<template>
  <div
    ref="stack"
    class="
      relative isolate z-10 mx-auto w-full
      max-w-[21.09375rem]
    "
  >
    <TransitionGroup
      tag="div"
      class="grid"
      enter-active-class="delay-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      @leave="(_element, done) => done()"
    >
      <div
        v-for="(item, index) in cards"
        :key="item.id"
        :ref="element => {
          if (index === 0) surface = element as HTMLElement | null
        }"
        :data-card-id="item.id"
        class="
          relative col-start-1 row-start-1 flex aspect-3/4
          w-full touch-none flex-col items-center rounded-[1.75rem]
          border border-accented bg-card p-6 shadow-card
          select-none
          motion-reduce:transition-none
        "
        :class="[index === 0 ? 'study-card' : 'pointer-events-none', dragging && index === 0 ? 'cursor-grabbing transition-none' : 'cursor-grab transition-[transform,opacity] duration-240 ease-out']"
        :style="{ opacity: index === 0 ? opacity : 1, zIndex: cards.length - index, transform: index === 0 ? `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 25}deg)` : `translateY(${index * 10}px) rotate(${index === 1 ? 4 : -4}deg) scale(${1 - index * 0.025})` }"
        :role="index === 0 ? 'button' : undefined"
        :tabindex="index === 0 ? 0 : -1"
        :inert="index !== 0"
        :aria-hidden="index !== 0 || undefined"
        :aria-disabled="index === 0 ? committed : undefined"
        :aria-label="$t('study.cardLabel', { script: $t(item.deck.labelKey), prompt: item.prompt })"
        :aria-describedby="index === 0 ? 'card-help card-reading' : undefined"
        @keydown="keydown"
        @click="index === 0 && !committed && !moved && (revealed = true)"
      >
        <div
          class="
            flex w-full justify-between text-xs tracking-[0.06em]
            text-muted
          "
        >
          <span>{{ $t(item.deck.labelKey) }}</span>
          <span v-if="item.historical" class="text-primary">{{ $t('study.historicalBadge') }}</span>
          <span v-else aria-hidden="true">✦</span>
        </div>
        <span class="card-character mt-auto block text-[clamp(5rem,20vw,7rem)] leading-[1.7]" :class="item.deck.fontFamily === 'kana' ? 'font-kana' : 'font-zhuyin'" :lang="item.deck.language">{{ item.prompt }}</span>
        <span :id="index === 0 ? 'card-reading' : undefined" class="grid min-h-10 place-items-center" lang="en" aria-live="polite">
          <span
            class="
              font-serif text-[1.6rem] transition-[filter] duration-250
              motion-reduce:transition-none motion-reduce:duration-0
            "
            :class="item.showReading ? 'blur-none' : 'blur-[6px]'"
            :aria-hidden="!item.showReading"
          >{{ item.reading }}</span>
          <span v-if="!item.showReading" class="sr-only">{{ $t('study.tapReveal') }}</span>
        </span>
        <span class="mt-auto pt-4 text-[0.7rem] text-muted">{{ $t(item.showReading ? 'study.takeYourTime' : 'study.revealHint') }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
</style>
