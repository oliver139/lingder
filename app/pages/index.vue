<script setup lang="ts">
import type { Rating } from '../types/study'
import { studyDecks } from '../data/decks'
import { eligibleIds } from '../utils/study/session'

const store = useStudyStore()
const { storageWarning } = useStudyPersistence()
const { t } = useI18n()
const announcement = shallowRef('')
const cardStack = useTemplateRef('cardStack')
const animating = shallowRef(false)
const upcoming = computed(() => store.progress.session.queue.slice(1, 3).flatMap(id =>
  studyDecks.flatMap(deck => deck.cards.filter(card => card.id === id).map(card => ({ ...card, deck }))),
))
const stage = useTemplateRef<HTMLElement>('stage')
const session = computed(() => store.progress.session)
const exhausted = computed(() => eligibleIds(store.saved.mode, store.progress).length === 0)
const canUndo = computed(() => store.lastRating?.mode === store.saved.mode)
const dailyPercent = computed(() => Math.min(100, session.value.completed.length / store.progress.settings.goal * 100))

watch(() => store.current?.id, async (id, previous) => {
  if (Boolean(id) === Boolean(previous) || !stage.value?.contains(document.activeElement)) {
    return
  }
  await nextTick()
  stage.value?.querySelector<HTMLElement>(id ? '.study-card' : '.completion')?.focus()
})

function rate(id: string, rating: Rating) {
  store.rate(id, rating)
  announcement.value = t(rating === 'mastered' ? 'study.ratedMastered' : 'study.ratedReview')
}

function rateCurrent(rating: Rating) {
  if (store.current) {
    cardStack.value?.rate(rating)
  }
}

function undo() {
  store.undo()
  announcement.value = t('study.undone')
}
</script>

<template>
  <div>
    <div v-if="!store.ready" class="grid min-h-[65vh] place-content-center text-muted" role="status">{{ $t('study.loading') }}</div>
    <template v-else>
      <p v-if="storageWarning" class="mt-4 rounded-[0.7rem] bg-elevated p-4 text-sm" role="alert">{{ $t(`study.storage.${storageWarning}`) }}</p>
      <section class="pt-7 pb-5 text-center sm:pt-10 sm:pb-7">
        <p class="text-[0.65rem] font-semibold tracking-[0.17em] text-muted">{{ $t('study.eyebrow') }}</p>
        <h1
          class="
            mx-auto mt-3 max-w-75 text-[clamp(1.75rem,4vw,2.65rem)] leading-[1.2]
            font-medium tracking-[-0.055em]
            sm:max-w-none
          "
        >
          {{ $t('study.title') }} <span class="text-primary">{{ $t('study.titleAccent') }}</span>
        </h1>
        <p class="mt-3 text-xs text-muted sm:text-sm">{{ $t('study.subtitle') }}</p>
      </section>
      <ModeSelector :mode="store.saved.mode" @change="store.setMode" />
      <div
        class="
          flex flex-col items-start gap-6 pt-6
          pb-12
          sm:gap-8 sm:pt-10
          desktop:grid desktop:grid-cols-[minmax(200px,1fr)_minmax(300px,400px)_minmax(150px,1fr)] desktop:gap-[clamp(1.5rem,4vw,3.5rem)]
        "
      >
        <aside
          class="
            mx-auto grid w-full max-w-100 gap-3.5
            desktop:max-w-none
          "
        >
          <div
            class="
              rounded-[1rem] border border-default bg-card p-5
              max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:items-center max-sm:gap-x-4 max-sm:gap-y-1
            "
          >
            <p class="text-[0.65rem] font-semibold tracking-[0.17em] text-muted">{{ $t('study.yourRhythm') }}</p>
            <p
              class="
                mt-3 text-[2rem] font-medium tracking-tighter text-highlighted
                max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1 max-sm:m-0
              "
            >
              {{ session.completed.length }}<span class="text-base text-muted"> / {{ store.progress.settings.goal }}</span>
            </p>
            <p class="text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.todayCount') }}</p>
            <progress
              class="
                mt-4 mb-1 block h-1.25 w-full
                overflow-hidden rounded-lg border-0 bg-elevated accent-primary
                max-sm:col-span-2
                [&::-moz-progress-bar]:bg-primary
                [&::-webkit-progress-bar]:bg-elevated
                [&::-webkit-progress-value]:bg-primary
              "
              :value="Math.min(session.completed.length, store.progress.settings.goal)"
              :max="store.progress.settings.goal"
              :aria-label="$t('study.dailyProgress')"
            />
            <p v-if="session.extraCompleted" class="text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.extraCount', { count: session.extraCompleted }) }}</p>
          </div>
          <StudySettings :settings="store.progress.settings" :mode="store.saved.mode" @change="store.setSettings" />
          <MasteredCollection :mode="store.saved.mode" :mastered="store.progress.mastered" @restore="store.restore" />
        </aside>
        <section
          ref="stage"
          class="
            study-stage order-first mx-auto w-full max-w-100
            min-w-0
            desktop:order-0
          "
          :aria-label="$t('study.practice')"
        >
          <div class="mb-4 flex justify-between text-[0.7rem] text-muted"><span>{{ $t(session.extra ? 'study.extraPractice' : 'study.dailySession') }}</span><span>{{ $t('study.remaining', { count: session.queue.length }) }}</span></div>
          <StudyCard
            v-if="store.current"
            ref="cardStack"
            :upcoming="upcoming"
            :card="store.current"
            :deck="store.current.deck"
            :reading-display="store.progress.settings.reading"
            @rate="rate"
            @busy="animating = $event"
          />
          <StudyComplete v-else :exhausted="exhausted" :extra="session.extra" @practice="store.startExtra" />
          <p id="card-help" class="mt-7 mb-4 text-center text-xs text-muted">{{ $t('study.gestureHint') }}</p>
          <RatingControls :disabled="!store.current || animating" :can-undo="canUndo && !animating" @rate="rateCurrent" @undo="undo" />
          <p class="mt-2 text-center text-[0.65rem] leading-[1.7] text-muted">{{ $t('study.keyboardHint') }}</p>
          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }} {{ $t('study.progressAnnouncement', { count: session.completed.length, goal: store.progress.settings.goal, percent: dailyPercent }) }}</p>
        </section>
        <aside class="hidden max-w-44 justify-self-center pt-16 desktop:block">
          <span class="mb-4 block text-[2.5rem] text-primary" aria-hidden="true">✧</span>
          <h2 class="text-base/relaxed font-medium tracking-tight">{{ $t('study.noteTitle') }}</h2>
          <p class="mt-3 text-xs leading-[1.9] text-muted">{{ $t('study.noteBody') }}</p>
          <div class="mt-6 w-7 border-b border-accented" />
          <p class="mt-3 text-xs leading-[1.9] text-muted">{{ $t('study.reviewHint') }}</p>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
</style>
