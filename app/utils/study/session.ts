import type { ModeProgress, SavedStudy, StudyMode, StudySession } from '../../types/study'
import { studyDecks } from '../../data/decks'

export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function emptySession(day: string): StudySession {
  return { day, completed: [], queue: [], extra: false, extraCompleted: 0, extraSeen: [] }
}

export function initialStudy(): SavedStudy {
  const mode = (): ModeProgress => ({
    settings: { script: 'both', historical: false, goal: 10, reading: 'visible' },
    mastered: [],
    session: emptySession(''),
  })
  return { version: 1, mode: 'ja', modes: { ja: mode(), tw: mode() } }
}

export function eligibleIds(mode: StudyMode, progress: ModeProgress): string[] {
  return studyDecks
    .filter(deck => deck.mode === mode && (mode !== 'ja' || progress.settings.script === 'both' || deck.id === progress.settings.script))
    .flatMap(deck => deck.cards)
    .filter(card => (progress.settings.historical || !card.historical) && !progress.mastered.includes(card.id))
    .map(card => card.id)
}

export function randomBatch(ids: readonly string[], count: number, random = Math.random): string[] {
  const shuffled = [...new Set(ids)]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled.slice(0, Math.max(0, count))
}

// Preserve the existing order across reloads and fill only the missing slots.
export function reconcileSession(mode: StudyMode, progress: ModeProgress, day: string): StudySession {
  const session = progress.session.day === day ? progress.session : emptySession(day)
  const seen = session.extra ? session.extraSeen : session.completed
  const eligible = eligibleIds(mode, progress).filter(id => !seen.includes(id))
  const studied = session.completed.length + session.extraCompleted
  // An extra batch keeps its original size, including across goal changes and reloads.
  // Only a fresh batch (no queued or seen cards) uses the current goal.
  const extraRemaining = session.queue.length || session.extraSeen.length ? session.queue.length : progress.settings.goal
  const remaining = session.extra ? extraRemaining : Math.max(0, progress.settings.goal - studied)
  const retained = session.queue.filter(id => eligible.includes(id)).slice(0, remaining)
  const added = randomBatch(eligible.filter(id => !retained.includes(id)), remaining - retained.length)
  return { ...session, queue: [...retained, ...added] }
}
