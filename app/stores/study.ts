import type { ModeProgress, Rating, SavedStudy, StudyMode, StudySettings } from '../types/study'
import { studyDecks } from '../data/decks'
import { emptySession, initialStudy, localDay, reconcileSession } from '../utils/study/session'

export const useStudyStore = defineStore('study', () => {
  const saved = ref<SavedStudy>(initialStudy())
  const ready = shallowRef(false)
  const lastRating = shallowRef<{ mode: StudyMode, progress: ModeProgress } | null>(null)
  const progress = computed(() => saved.value.modes[saved.value.mode])
  const current = computed(() => {
    const id = progress.value.session.queue[0]
    for (const deck of studyDecks) {
      const card = deck.cards.find(card => card.id === id)
      if (card) {
        return {
          ...card,
          deck,
        }
      }
    }
    return null
  })

  function refreshDay(day = localDay()) {
    for (const mode of ['ja', 'tw'] as const) {
      const state = saved.value.modes[mode]
      if (state.session.day !== day) {
        state.session = reconcileSession(mode, state, day)
        if (lastRating.value?.mode === mode) {
          lastRating.value = null
        }
      }
    }
  }

  function initialize(value: SavedStudy | null, day = localDay()) {
    saved.value = value ?? initialStudy()
    lastRating.value = null
    for (const mode of ['ja', 'tw'] as const) {
      saved.value.modes[mode].session = reconcileSession(mode, saved.value.modes[mode], day)
    }
    ready.value = true
  }

  function setMode(mode: StudyMode) {
    refreshDay()
    saved.value.mode = mode
  }

  function setSettings(settings: Partial<StudySettings>) {
    refreshDay()
    progress.value.settings = { ...progress.value.settings, ...settings }
    // Settings changes return to the daily session without losing extra totals.
    progress.value.session.extra = false
    progress.value.session = reconcileSession(saved.value.mode, progress.value, localDay())
    lastRating.value = null
  }

  function rate(id: string, rating: Rating) {
    refreshDay()
    if (!ready.value || current.value?.id !== id) {
      return
    }
    lastRating.value = { mode: saved.value.mode, progress: JSON.parse(JSON.stringify(progress.value)) as ModeProgress }
    const session = progress.value.session
    session.queue.shift()
    if (session.extra) {
      session.extraSeen.push(id)
      session.extraCompleted++
    } else {
      session.completed.push(id)
    }
    if (rating === 'mastered') {
      progress.value.mastered.push(id)
    }
  }

  function undo() {
    refreshDay()
    if (!lastRating.value || lastRating.value.mode !== saved.value.mode) {
      return
    }
    saved.value.modes[lastRating.value.mode] = lastRating.value.progress
    lastRating.value = null
  }

  function restore(id: string) {
    refreshDay()
    progress.value.mastered = progress.value.mastered.filter(cardId => cardId !== id)
    progress.value.session = reconcileSession(saved.value.mode, progress.value, localDay())
    lastRating.value = null
  }

  function startExtra() {
    refreshDay()
    if (progress.value.session.queue.length) {
      return
    }
    const session = progress.value.session
    progress.value.session = { ...emptySession(session.day), completed: session.completed, extra: true, extraCompleted: session.extraCompleted }
    progress.value.session = reconcileSession(saved.value.mode, progress.value, localDay())
    lastRating.value = null
  }

  return { saved, ready, lastRating, progress, current, initialize, refreshDay, setMode, setSettings, rate, undo, restore, startExtra }
})
