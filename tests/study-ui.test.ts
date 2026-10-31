import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import MasteredCollection from '@/components/study/MasteredCollection.vue'
import ModeSelector from '@/components/study/ModeSelector.vue'
import RatingControls from '@/components/study/RatingControls.vue'
import StudyCard from '@/components/study/StudyCard.vue'
import StudyComplete from '@/components/study/StudyComplete.vue'
import StudySettings from '@/components/study/StudySettings.vue'
import { useCardGesture } from '@/composables/useCardGesture'
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

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.stubGlobal('useStudyStore', useStudyStore)
  vi.stubGlobal('useStudyPersistence', useStudyPersistence)
  vi.stubGlobal('useCardGesture', useCardGesture)
  vi.stubGlobal('useI18n', () => ({ t }))
  vi.stubGlobal('useLocalePath', () => (path: string) => `/en${path}`)
})

function screen() {
  return mount(IndexPage, {
    global: {
      mocks: { $t: t },
      components: { MasteredCollection, ModeSelector, RatingControls, StudyCard, StudyComplete, StudySettings },
      stubs: {
        ThemeToggler: true,
        NuxtLink: defineComponent({ props: ['to'], template: '<a :href="to"><slot /></a>' }),
        UButton: defineComponent({ props: ['disabled', 'icon', 'color', 'variant', 'size'], template: '<button :disabled="disabled"><slot /></button>' }),
      },
    },
  })
}

describe('study screen integration', () => {
  it('shows a stable loading placeholder before mounted initialization renders the deck', async () => {
    const wrapper = screen()
    expect(wrapper.text()).toContain('Getting your cards ready')
    await nextTick()
    expect(wrapper.find('.study-card').exists()).toBe(true)
  })

  it('rates via buttons, undoes, restores mastery, and switches modes', async () => {
    const wrapper = screen()
    await nextTick()
    const store = useStudyStore()
    const first = store.current!.id
    await wrapper.findAll('button').find(button => button.text() === 'Mastered')!.trigger('click')
    expect(store.progress.mastered).toEqual([first])
    await wrapper.findAll('button').find(button => button.text() === 'Undo last rating')!.trigger('click')
    expect(store.current!.id).toBe(first)
    await wrapper.findAll('button').find(button => button.text() === 'Mastered')!.trigger('click')
    await wrapper.findAll('button').find(button => button.text() === 'Restore')!.trigger('click')
    expect(store.progress.mastered).toEqual([])
    await wrapper.findAll('button').find(button => button.text().includes('Taiwan Zhuyin'))!.trigger('click')
    expect(store.saved.mode).toBe('tw')
    expect(wrapper.get('.card-character').attributes('lang')).toBe('zh-Hant-TW')
    expect(wrapper.find('input[name="script"]').exists()).toBe(false)
  })

  it('updates settings, completes a goal and begins extra practice', async () => {
    const wrapper = screen()
    await nextTick()
    await wrapper.findAll('input[name="goal"]')[0]!.setValue(true)
    await wrapper.findAll('input[name="script"]')[1]!.setValue(true)
    expect(wrapper.text()).toContain('Focus the card to use arrow keys.')
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
