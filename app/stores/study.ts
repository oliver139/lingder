import type { ModeProgress, Rating, SavedStudy, StudyMode, StudySettings } from '../types/study'
import { studyDecks } from '../data/decks'
import { emptySession, initialStudy, localDay, reconcileSession } from '../utils/study/session'

interface UndoEntry {
  mode: StudyMode
  progress: ModeProgress
  exit?: { x: number, y: number }
}

export const useStudyStore = defineStore('study', () => {
  const saved = ref<SavedStudy>(initialStudy())
  const ready = shallowRef(false)
  const undoHistory = shallowRef<UndoEntry[]>([])
  const lastRating = computed(() => undoHistory.value.at(-1) ?? null)
  const progress = computed(() => saved.value.modes[saved.value.mode])
  // Reclassify today's total against the current goal without rewriting rating history.
  const studiedCount = computed(() => progress.value.session.completed.length + progress.value.session.extraCompleted)
  const dailyCount = computed(() => Math.min(studiedCount.value, progress.value.settings.goal))
  const extraCount = computed(() => Math.max(0, studiedCount.value - progress.value.settings.goal))
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
          undoHistory.value = []
        }
      }
    }
  }

  function initialize(value: SavedStudy | null, day = localDay()) {
    saved.value = value ?? initialStudy()
    undoHistory.value = []
    for (const mode of ['ja', 'tw'] as const) {
      saved.value.modes[mode].session = reconcileSession(mode, saved.value.modes[mode], day)
    }
    ready.value = true
  }

  function setMode(mode: StudyMode) {
    refreshDay()
    if (mode !== saved.value.mode) {
      undoHistory.value = []
      saved.value.mode = mode
    }
  }

  function setSettings(settings: Partial<StudySettings>) {
    refreshDay()
    const previous = progress.value.settings
    const next = { ...previous, ...settings }
    progress.value.settings = next
    if (next.goal === previous.goal && next.script === previous.script && next.historical === previous.historical) {
      return
    }
    const filtersUnchanged = next.script === previous.script && next.historical === previous.historical
    if (filtersUnchanged && progress.value.session.extra && studiedCount.value >= next.goal) {
      undoHistory.value = []
      return
    }
    // Filter changes and unmet goals return to the daily session.
    progress.value.session.extra = false
    progress.value.session = reconcileSession(saved.value.mode, progress.value, localDay())
    undoHistory.value = []
  }

  function rate(id: string, rating: Rating, exit?: { x: number, y: number }) {
    refreshDay()
    if (!ready.value || current.value?.id !== id) {
      return
    }
    const entry: UndoEntry = { mode: saved.value.mode, progress: JSON.parse(JSON.stringify(progress.value)) as ModeProgress, exit: exit ? { ...exit } : undefined }
    undoHistory.value = [...undoHistory.value, entry]
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
    const entry = lastRating.value
    saved.value.modes[entry.mode] = {
      ...entry.progress,
      settings: { ...entry.progress.settings, reading: progress.value.settings.reading },
    }
    undoHistory.value = undoHistory.value.slice(0, -1)
    return entry
  }

  function restore(id: string) {
    refreshDay()
    progress.value.mastered = progress.value.mastered.filter(cardId => cardId !== id)
    progress.value.session = reconcileSession(saved.value.mode, progress.value, localDay())
    undoHistory.value = []
  }

  function restoreAll() {
    refreshDay()
    progress.value.mastered = []
    progress.value.session = reconcileSession(saved.value.mode, progress.value, localDay())
    undoHistory.value = []
  }

  function startExtra() {
    refreshDay()
    if (progress.value.session.queue.length) {
      return
    }
    const session = progress.value.session
    progress.value.session = { ...emptySession(session.day), completed: session.completed, extra: true, extraCompleted: session.extraCompleted }
    progress.value.session = reconcileSession(saved.value.mode, progress.value, localDay())
    undoHistory.value = []
  }

  return { saved, ready, undoHistory, lastRating, progress, studiedCount, dailyCount, extraCount, current, initialize, refreshDay, setMode, setSettings, rate, undo, restore, restoreAll, startExtra }
})
