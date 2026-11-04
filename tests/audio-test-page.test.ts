import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import ModeSelector from '@/components/study/ModeSelector.vue'
import { usePronunciationAudio } from '@/composables/usePronunciationAudio'
import { useStudyModeQuery } from '@/composables/useStudyModeQuery'
import { useStudyPersistence } from '@/composables/useStudyPersistence'
import { pronunciationByCard } from '@/data/audio'
import { studyDecks } from '@/data/decks'
import TestPage from '@/pages/table.vue'
import { useStudyStore } from '@/stores/study'
import { decodeStudy, STUDY_STORAGE_KEY } from '@/utils/study/persistence'

const originalAudio = globalThis.Audio
class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = []
  src = ''
  preload = ''
  pause = vi.fn()
  load = vi.fn()
  play = vi.fn(() => Promise.resolve())
  removeAttribute = vi.fn(() => { this.src = '' })

  constructor() {
    super()
    FakeAudio.instances.push(this)
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('usePronunciationAudio', usePronunciationAudio)
  vi.stubGlobal('useStudyModeQuery', useStudyModeQuery)
  vi.stubGlobal('useStudyStore', useStudyStore)
  vi.stubGlobal('useStudyPersistence', useStudyPersistence)
  vi.stubGlobal('useRoute', () => ({ path: '/en/table/', query: {}, hash: '' }))
  vi.stubGlobal('useRouter', () => ({ replace: vi.fn() }))
})
afterEach(() => vi.stubGlobal('Audio', originalAudio))

function render() {
  return mount(TestPage, {
    global: {
      components: { ModeSelector },
      mocks: { $t: (key: string, params?: { script: string, character: string }) => params ? `${params.script} ${params.character}` : key },
      stubs: { UButton: defineComponent({ props: ['icon', 'variant', 'ui'], template: '<button type="button" :data-icon="icon"><slot /></button>' }) },
    },
  })
}

describe('pronunciation test page', () => {
  it('uses the Cards preference when no mode is provided and remembers table switch changes', async () => {
    const store = useStudyStore()
    store.initialize(null)
    store.setMode('tw')
    localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(store.saved))
    setActivePinia(createPinia())
    const wrapper = render()
    await nextTick()
    expect(wrapper.findAll('[data-card-id]')).toHaveLength(37)
    await wrapper.getComponent(ModeSelector).findAll('button')[0]!.trigger('click')
    expect(wrapper.findAll('[data-card-id]')).toHaveLength(96)
    expect(decodeStudy(localStorage.getItem(STUDY_STORAGE_KEY)!)?.mode).toBe('ja')
  })

  it('remembers the requested language without loading audio or resetting card progress', async () => {
    vi.stubGlobal('useRoute', () => ({ path: '/en/table/', query: { mode: 'tw' }, hash: '' }))
    const store = useStudyStore()
    store.initialize(null)
    store.rate(store.current!.id, 'mastered')
    const before = JSON.parse(JSON.stringify(store.saved.modes))
    const wrapper = render()
    await nextTick()
    expect(wrapper.findAll('[data-card-id]')).toHaveLength(37)
    expect(wrapper.get('[data-card-id="tw-zhuyin-3105"]').text()).toContain('ㄅ')
    expect(FakeAudio.instances).toHaveLength(0)
    const saved = decodeStudy(localStorage.getItem(STUDY_STORAGE_KEY)!)!
    expect(saved.mode).toBe('tw')
    expect(saved.modes).toEqual(before)
  })

  it('separates languages and groups all kana into expanded rows without loading audio', async () => {
    const wrapper = render()
    expect(wrapper.findAll('section')).toHaveLength(2)
    expect(wrapper.findAll('[data-kana-row]')).toHaveLength(22)
    expect(wrapper.find('details').exists()).toBe(false)
    expect(wrapper.get('[data-kana-row="t"]').text()).toContain('ち')
    expect(wrapper.get('[data-kana-row="h"]').text()).toContain('ふ')
    expect(wrapper.findAll('li')).toHaveLength(96)
    expect(wrapper.findAll('[data-card-id] button')).toHaveLength(96)
    for (const deck of studyDecks) {
      if (deck.mode === 'tw') {
        await wrapper.getComponent(ModeSelector).findAll('button')[1]!.trigger('click')
      }
      for (const card of deck.cards) {
        const item = wrapper.get(`[data-card-id="${card.id}"]`)
        expect(item.text()).toContain(card.prompt)
        expect(item.text()).toContain(card.reading)
        expect(item.get('button').attributes('aria-label')).toContain(card.prompt)
        expect(item.get('button').text()).toContain(card.prompt)
        expect(item.get('button').text()).toContain(card.reading)
      }
    }
    expect(wrapper.findAll('section')).toHaveLength(1)
    expect(wrapper.findAll('[data-card-id]')).toHaveLength(37)
    expect(FakeAudio.instances).toHaveLength(0)
  })

  it('plays every mapped clip, reuses one player and releases it when leaving', async () => {
    const wrapper = render()
    for (const deck of studyDecks) {
      if (deck.mode === 'tw') {
        await wrapper.getComponent(ModeSelector).findAll('button')[1]!.trigger('click')
      }
      for (const card of deck.cards) {
        await wrapper.get(`[data-card-id="${card.id}"] button span`).trigger('click')
        await flushPromises()
        expect(FakeAudio.instances[0]!.src).toContain(pronunciationByCard[card.id]!.src)
      }
    }
    expect(FakeAudio.instances).toHaveLength(1)
    const audio = FakeAudio.instances[0]!
    expect(audio.pause).toHaveBeenCalledTimes(133)
    wrapper.unmount()
    expect(audio.src).toBe('')
    expect(audio.pause).toHaveBeenCalledTimes(134)
  })

  it('stops playback and clears feedback when changing language', async () => {
    const wrapper = render()
    await wrapper.get('[data-card-id] button').trigger('click')
    await flushPromises()
    const audio = FakeAudio.instances[0]!
    await wrapper.getComponent(ModeSelector).findAll('button')[1]!.trigger('click')
    expect(audio.src).toBe('')
    expect(audio.pause).toHaveBeenCalledOnce()
    expect(wrapper.findAll('[data-card-id]')).toHaveLength(37)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('shows failures on the selected character and supports replay and retry', async () => {
    const wrapper = render()
    const buttons = wrapper.findAll('[data-card-id] button')
    await buttons[0]!.trigger('click')
    await flushPromises()
    const audio = FakeAudio.instances[0]!
    audio.play.mockRejectedValueOnce(new Error('Unavailable'))
    await buttons[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').element.closest('li')?.textContent).toContain(studyDecks[0]!.cards[1]!.prompt)
    await buttons[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(buttons[1]!.attributes('data-icon')).toBe('i-lucide-audio-lines')
    expect(buttons[0]!.attributes('data-icon')).toBe('i-lucide-volume-2')
  })
})
