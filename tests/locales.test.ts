import { describe, expect, it } from 'vitest'
import en from '@/i18n/locales/en.json'
import ja from '@/i18n/locales/ja.json'
import zhHans from '@/i18n/locales/zh-Hans.json'
import zhHant from '@/i18n/locales/zh-Hant.json'

function flatten(messages: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? [[path, value]] : Object.entries(flatten(value as Record<string, unknown>, path))
  }))
}

describe('interface translations', () => {
  const source = flatten(en)
  it.each([['zh-Hant', zhHant], ['zh-Hans', zhHans], ['ja', ja]] as const)('%s provides every message and preserves interpolation', (_locale, messages) => {
    const translated = flatten(messages)
    expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort())
    for (const [key, value] of Object.entries(source)) {
      expect(translated[key]?.trim(), key).toBeTruthy()
      const tokens = /\{\w+\}|@:[\w.]+/g
      expect(translated[key]?.match(tokens)?.sort() ?? [], key).toEqual(value.match(tokens)?.sort() ?? [])
    }
  })
})
