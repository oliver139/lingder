import type { ModeProgress, SavedStudy, StudyMode } from '../../types/study'
import { studyDecks } from '../../data/decks'

export const STUDY_STORAGE_KEY = 'lingder.study.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validIds(value: unknown, mode: StudyMode): value is string[] {
  const ids = new Set(studyDecks.filter(deck => deck.mode === mode).flatMap(deck => deck.cards.map(card => card.id)))
  return Array.isArray(value) && value.every(id => typeof id === 'string' && ids.has(id)) && new Set(value).size === value.length
}

function validProgress(value: unknown, mode: StudyMode): value is ModeProgress {
  if (!isRecord(value) || !isRecord(value.settings) || !isRecord(value.session)) {
    return false
  }
  const { settings, session } = value
  return ['hiragana', 'katakana', 'both'].includes(String(settings.script))
    && typeof settings.historical === 'boolean'
    && [5, 10, 20].includes(Number(settings.goal)) && typeof settings.goal === 'number'
    && ['visible', 'reveal'].includes(String(settings.reading))
    && validIds(value.mastered, mode)
    && typeof session.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(session.day)
    && validIds(session.completed, mode) && validIds(session.queue, mode) && validIds(session.extraSeen, mode)
    && typeof session.extra === 'boolean'
    && typeof session.extraCompleted === 'number' && Number.isSafeInteger(session.extraCompleted) && session.extraCompleted >= 0
}

export function decodeStudy(raw: string): SavedStudy | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.version !== 1 || !['ja', 'tw'].includes(String(value.mode)) || !isRecord(value.modes)) {
      return null
    }
    if (!validProgress(value.modes.ja, 'ja') || !validProgress(value.modes.tw, 'tw')) {
      return null
    }
    return value as unknown as SavedStudy
  } catch {
    return null
  }
}
