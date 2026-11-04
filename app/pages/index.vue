<script setup lang="ts">
import type { Rating } from '../types/study'
import { studyDecks } from '../data/decks'
import { eligibleIds } from '../utils/study/session'

const store = useStudyStore()
const { storageWarning } = useStudyPersistence()
const { selectMode } = useStudyModeQuery(store.setMode)
const { t } = useI18n()
const announcement = shallowRef('')
const cardStack = useTemplateRef('cardStack')
const animating = shallowRef(false)
const switchingMode = shallowRef(false)
const upcoming = computed(() => store.progress.session.queue.slice(1, 3).flatMap(id =>
  studyDecks.flatMap(deck => deck.cards.filter(card => card.id === id).map(card => ({ ...card, deck }))),
))
const stage = useTemplateRef<HTMLElement>('stage')
const session = computed(() => store.progress.session)
const exhausted = computed(() => eligibleIds(store.saved.mode, store.progress).length === 0)
const canUndo = computed(() => store.lastRating?.mode === store.saved.mode)
const dailyPercent = computed(() => store.dailyCount / store.progress.settings.goal * 100)

watch([() => store.ready, () => store.current?.id], async ([ready, id], [wasReady, previous]) => {
  if (!ready) {
    return
  }
  const initialLoad = !wasReady
  const changesScreen = Boolean(id) !== Boolean(previous)
  if (!initialLoad && (!changesScreen || !stage.value?.contains(document.activeElement))) {
    return
  }
  await nextTick()
  const target = id
    ? stage.value?.querySelector<HTMLElement>('.study-card')
    : stage.value?.querySelector<HTMLElement>('.completion button:not([disabled])')
      ?? stage.value?.querySelector<HTMLElement>('.completion')
  target?.focus({ preventScroll: true })
}, { immediate: true })

function rate(id: string, rating: Rating, exit?: { x: number, y: number }) {
  store.rate(id, rating, exit)
  announcement.value = t(rating === 'mastered' ? 'study.ratedMastered' : 'study.ratedReview')
}

function rateCurrent(rating: Rating) {
  if (store.current) {
    cardStack.value?.rate(rating)
  }
}

async function undo() {
  if (!canUndo.value || animating.value || switchingMode.value) {
    return
  }
  const undone = store.undo()
  if (!undone) {
    return
  }
  announcement.value = t('study.undone')
  await nextTick()
  cardStack.value?.returnCard(undone.exit)
}
</script>

