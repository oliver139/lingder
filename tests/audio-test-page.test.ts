import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { usePronunciationAudio } from '@/composables/usePronunciationAudio'
import { pronunciationByCard } from '@/data/audio'
import { studyDecks } from '@/data/decks'
import TestPage from '@/pages/test.vue'

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
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('usePronunciationAudio', usePronunciationAudio)
})
afterEach(() => vi.stubGlobal('Audio', originalAudio))

function render() {
  return mount(TestPage, {
    global: {
      mocks: { $t: (key: string, params?: { script: string, character: string }) => params ? `${params.script} ${params.character}` : key },
      stubs: { UButton: defineComponent({ props: ['icon', 'variant', 'ui'], template: '<button type="button" :data-icon="icon"><slot /></button>' }) },
    },
  })
}

describe('pronunciation test page', () => {
  it('lists all characters and readings in three groups without loading audio', () => {
    const wrapper = render()
    expect(wrapper.findAll('section')).toHaveLength(3)
    expect(wrapper.findAll('li')).toHaveLength(133)
    expect(wrapper.findAll('button')).toHaveLength(133)
    for (const deck of studyDecks) {
      for (const card of deck.cards) {
        const item = wrapper.get(`[data-card-id="${card.id}"]`)
        expect(item.text()).toContain(card.prompt)
        expect(item.text()).toContain(card.reading)
        expect(item.get('button').attributes('aria-label')).toContain(card.prompt)
        expect(item.get('button').text()).toContain(card.prompt)
        expect(item.get('button').text()).toContain(card.reading)
      }
    }
    expect(FakeAudio.instances).toHaveLength(0)
  })

  it('plays every mapped clip, reuses one player and releases it when leaving', async () => {
    const wrapper = render()
    for (const deck of studyDecks) {
      for (const card of deck.cards) {
        await wrapper.get(`[data-card-id="${card.id}"] button span`).trigger('click')
        await flushPromises()
        expect(FakeAudio.instances[0]!.src).toContain(pronunciationByCard[card.id]!.src)
      }
    }
    expect(FakeAudio.instances).toHaveLength(1)
    const audio = FakeAudio.instances[0]!
    expect(audio.pause).toHaveBeenCalledTimes(132)
    wrapper.unmount()
    expect(audio.src).toBe('')
    expect(audio.pause).toHaveBeenCalledTimes(133)
  })

  it('shows failures on the selected character and supports replay and retry', async () => {
    const wrapper = render()
    const buttons = wrapper.findAll('button')
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
