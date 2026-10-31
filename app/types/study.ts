export type StudyMode = 'ja' | 'tw'
export type Script = 'hiragana' | 'katakana' | 'zhuyin'

export interface StudyCard {
  id: string
  prompt: string
  reading: string
  historical?: boolean
}

export interface StudyDeck {
  id: Script
  mode: StudyMode
  language: 'ja' | 'zh-Hant-TW'
  labelKey: string
  fontFamily: 'kana' | 'zhuyin'
  cards: readonly StudyCard[]
}

export interface StudySettings {
  script: 'hiragana' | 'katakana' | 'both'
  historical: boolean
  goal: 5 | 10 | 20
  reading: 'visible' | 'reveal'
}

export interface StudySession {
  day: string
  completed: string[]
  queue: string[]
  extra: boolean
  extraCompleted: number
  extraSeen: string[]
}

export interface ModeProgress {
  settings: StudySettings
  mastered: string[]
  session: StudySession
}

export interface SavedStudy {
  version: 1
  mode: StudyMode
  modes: Record<StudyMode, ModeProgress>
}

export type Rating = 'review' | 'mastered'
