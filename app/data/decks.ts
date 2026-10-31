import type { StudyDeck } from '../types/study'
import hiragana from './ja/hiragana'
import katakana from './ja/katakana'
import phonetic from './tw/phonetic'

export const studyDecks: readonly StudyDeck[] = [
  { id: 'hiragana', mode: 'ja', language: 'ja', labelKey: 'study.hiragana', fontFamily: 'kana', cards: hiragana },
  { id: 'katakana', mode: 'ja', language: 'ja', labelKey: 'study.katakana', fontFamily: 'kana', cards: katakana },
  { id: 'zhuyin', mode: 'tw', language: 'zh-Hant-TW', labelKey: 'study.zhuyin', fontFamily: 'zhuyin', cards: phonetic },
]
