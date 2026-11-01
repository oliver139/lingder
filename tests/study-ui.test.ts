import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import MasteredCollection from '@/components/study/MasteredCollection.vue'
import ModeSelector from '@/components/study/ModeSelector.vue'
import RatingControls from '@/components/study/RatingControls.vue'
import StudyCard from '@/components/study/StudyCard.vue'
import StudyComplete from '@/components/study/StudyComplete.vue'
import StudySettings from '@/components/study/StudySettings.vue'
import { useCardGesture } from '@/composables/useCardGesture'
import { usePronunciationAudio } from '@/composables/usePronunciationAudio'
import { useStudyPersistence } from '@/composables/useStudyPersistence'
import en from '@/i18n/locales/en.json'
import IndexPage from '@/pages/index.vue'
import { useStudyStore } from '@/stores/study'

function t(key: string, params: Record<string, string | number> = {}) {
  let value: unknown = en
  for (const part of key.split('.')) {
    value = (value as Record<string, unknown>)[part]
  }
  return String(value).replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? name))
}

beforeAll(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
})

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.stubGlobal('useStudyStore', useStudyStore)
  vi.stubGlobal('useStudyPersistence', useStudyPersistence)
  vi.stubGlobal('useCardGesture', useCardGesture)
  vi.stubGlobal('usePronunciationAudio', usePronunciationAudio)
  vi.stubGlobal('useI18n', () => ({ t }))
})

afterAll(() => vi.restoreAllMocks())

function screen() {
  return mount(IndexPage, {
    global: {
      mocks: { $t: t },
      components: { MasteredCollection, ModeSelector, RatingControls, StudyCard, StudyComplete, StudySettings },
      stubs: {
        ThemeToggler: true,
        UButton: defineComponent({ props: ['disabled', 'icon', 'color', 'variant', 'size'], template: '<button :disabled="disabled"><slot /></button>' }),
      },
    },
  })
}

