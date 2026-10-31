<script setup lang="ts">
import type { Rating } from '../types/study'
import { eligibleIds } from '../utils/study/session'

const store = useStudyStore()
const { storageWarning } = useStudyPersistence()
const { t } = useI18n()
const localePath = useLocalePath()
const announcement = shallowRef('')
const session = computed(() => store.progress.session)
const exhausted = computed(() => eligibleIds(store.saved.mode, store.progress).length === 0)
const canUndo = computed(() => store.lastRating?.mode === store.saved.mode)
const dailyPercent = computed(() => Math.min(100, session.value.completed.length / store.progress.settings.goal * 100))

function rate(id: string, rating: Rating) {
  store.rate(id, rating)
  announcement.value = t(rating === 'mastered' ? 'study.ratedMastered' : 'study.ratedReview')
}

function rateCurrent(rating: Rating) {
  if (store.current) {
    rate(store.current.id, rating)
  }
}

function undo() {
  store.undo()
  announcement.value = t('study.undone')
}
</script>

<template>
  <div class="lingder-shell">
    <header class="site-header">
      <NuxtLink class="wordmark" :to="localePath('/')" :aria-label="$t('study.home')"><span class="brand-mark" aria-hidden="true">✦</span>{{ $t('study.brand') }}<span class="brand-dot">.</span></NuxtLink>
      <div class="header-meta"><span>{{ $t('study.smallSteps') }}</span><ThemeToggler /></div>
    </header>
    <div v-if="!store.ready" class="loading-state" role="status">{{ $t('study.loading') }}</div>
    <template v-else>
      <p v-if="storageWarning" class="storage-warning" role="alert">{{ $t(`study.storage.${storageWarning}`) }}</p>
      <section class="study-intro">
        <p class="eyebrow">{{ $t('study.eyebrow') }}</p>
        <h1>{{ $t('study.title') }} <span>{{ $t('study.titleAccent') }}</span></h1>
        <p class="intro-copy">{{ $t('study.subtitle') }}</p>
      </section>
      <ModeSelector :mode="store.saved.mode" @change="store.setMode" />
      <div class="study-layout">
        <aside class="study-sidebar">
          <div class="daily-summary study-panel">
            <p class="eyebrow">{{ $t('study.yourRhythm') }}</p>
            <p class="daily-number">{{ session.completed.length }}<span> / {{ store.progress.settings.goal }}</span></p>
            <p class="panel-note">{{ $t('study.todayCount') }}</p>
            <progress :value="Math.min(session.completed.length, store.progress.settings.goal)" :max="store.progress.settings.goal" :aria-label="$t('study.dailyProgress')" />
            <p v-if="session.extraCompleted" class="panel-note">{{ $t('study.extraCount', { count: session.extraCompleted }) }}</p>
          </div>
          <StudySettings :settings="store.progress.settings" :mode="store.saved.mode" @change="store.setSettings" />
          <MasteredCollection :mode="store.saved.mode" :mastered="store.progress.mastered" @restore="store.restore" />
        </aside>
        <section class="study-stage" :aria-label="$t('study.practice')">
          <div class="session-heading"><span>{{ $t(session.extra ? 'study.extraPractice' : 'study.dailySession') }}</span><span>{{ $t('study.remaining', { count: session.queue.length }) }}</span></div>
          <StudyCard
            v-if="store.current"
            :card="store.current"
            :deck="store.current.deck"
            :reading-display="store.progress.settings.reading"
            @rate="rate"
          />
          <StudyComplete v-else :exhausted="exhausted" :extra="session.extra" @practice="store.startExtra" />
          <p id="card-help" class="gesture-help">{{ $t('study.gestureHint') }}</p>
          <RatingControls :disabled="!store.current" :can-undo="canUndo" @rate="rateCurrent" @undo="undo" />
          <p class="keyboard-help">{{ $t('study.keyboardHint') }}</p>
          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }} {{ $t('study.progressAnnouncement', { count: session.completed.length, goal: store.progress.settings.goal, percent: dailyPercent }) }}</p>
        </section>
        <aside class="study-note">
          <span class="note-spark" aria-hidden="true">✧</span>
          <h2>{{ $t('study.noteTitle') }}</h2>
          <p>{{ $t('study.noteBody') }}</p>
          <div class="note-divider" />
          <p>{{ $t('study.reviewHint') }}</p>
        </aside>
      </div>
      <footer class="site-footer"><span>{{ $t('study.footer') }}</span><span>{{ $t('study.localOnly') }}</span></footer>
    </template>
  </div>
</template>

<style scoped>
</style>
