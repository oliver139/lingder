import { describe, expect, it } from 'vitest'
import { studyDecks } from '@/data/decks'
import hiragana from '@/data/ja/hiragana'
import katakana from '@/data/ja/katakana'
import phonetic from '@/data/tw/phonetic'

describe('study decks', () => {
  it('provides 46 modern kana and two explicitly historical kana per script', () => {
    for (const cards of [hiragana, katakana]) {
      expect(cards.filter(card => !('historical' in card))).toHaveLength(46)
      expect(cards.filter(card => 'historical' in card)).toHaveLength(2)
    }
    expect(hiragana.slice(-2).map(card => card.prompt)).toEqual(['ゐ', 'ゑ'])
    expect(katakana.slice(-2).map(card => card.prompt)).toEqual(['ヰ', 'ヱ'])
    expect(hiragana.map(card => card.reading)).toEqual(katakana.map(card => card.reading))
    expect(hiragana.find(card => card.prompt === 'し')?.reading).toBe('shi')
    expect(hiragana.find(card => card.prompt === 'つ')?.reading).toBe('tsu')
  })

  it('contains exactly the 37 standard Zhuyin symbols with distinct e guides', () => {
    expect(phonetic.map(card => card.prompt).join('')).toBe('ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩ')
    expect(phonetic).toHaveLength(37)
    expect(phonetic.find(card => card.prompt === 'ㄝ')?.reading).toBe('ê')
    expect(phonetic.find(card => card.prompt === 'ㄩ')?.reading).toBe('ü')
  })

  it('uses globally unique stable IDs and complete display metadata', () => {
    const cards = studyDecks.flatMap(deck => deck.cards)
    expect(new Set(cards.map(card => card.id)).size).toBe(133)
    expect(new Set(cards.map(card => card.prompt)).size).toBe(133)
    for (const deck of studyDecks) {
      expect(deck.labelKey).toBeTruthy()
      expect(deck.language).toBeTruthy()
      for (const card of deck.cards) {
        expect(card.id.startsWith(`${deck.mode}-${deck.id}-`)).toBe(true)
        expect(card.reading.trim()).not.toBe('')
      }
    }
  })
})
