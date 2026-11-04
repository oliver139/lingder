import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import MasteredCollection from '@/components/study/MasteredCollection.vue'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function setup(mastered = ['ja-hiragana-a']) {
  return mount(MasteredCollection, {
    props: { mode: 'ja', mastered },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: { UButton: defineComponent({ props: ['color', 'variant'], template: '<button :data-color="color"><slot /></button>' }) },
    },
  })
}

const clearButton = (wrapper: ReturnType<typeof setup>) => wrapper.findAll('button').find(button => button.text().includes('ClearMastered') || button.text() === 'study.clearMastered')!

describe('clear mastered confirmation', () => {
  it('hides the clear button when the collection is empty', () => {
    expect(setup([]).findAll('button')).toHaveLength(0)
  })

  it('requires a second click within three seconds', async () => {
    const wrapper = setup()
    await clearButton(wrapper).trigger('click')
    expect(wrapper.emitted('restoreAll')).toBeUndefined()
    expect(clearButton(wrapper).text()).toBe('study.confirmClearMastered')
    expect(clearButton(wrapper).attributes('data-color')).toBe('error')
    await vi.advanceTimersByTimeAsync(2999)
    await clearButton(wrapper).trigger('click')
    expect(wrapper.emitted('restoreAll')).toHaveLength(1)
    await wrapper.setProps({ mastered: [] })
    expect(wrapper.findAll('button')).toHaveLength(0)
  })

  it('resets after the confirmation window and requires two new clicks', async () => {
    const wrapper = setup()
    await clearButton(wrapper).trigger('click')
    await vi.advanceTimersByTimeAsync(3000)
    expect(clearButton(wrapper).text()).toBe('study.clearMastered')
    await clearButton(wrapper).trigger('click')
    expect(wrapper.emitted('restoreAll')).toBeUndefined()
    await clearButton(wrapper).trigger('click')
    expect(wrapper.emitted('restoreAll')).toHaveLength(1)
  })

  it('checks elapsed time even if the reset timer has not run', async () => {
    const wrapper = setup()
    await clearButton(wrapper).trigger('click')
    vi.setSystemTime(Date.now() + 3001)
    await clearButton(wrapper).trigger('click')
    expect(wrapper.emitted('restoreAll')).toBeUndefined()
  })

  it('cancels when the section closes, language changes, or collection changes', async () => {
    const wrapper = setup()
    await clearButton(wrapper).trigger('click')
    await wrapper.get('details').trigger('toggle')
    expect(clearButton(wrapper).text()).toBe('study.clearMastered')
    await clearButton(wrapper).trigger('click')
    await wrapper.setProps({ mode: 'tw', mastered: ['tw-3105'] })
    expect(wrapper.emitted('restoreAll')).toBeUndefined()
    await wrapper.setProps({ mode: 'ja', mastered: ['ja-hiragana-a'] })
    expect(clearButton(wrapper).text()).toBe('study.clearMastered')
    await clearButton(wrapper).trigger('click')
    await wrapper.setProps({ mastered: ['ja-hiragana-a', 'ja-hiragana-i'] })
    expect(clearButton(wrapper).text()).toBe('study.clearMastered')
  })

  it('prevents held keys from triggering the confirmation click', async () => {
    const wrapper = setup()
    await clearButton(wrapper).trigger('click')
    const repeat = new KeyboardEvent('keydown', { key: 'Enter', repeat: true, cancelable: true, bubbles: true })
    clearButton(wrapper).element.dispatchEvent(repeat)
    expect(repeat.defaultPrevented).toBe(true)
    expect(wrapper.emitted('restoreAll')).toBeUndefined()
  })
})