<template>
  <div>
    <section class="pt-4 pb-3 text-center sm:pt-10 sm:pb-7">
      <p class="text-[0.65rem] font-semibold tracking-[0.17em] text-muted">{{ $t('study.eyebrow') }}</p>
      <h1
        class="
          mx-auto mt-2 max-w-75 text-2xl leading-[1.2]
          font-medium tracking-[-0.055em]
          sm:mt-3 sm:max-w-none sm:text-[clamp(1.75rem,4vw,2.65rem)]
        "
      >
        {{ $t('study.title') }} <span class="text-primary">{{ $t('study.titleAccent') }}</span>
      </h1>
      <p
        class="
          mx-auto mt-1.5 max-w-160 px-4 text-xs
          text-muted
          sm:mt-3 sm:text-sm
        "
      >
        {{ $t('seo.introduction') }}
      </p>
    </section>
    <div
      v-if="!store.ready"
      class="
        flex min-h-[65vh] flex-col items-center justify-center
        gap-9 px-4 py-12
      "
      role="status"
      aria-live="polite"
    >
      <div class="relative isolate aspect-3/4 w-36 sm:w-40" aria-hidden="true">
        <div
          class="
            absolute top-0 -z-20 h-4 w-full
            animate-bounce [animation-delay:-0.8s] [animation-duration:2.4s]
            motion-reduce:animate-none
          "
        >
          <div
            class="
              aspect-3/4 w-full translate-x-3 translate-y-2 rotate-12
              rounded-2xl border border-accented bg-stack
            "
          />
        </div>
        <div
          class="
            absolute top-0 -z-10 h-4 w-full
            animate-bounce [animation-delay:-0.4s] [animation-duration:2.4s]
            motion-reduce:animate-none
          "
        >
          <div
            class="
              aspect-3/4 w-full -translate-x-2 translate-y-1 -rotate-6
              rounded-2xl border border-default bg-elevated
            "
          />
        </div>
        <div
          class="
            absolute top-0 h-4 w-full animate-bounce
            [animation-duration:2.4s]
            motion-reduce:animate-none
          "
        >
          <div
            class="
              flex aspect-3/4 w-full items-center justify-center
              rounded-2xl border border-default bg-card shadow-card
            "
          >
            <span class="animate-pulse text-5xl text-primary motion-reduce:animate-none">✦</span>
          </div>
        </div>
      </div>
      <p
        class="animate-loading-text text-center text-sm text-muted motion-reduce:animate-none"
      >
        {{ $t('study.loading') }}
      </p>
    </div>
    <template v-else>
      <p v-if="storageWarning" class="mt-4 rounded-[0.7rem] bg-elevated p-4 text-sm" role="alert">{{ $t(`study.storage.${storageWarning}`) }}</p>
      <ModeSelector :mode="store.saved.mode" @change="selectMode" />
      <div
        class="
          flex flex-col items-start gap-6 pt-4
          pb-12
          sm:gap-8 sm:pt-10
          laptop:mx-auto laptop:grid laptop:w-full laptop:max-w-228 laptop:grid-cols-[minmax(240px,360px)_minmax(400px,520px)]
          desktop:max-w-none desktop:grid-cols-[minmax(200px,1fr)_minmax(300px,400px)_minmax(150px,1fr)] desktop:gap-[clamp(1.5rem,4vw,3.5rem)]
        "
      >
        <aside
          class="
            mx-auto grid w-full max-w-100 gap-3.5
            laptop:max-w-none
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
              {{ store.dailyCount }}<span class="text-base text-muted"> / {{ store.progress.settings.goal }}</span>
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
              :value="store.dailyCount"
              :max="store.progress.settings.goal"
              :aria-label="$t('study.dailyProgress')"
            />
            <p v-if="store.extraCount" class="text-[0.7rem] leading-[1.7] text-muted">{{ $t('study.extraCount', { count: store.extraCount }) }}</p>
          </div>
          <StudySettings :settings="store.progress.settings" :mode="store.saved.mode" @change="store.setSettings" />
          <MasteredCollection :mode="store.saved.mode" :mastered="store.progress.mastered" @restore="store.restore" @restore-all="store.restoreAll" />
        </aside>
        <section
          ref="stage"
          class="
            study-stage order-first mx-auto w-full max-w-100
            min-w-0
            laptop:order-0 laptop:max-w-none
            desktop:max-w-100
          "
          :aria-label="$t('study.practice')"
        >
          <div
            class="
              mb-3 flex justify-between text-[0.7rem] text-muted
              sm:mb-4
            "
          >
            <span>{{ $t(session.extra ? 'study.extraPractice' : 'study.dailySession') }}</span><span>{{ $t('study.remaining', { count: session.queue.length }) }}</span>
          </div>
          <Transition
            mode="out-in"
            enter-active-class="transition-opacity duration-150 ease-in motion-reduce:transition-none motion-reduce:duration-0"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none motion-reduce:duration-0"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            @before-leave="element => {
              switchingMode = true; element.setAttribute('inert', '')
            }"
            @before-enter="element => element.setAttribute('inert', '')"
            @after-enter="element => {
              switchingMode = false; element.removeAttribute('inert')
            }"
          >
            <div :key="store.saved.mode" class="px-8 sm:px-4">
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
            </div>
          </Transition>
          <p
            id="card-help"
            class="
              mt-11 mb-6 flex flex-wrap items-center
              justify-center gap-x-4 gap-y-1 text-center text-xs
              text-muted
              sm:mt-10
            "
          >
            <span class="sr-only">{{ $t('study.gestureHint') }}</span>
            <span class="inline-flex items-center gap-1.5" aria-hidden="true">
              <span class="inline-flex gap-0.5">
                <UIcon name="i-lucide-arrow-left" class="size-4" />
                <UIcon name="i-lucide-arrow-right" class="size-4" />
              </span>
              {{ $t('study.review') }}
            </span>
            <span class="inline-flex items-center gap-1.5" aria-hidden="true">
              <span class="inline-flex gap-0.5">
                <UIcon name="i-lucide-arrow-up" class="size-4" />
                <UIcon name="i-lucide-arrow-down" class="size-4" />
              </span>
              {{ $t('study.mastered') }}
            </span>
          </p>
          <RatingControls :disabled="!store.current || animating || switchingMode" :can-undo="canUndo && !animating && !switchingMode" @rate="rateCurrent" @undo="undo" />
          <p class="mt-4 text-center text-[0.65rem] leading-[1.7] text-muted">{{ $t('study.keyboardHint') }} <span v-if="store.progress.settings.reading === 'reveal'">{{ $t('study.keyboardRevealHint') }}</span></p>
          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }} {{ $t('study.progressAnnouncement', { count: store.dailyCount, goal: store.progress.settings.goal, percent: dailyPercent }) }}</p>
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
