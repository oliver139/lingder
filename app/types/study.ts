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
