import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { pronunciationByCard, pronunciationGroups, pronunciationRecordings } from '@/data/audio'
import { studyDecks } from '@/data/decks'

describe('pronunciation assets and attribution', () => {
  it('covers all 133 cards with 48 shared kana sounds and 37 Zhuyin recordings', () => {
    const cards = studyDecks.flatMap(deck => deck.cards)
    expect(Object.keys(pronunciationByCard).sort()).toEqual(cards.map(card => card.id).sort())
    expect(pronunciationGroups.map(group => group.recordings.length)).toEqual([48, 37])
    expect(pronunciationByCard['ja-hiragana-a']).toBe(pronunciationByCard['ja-katakana-a'])
    expect(pronunciationByCard['ja-hiragana-wi']?.id).toBe('ja-wi')
    expect(pronunciationByCard['ja-hiragana-we']?.id).toBe('ja-we')
  })

  it('ships the audited files with source links, licenses, modification notices, and matching hashes', () => {
    let bytes = 0
    for (const recording of pronunciationRecordings) {
      const file = resolve('public', recording.src.slice(1))
      const data = readFileSync(file)
      expect(createHash('sha256').update(data).digest('hex')).toBe(recording.sha256)
      expect(recording.originalSha256).toMatch(/^[a-f\d]{64}$/)
      expect(recording.author.length).toBeGreaterThan(0)
      expect(recording.modifications).toContain('MP3')
      expect(new URL(recording.sourceUrl).protocol).toBe('https:')
      expect(new URL(recording.licenseUrl).protocol).toBe('https:')
      expect(recording.license).toBe(recording.mode === 'tw' ? 'CC BY 4.0' : 'Public domain')
      expect(data.length).toBeGreaterThan(1000)
      bytes += statSync(file).size
    }
    expect(bytes).toBeLessThan(5 * 1024 * 1024)
    expect(readdirSync('public/audio/ja').filter(file => file.endsWith('.mp3'))).toHaveLength(48)
    expect(readdirSync('public/audio/tw').filter(file => file.endsWith('.mp3'))).toHaveLength(37)
  })
})
