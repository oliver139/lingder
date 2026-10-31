import { mount } from '@vue/test-utils'
import { useEventListener, useIntervalFn } from '@vueuse/core'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useStudyPersistence } from '@/composables/useStudyPersistence'
import { useStudyStore } from '@/stores/study'
import { decodeStudy, STUDY_STORAGE_KEY } from '@/utils/study/persistence'
import { eligibleIds, initialStudy, localDay, randomBatch } from '@/utils/study/session'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 31, 12))
  for (const [name, value] of Object.entries({ defineStore, ref, shallowRef, computed, watch, onMounted, useEventListener, useIntervalFn })) {
    vi.stubGlobal(name, value)
  }
  setActivePinia(createPinia())
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function initialized() {
  const store = useStudyStore()
  store.initialize(null)
  return store
}

function finishDaily(store: ReturnType<typeof useStudyStore>) {
  while (store.current) {
    store.rate(store.current.id, 'review')
  }
}

describe('selection and calendar', () => {
  it('filters scripts, historical kana, and individual mastery', () => {
    const state = initialStudy().modes.ja
    expect(eligibleIds('ja', state)).toHaveLength(92)
    state.settings.historical = true
    expect(eligibleIds('ja', state)).toHaveLength(96)
    state.settings.script = 'hiragana'
    state.mastered = ['ja-hiragana-a']
    expect(eligibleIds('ja', state)).toHaveLength(47)
    state.settings.script = 'both'
    expect(eligibleIds('ja', state)).toContain('ja-katakana-a')
    expect(eligibleIds('tw', state)).toHaveLength(37)
  })

  it('shuffles without mutating input, duplicates, or overfilling small pools', () => {
    const input = ['a', 'b', 'c', 'c']
    expect(randomBatch(input, 8, () => 0)).toEqual(['b', 'c', 'a'])
    expect(input).toEqual(['a', 'b', 'c', 'c'])
    expect(randomBatch(input, 2, () => 0.99)).toEqual(['a', 'b'])
    expect(randomBatch([], 10)).toEqual([])
    expect(randomBatch(input, -1)).toEqual([])
  })

  it('uses local calendar fields, including month and year boundaries', () => {
    expect(localDay(new Date(2027, 0, 1, 0, 1))).toBe('2027-01-01')
    expect(localDay(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })
})

describe('daily study store', () => {
  it('persists selections and ratings across reload with independent modes', () => {
    const store = initialized()
    const id = store.current!.id
    store.rate(id, 'mastered')
    const remaining = [...store.progress.session.queue]
    store.setMode('tw')
    expect(store.progress.mastered).toEqual([])
    store.setMode('ja')
    expect(store.progress.mastered).toEqual([id])
    const recovered = decodeStudy(JSON.stringify(store.saved))
    expect(recovered).not.toBeNull()
    store.initialize(recovered)
    expect(store.progress.session.queue).toEqual(remaining)
    expect(store.progress.session.completed).toEqual([id])
  })

  it('ignores duplicate ratings, undoes latest rating and restores individual mastery', () => {
    const store = initialized()
    const id = store.current!.id
    store.rate(id, 'mastered')
    store.rate(id, 'mastered')
    expect(store.progress.session.completed).toEqual([id])
    store.undo()
    expect(store.current!.id).toBe(id)
    expect(store.progress.mastered).toEqual([])
    store.undo()
    store.rate(id, 'mastered')
    store.restore(id)
    expect(store.progress.mastered).toEqual([])
    expect(store.progress.session.completed).toEqual([id])
    expect(store.progress.session.queue).not.toContain(id)
  })

  it('retains completed work and adjusts remaining cards on settings changes', () => {
    const store = initialized()
    for (let i = 0; i < 6; i++) {
      store.rate(store.current!.id, 'review')
    }
    const done = [...store.progress.session.completed]
    store.setSettings({ goal: 5 })
    expect(store.current).toBeNull()
    store.setSettings({ goal: 20, script: 'katakana', historical: true })
    expect(store.progress.session.queue).toHaveLength(14)
    expect(store.progress.session.queue.every(id => id.startsWith('ja-katakana'))).toBe(true)
    expect(store.progress.session.completed).toEqual(done)
    expect(store.lastRating).toBeNull()
  })

  it('rolls over both modes at midnight, preserves mastery, and clears Undo', () => {
    const store = initialized()
    const id = store.current!.id
    store.rate(id, 'mastered')
    vi.setSystemTime(new Date(2026, 10, 1))
    store.refreshDay()
    expect(store.progress.session.day).toBe('2026-11-01')
    expect(store.progress.session.completed).toEqual([])
    expect(store.progress.mastered).toEqual([id])
    expect(store.saved.modes.tw.session.day).toBe('2026-11-01')
    expect(store.lastRating).toBeNull()
  })

  it('keeps extra batches and totals separate, allows repetition between batches and supports Undo', () => {
    const store = initialized()
    store.setSettings({ goal: 5 })
    store.startExtra()
    expect(store.progress.session.extra).toBe(false)
    finishDaily(store)
    store.startExtra()
    expect(store.progress.session.queue).toHaveLength(5)
    const id = store.current!.id
    store.rate(id, 'review')
    expect(store.progress.session.extraCompleted).toBe(1)
    expect(store.progress.session.completed).toHaveLength(5)
    store.undo()
    expect(store.current!.id).toBe(id)
    expect(store.progress.session.extraCompleted).toBe(0)
    finishDaily(store)
    store.startExtra()
    expect(store.progress.session.extraSeen).toEqual([])
    expect(store.progress.session.extraCompleted).toBe(5)
    expect(new Set(store.progress.session.queue).size).toBe(5)
  })

  it('handles a one-card pool, exhausted pools and restore', () => {
    const saved = initialStudy()
    saved.modes.ja.mastered = eligibleIds('ja', saved.modes.ja).slice(1)
    const store = useStudyStore()
    store.initialize(saved)
    expect(store.progress.session.queue).toHaveLength(1)
    const id = store.current!.id
    store.rate(id, 'review')
    store.startExtra()
    expect(store.current!.id).toBe(id)
    store.rate(id, 'mastered')
    store.startExtra()
    expect(store.current).toBeNull()
    store.restore(id)
    expect(store.current!.id).toBe(id)
  })

  it('does not undo another mode and preserves its last rating when switching', () => {
    const store = initialized()
    const id = store.current!.id
    store.rate(id, 'mastered')
    store.setMode('tw')
    store.undo()
    expect(store.progress.session.completed).toEqual([])
    store.setMode('ja')
    store.undo()
    expect(store.current!.id).toBe(id)
  })
})

describe('storage boundary', () => {
  it('rejects malformed, unsupported and invalid saved state', () => {
    for (const raw of ['{', 'null', '{}', '{"version":2}']) {
      expect(decodeStudy(raw)).toBeNull()
    }
    const store = initialized()
    const saved = JSON.parse(JSON.stringify(store.saved))
    saved.modes.ja.session.queue = ['unknown']
    expect(decodeStudy(JSON.stringify(saved))).toBeNull()
    saved.modes.ja.session.queue = []
    saved.modes.ja.settings.goal = 100
    expect(decodeStudy(JSON.stringify(saved))).toBeNull()
    saved.modes.ja.settings.goal = 10
    saved.modes.tw.session.extraCompleted = -1
    expect(decodeStudy(JSON.stringify(saved))).toBeNull()
  })

  function mountPersistence() {
    let result: ReturnType<typeof useStudyPersistence>
    const wrapper = mount(defineComponent({
      setup() {
        result = useStudyPersistence()
        return () => h('div')
      },
    }))
    return { wrapper, result: result! }
  }

  it('initializes after mounting, saves ratings, and restores the saved queue', async () => {
    const store = useStudyStore()
    expect(store.ready).toBe(false)
    const { wrapper } = mountPersistence()
    expect(store.ready).toBe(true)
    const id = store.current!.id
    store.rate(id, 'mastered')
    await nextTick()
    const raw = localStorage.getItem(STUDY_STORAGE_KEY)!
    expect(decodeStudy(raw)?.modes.ja.mastered).toContain(id)
    wrapper.unmount()
    setActivePinia(createPinia())
    mountPersistence()
    expect(useStudyStore().progress.mastered).toContain(id)
  })

  it('recovers corrupt data with a visible warning and handles denied storage', () => {
    localStorage.setItem(STUDY_STORAGE_KEY, 'bad')
    const first = mountPersistence()
    expect(first.result.storageWarning.value).toBe('invalid')
    first.wrapper.unmount()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    const second = mountPersistence()
    expect(second.result.storageWarning.value).toBe('unavailable')
    expect(useStudyStore().current).not.toBeNull()
  })

  it('refreshes on focus and timer, and cleans listeners on unmount', () => {
    const { wrapper } = mountPersistence()
    const store = useStudyStore()
    vi.setSystemTime(new Date(2026, 10, 1))
    window.dispatchEvent(new Event('focus'))
    expect(store.progress.session.day).toBe('2026-11-01')
    vi.setSystemTime(new Date(2026, 10, 2))
    vi.advanceTimersByTime(1000)
    expect(store.progress.session.day).toBe('2026-11-02')
    wrapper.unmount()
    vi.setSystemTime(new Date(2026, 10, 3))
    window.dispatchEvent(new Event('focus'))
    vi.advanceTimersByTime(1000)
    expect(store.progress.session.day).toBe('2026-11-02')
  })
})