describe('study screen integration', () => {
  it('shows a stable loading placeholder before mounted initialization renders the deck', async () => {
    const wrapper = screen()
    expect(wrapper.get('h1').text()).toContain('Meet your next')
    expect(wrapper.text()).toContain(en.seo.introduction)
    expect(wrapper.get('[role="status"]').text()).toContain('Getting your cards ready')
    expect(wrapper.get('[role="status"] [aria-hidden="true"]').exists()).toBe(true)
    expect(wrapper.find('.study-card').exists()).toBe(false)
    await nextTick()
    expect(wrapper.find('.study-card').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Getting your cards ready')
  })

  it('rates via buttons, undoes, restores mastery, and switches modes', async () => {
    const wrapper = screen()
    await nextTick()
    const store = useStudyStore()
    const first = store.current!.id
    await wrapper.findAll('button').find(button => button.text() === 'Mastered')!.trigger('click')
    expect(store.progress.mastered).toEqual([first])
    await wrapper.findAll('button').find(button => button.text() === 'Back to previous')!.trigger('click')
    expect(store.current!.id).toBe(first)
    await wrapper.findAll('button').find(button => button.text() === 'Mastered')!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Restore')!.trigger('click')
    expect(store.progress.mastered).toEqual([])
    await wrapper.findAll('button').find(button => button.text().includes('Taiwan Zhuyin'))!.trigger('click')
    expect(store.saved.mode).toBe('tw')
    expect(wrapper.get('.card-character').attributes('lang')).toBe('zh-Hant-TW')
    expect(wrapper.find('input[name="script"]').exists()).toBe(false)
  })

  it('keeps Undo enabled until all ratings are reversed', async () => {
    const wrapper = screen()
    await nextTick()
    const store = useStudyStore()
    const ids = store.progress.session.queue.slice(0, 3)
    const rate = wrapper.findAll('button').find(button => button.text() === 'Mastered')!
    const undo = wrapper.findAll('button').find(button => button.text() === 'Back to previous')!
    for (let index = 0; index < 3; index++) {
      await rate.trigger('click')
    }
    for (let index = 2; index >= 0; index--) {
      expect(undo.attributes('disabled')).toBeUndefined()
      await undo.trigger('click')
      expect(store.current!.id).toBe(ids[index])
    }
    expect(undo.attributes('disabled')).toBeDefined()
    expect(store.progress.mastered).toEqual([])
  })

  it('updates daily, extra and accessible progress totals when the goal changes', async () => {
    const wrapper = screen()
    await nextTick()
    const store = useStudyStore()
    store.setSettings({ goal: 20 })
    while (store.current) {
      store.rate(store.current.id, 'review')
    }
    store.startExtra()
    while (store.current) {
      store.rate(store.current.id, 'review')
    }
    await nextTick()
    expect(wrapper.text()).toContain('Plus 20 extra practice cards')
    await wrapper.findAll('input[name="goal"]')[0]!.setValue(true)
    expect(wrapper.text()).toContain('5 / 5')
    expect(wrapper.text()).not.toContain('20 / 5')
    expect(wrapper.text()).toContain('Plus 35 extra practice cards')
    expect(wrapper.get('progress').attributes('value')).toBe('5')
    expect(wrapper.get('progress').attributes('max')).toBe('5')
    expect(wrapper.get('[aria-atomic="true"]').text()).toContain('5 of 5 daily cards complete')
    await wrapper.findAll('input[name="goal"]')[2]!.setValue(true)
    expect(wrapper.text()).toContain('20 / 20')
    expect(wrapper.text()).toContain('Plus 20 extra practice cards')
  })

  it('keeps the visible extra-practice card when lowering an already-met goal', async () => {
    const wrapper = screen()
    await nextTick()
    const store = useStudyStore()
    store.setSettings({ goal: 20 })
    while (store.current) {
      store.rate(store.current.id, 'review')
    }
    store.startExtra()
    store.rate(store.current!.id, 'review')
    await nextTick()
    const card = wrapper.get('.study-card').element
    const queue = [...store.progress.session.queue]
    await wrapper.findAll('input[name="goal"]')[0]!.setValue(true)
    expect(wrapper.get('.study-card').element).toBe(card)
    expect(store.progress.session.queue).toEqual(queue)
    expect(store.progress.session.extra).toBe(true)
    expect(wrapper.text()).toContain('19 left')
    expect(wrapper.text()).toContain('Plus 16 extra practice cards')
  })

  it('updates settings, completes a goal and begins extra practice', async () => {
    const wrapper = screen()
    await nextTick()
    await wrapper.findAll('input[name="goal"]')[0]!.setValue(true)
    await wrapper.findAll('input[name="script"]')[1]!.setValue(true)
    expect(wrapper.text()).toContain(en.study.keyboardHint)
    expect(wrapper.text()).not.toContain('Space / Enter reveals.')
    await wrapper.findAll('input[name="reading"]')[1]!.setValue(true)
    expect(wrapper.text()).toContain('Tap to reveal')
    expect(wrapper.text()).toContain('Space / Enter reveals.')
    await wrapper.findAll('input[name="reading"]')[0]!.setValue(true)
    expect(wrapper.text()).not.toContain('Space / Enter reveals.')
    const store = useStudyStore()
    expect(store.progress.settings.script).toBe('katakana')
    for (let i = 0; i < 5; i++) {
      await wrapper.findAll('button').find(button => button.text() === 'Review later')!.trigger('click')
    }
    expect(wrapper.text()).toContain('A little more familiar.')
    await wrapper.findAll('button').find(button => button.text() === 'Extra practice')!.trigger('click')
    expect(store.progress.session.extra).toBe(true)
    expect(wrapper.find('.study-card').exists()).toBe(true)
    expect(store.progress.session.completed).toHaveLength(5)
  })
})
