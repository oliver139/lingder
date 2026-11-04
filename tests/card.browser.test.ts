import { afterEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import { defineComponent, nextTick, shallowRef } from 'vue'
import StudyCard from '@/components/study/StudyCard.vue'
import { useCardGesture } from '@/composables/useCardGesture'
import { usePronunciationAudio } from '@/composables/usePronunciationAudio'
import { pronunciationByCard } from '@/data/audio'
import { studyDecks } from '@/data/decks'

vi.stubGlobal('useCardGesture', useCardGesture)
vi.stubGlobal('usePronunciationAudio', usePronunciationAudio)
afterEach(() => vi.restoreAllMocks())

async function setup() {
  const rate = vi.fn()
  const deck = studyDecks[0]!
  const screen = await render(StudyCard, {
    props: { card: deck.cards[0]!, deck, readingDisplay: 'reveal', onRate: rate },
    global: { mocks: { $t: (key: string) => key }, components: { UButton: defineComponent({ props: ['disabled', 'loading'], template: '<button :disabled="disabled || loading"><slot /></button>' }) } },
  })
  return { rate, screen, card: page.getByRole('button', { name: 'study.cardLabel', exact: true }) }
}

function pointer(element: Element, type: string, x: number, y: number, id = 1) {
  element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, isPrimary: true, button: 0, clientX: x, clientY: y }))
}

it.each([
  [-110, 0, 'review'],
  [110, 0, 'review'],
  [0, -110, 'mastered'],
  [0, 110, 'mastered'],
] as const)('rates a swipe (%i, %i) once as %s', async (x, y, rating) => {
  const { card, rate } = await setup()
  const element = card.element().parentElement!
  // Synthetic pointers have no active browser capture; capture itself is exercised by real mouse below.
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 150 + x, 150 + y)
  pointer(element, 'pointerup', 150 + x, 150 + y)
  pointer(element, 'pointerup', 150 + x, 150 + y)
  await expect.poll(() => rate.mock.calls.map(call => call.slice(0, 2))).toEqual([['ja-hiragana-a', rating]])
})

it('returns short and cancelled drags without rating or revealing', async () => {
  const { card, rate } = await setup()
  const element = card.element().parentElement!
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 170, 150)
  pointer(element, 'pointerup', 170, 150)
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 270, 150)
  pointer(element, 'pointercancel', 270, 150)
  pointer(element, 'pointerup', 270, 150)
  await expect.element(card).toHaveAccessibleDescription('study.tapReveal')
  expect(rate).not.toHaveBeenCalled()
  expect((element as HTMLElement).style.transform).toBe('translate(0px, 0px) rotate(0deg)')
  expect((element as HTMLElement).style.opacity).toBe('1')
})

it('supports focus, Space/Enter reveal, arrow keys and prevents held-key duplicate ratings', async () => {
  const { card, rate } = await setup()
  await userEvent.tab()
  await expect.element(card).toHaveFocus()
  await userEvent.keyboard(' ')
  await expect.element(page.getByText('a', { exact: true })).toBeVisible()
  await userEvent.keyboard('{ArrowRight}')
  await userEvent.keyboard('{ArrowUp}')
  await expect.poll(() => rate.mock.calls.map(call => call.slice(0, 2))).toEqual([['ja-hiragana-a', 'review']])
})

it('shows the card ring only for Tab navigation and hides it when rating with arrows', async () => {
  const { card, screen } = await setup()
  const element = card.element() as HTMLElement
  element.focus()
  await expect.element(card).toHaveAttribute('data-keyboard-focus', 'false')
  await userEvent.keyboard(' ')
  await userEvent.tab()
  await userEvent.tab({ shift: true })
  await expect.element(card).toHaveFocus()
  await expect.element(card).toHaveAttribute('data-keyboard-focus', 'true')
  await userEvent.keyboard(' ')
  await expect.element(card).toHaveAttribute('data-keyboard-focus', 'true')
  await userEvent.keyboard('{ArrowRight}')
  await expect.element(card).toHaveAttribute('data-keyboard-focus', 'false')

  await screen.rerender({ card: studyDecks[0]!.cards[1]! })
  await expect.element(card).toHaveFocus()
  await expect.element(card).toHaveAttribute('data-keyboard-focus', 'false')
  // Reveal the speaker so Tab can leave the card and Shift+Tab can return to it.
  await userEvent.keyboard(' ')
  await userEvent.tab()
  await userEvent.tab({ shift: true })
  await expect.element(card).toHaveFocus()
  await expect.element(card).toHaveAttribute('data-keyboard-focus', 'true')
  await card.click()
  await expect.element(card).toHaveAttribute('data-keyboard-focus', 'false')
})

it('reveals with a real pointer click and resets reading for the next card', async () => {
  const { card, screen } = await setup()
  await card.click()
  await expect.element(page.getByText('a', { exact: true })).toBeVisible()
  await screen.rerender({ card: studyDecks[0]!.cards[1]! })
  await expect.element(card).toHaveAccessibleDescription('study.tapReveal')
  await userEvent.keyboard('{Enter}')
  await expect.element(page.getByText('i', { exact: true })).toBeVisible()
})

it.each([
  ['ArrowLeft', 'review'],
  ['ArrowRight', 'review'],
  ['ArrowUp', 'mastered'],
  ['ArrowDown', 'mastered'],
] as const)('maps %s to %s while keeping the card focused', async (key, rating) => {
  const { card, rate } = await setup()
  await card.click()
  await userEvent.keyboard(`{${key}}`)
  await expect.poll(() => rate.mock.calls.map(call => call.slice(0, 2))).toEqual([['ja-hiragana-a', rating]])
  await expect.element(card).toHaveFocus()
})

it('keeps focus and swipe controls as the stack shrinks to two cards and then one', async () => {
  const { screen, card, rate } = await setup()
  const deck = studyDecks[0]!
  await screen.rerender({ upcoming: deck.cards.slice(1, 3).map(card => ({ ...card, deck })) })
  ;(card.element() as HTMLElement).focus()

  for (const index of [1, 2]) {
    await screen.rerender({
      card: deck.cards[index]!,
      upcoming: deck.cards.slice(index + 1, 3).map(card => ({ ...card, deck })),
    })
    await expect.element(card).toHaveFocus()
  }

  const element = card.element().parentElement!
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 260, 150)
  pointer(element, 'pointerup', 260, 150)
  await expect.poll(() => rate.mock.calls.map(call => call.slice(0, 2))).toEqual([[deck.cards[2]!.id, 'review']])
})

it('ignores secondary pointers, lost capture, held keys and detached elements', async () => {
  const { card, rate, screen } = await setup()
  const element = card.element().parentElement!
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 5, isPrimary: false, button: 0 }))
  pointer(element, 'pointerup', 150, 0, 5)
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 270, 150, 2)
  pointer(element, 'lostpointercapture', 150, 150)
  pointer(element, 'pointerup', 270, 150)
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', repeat: true, bubbles: true }))
  expect(rate).not.toHaveBeenCalled()
  await screen.unmount()
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointerup', 270, 150)
  expect(rate).not.toHaveBeenCalled()
})

it('exposes the revealed reading as an accessible description', async () => {
  const { card } = await setup()
  await expect.element(card).toHaveAccessibleDescription('study.tapReveal')
  const reading = card.element().querySelector('#card-reading > span')!
  expect(reading.textContent).toBe('a')
  expect(reading.getAttribute('aria-hidden')).toBe('true')
  await card.click()
  await expect.element(card).toHaveAccessibleDescription('a')
  expect(reading.getAttribute('aria-hidden')).toBe('false')
})

it('continues from the release position, fades offscreen, and promotes the existing next card', async () => {
  const { screen, card, rate } = await setup()
  const deck = studyDecks[0]!
  await screen.rerender({ upcoming: deck.cards.slice(1, 3).map(card => ({ ...card, deck })) })
  const element = card.element().parentElement! as HTMLElement
  const next = document.querySelector(`[data-card-id="${deck.cards[1]!.id}"]`)!
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  ;(card.element() as HTMLElement).focus()
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 260, 170)
  pointer(element, 'pointerup', 260, 170)
  const animation = element.getAnimations()[0]!
  animation.pause()
  animation.currentTime = 0
  expect(rate).not.toHaveBeenCalled()
  const frames = (animation.effect as KeyframeEffect).getKeyframes()
  expect(frames[0]!.transform).toBe('translate(110px, 20px) rotate(4.4deg)')
  animation.currentTime = 36
  const earlyTransform = new DOMMatrix(getComputedStyle(element).transform)
  const exitX = Number(/translate\(([^p]+)px/.exec(String(frames.at(-1)!.transform))![1])
  // The first tenth of the exit travels a tenth of the distance: no ease-in pause.
  expect(earlyTransform.m41 - 110).toBeCloseTo((exitX - 110) * 0.1, 2)
  expect(Number(getComputedStyle(element).opacity)).toBeLessThanOrEqual(Number(frames[0]!.opacity))
  animation.currentTime = 300
  expect(Number(getComputedStyle(element).opacity)).toBeLessThan(1)
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointerup', 150, 280)
  expect(rate).not.toHaveBeenCalled()
  animation.finish()
  await expect.poll(() => rate.mock.calls.map(call => call.slice(0, 2))).toEqual([['ja-hiragana-a', 'review']])
  const finalTransform = new DOMMatrix(getComputedStyle(element).transform)
  expect(finalTransform.m41).toBeGreaterThan(window.innerWidth)
  expect(Number(getComputedStyle(element).opacity)).toBe(0)

  await screen.rerender({ card: deck.cards[1]!, upcoming: deck.cards.slice(2, 4).map(card => ({ ...card, deck })) })
  expect(card.element().parentElement).toBe(next)
  await expect.element(card).toHaveFocus()
  expect(document.querySelector(`[data-card-id="${deck.cards[0]!.id}"]`)).toBeNull()
  expect(document.querySelector(`[data-card-id="${deck.cards[3]!.id}"]`)).not.toBeNull()
  expect(document.querySelectorAll('[data-card-id]')).toHaveLength(3)
  expect(card.element().getAttribute('aria-describedby')).toBe('card-help card-reading')
})

it('cancels a pending rating when the deck changes', async () => {
  const { card, screen, rate } = await setup()
  card.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  const animation = card.element().parentElement!.getAnimations()[0]!
  animation.pause()
  const deck = studyDecks[2]!
  await screen.rerender({ card: deck.cards[0]!, deck })
  expect(animation.playState).toBe('idle')
  expect(rate).not.toHaveBeenCalled()
  expect(card.element().getAttribute('aria-disabled')).toBe('false')
})

it('rates immediately without animation when reduced motion is preferred', async () => {
  const media = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
  try {
    const { card, rate } = await setup()
    card.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    expect(rate).toHaveBeenCalledExactlyOnceWith('ja-hiragana-a', 'mastered', undefined)
    expect(card.element().parentElement!.getAnimations()).toHaveLength(0)
  } finally {
    media.mockRestore()
  }
})

it.each(['left', 'right', 'up', 'down'])('fades while dragging toward the %s edge and preserves transparency on release', async (direction) => {
  const { card, rate } = await setup()
  const element = card.element().parentElement! as HTMLElement
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  // Standalone tests do not load the app's Tailwind sizing utilities.
  element.style.height = '450px'
  const bounds = element.parentElement!.parentElement!.getBoundingClientRect()
  const horizontal = direction === 'left' || direction === 'right'
  const sign = direction === 'left' || direction === 'up' ? -1 : 1
  const size = horizontal ? bounds.width : bounds.height
  const viewport = horizontal ? window.innerWidth : window.innerHeight
  const center = horizontal ? bounds.left + size / 2 : bounds.top + size / 2
  const edge = sign < 0 ? center : viewport - center
  const start = Math.max(0, edge - viewport * 0.3)
  const fadeDistance = edge + size / 2 - start
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 150 + (horizontal ? sign * start : 0), 150 + (horizontal ? 0 : sign * start))
  await expect.poll(() => Number(element.style.opacity)).toBe(1)
  const halfway = sign * (start + fadeDistance / 2)
  pointer(element, 'pointermove', 150 + (horizontal ? halfway : 0), 150 + (horizontal ? 0 : halfway))
  await expect.poll(() => Number(element.style.opacity)).toBeCloseTo(0.5, 2)
  const nearExit = sign * (start + fadeDistance * 0.9)
  pointer(element, 'pointermove', 150 + (horizontal ? nearExit : 0), 150 + (horizontal ? 0 : nearExit))
  await expect.poll(() => Number(element.style.opacity)).toBeCloseTo(0.1, 2)
  pointer(element, 'pointerup', 150 + (horizontal ? nearExit : 0), 150 + (horizontal ? 0 : nearExit))
  const animation = element.getAnimations()[0]!
  animation.pause()
  animation.currentTime = 0
  expect(Number(getComputedStyle(element).opacity)).toBeCloseTo(0.1, 2)
  expect(rate).not.toHaveBeenCalled()
})

it('prevents native selection dragging from taking over a card swipe', async () => {
  const { card, rate } = await setup()
  const element = card.element().parentElement!
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  const selection = window.getSelection()!
  selection.selectAllChildren(document.body)
  const selectedText = selection.toString()
  try {
    pointer(element, 'pointerdown', 150, 150)
    const drag = new Event('dragstart', { bubbles: true, cancelable: true })
    element.querySelector('.card-character')!.dispatchEvent(drag)
    expect(drag.defaultPrevented).toBe(true)
    expect(selection.toString()).toBe(selectedText)
    pointer(element, 'pointermove', 260, 150)
    pointer(element, 'pointerup', 260, 150)
    await expect.poll(() => rate.mock.calls.map(call => call.slice(0, 2))).toEqual([['ja-hiragana-a', 'review']])
  } finally {
    selection.removeAllRanges()
  }
})

it.each([
  { completed: false, reduced: false },
  { completed: true, reduced: false },
  { completed: false, reduced: true },
  { completed: true, reduced: true },
])('returns an undone card (completed: $completed, reduced motion: $reduced)', async ({ completed, reduced }) => {
  const matchMedia = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ ...matchMedia(query), matches: reduced }))
  const deck = studyDecks[0]!
  const fixture = defineComponent({
    components: { StudyCard },
    setup() {
      const index = shallowRef<number | null>(completed ? null : 1)
      const stack = shallowRef<InstanceType<typeof StudyCard> | null>(null)
      const busy = shallowRef(false)
      async function undo() {
        index.value = 0
        await nextTick()
        stack.value?.returnCard({ x: -1200, y: 0 })
      }
      return { deck, index, stack, busy, undo }
    },
    template: '<StudyCard v-if="index !== null" ref="stack" :card="deck.cards[index]" :deck="deck" :upcoming="deck.cards.slice(index + 1, index + 3).map(card => ({ ...card, deck }))" reading-display="visible" @busy="busy = $event" /><button :disabled="busy" @click="undo">Undo</button>',
  })
  await render(fixture, { global: { mocks: { $t: (key: string) => key }, components: { UButton: defineComponent({ props: ['disabled', 'loading'], template: '<button :disabled="disabled || loading"><slot /></button>' }) } } })
  const next = document.querySelector(`[data-card-id="${deck.cards[1]!.id}"]`)
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  const restored = document.querySelector(`[data-card-id="${deck.cards[0]!.id}"]`) as HTMLElement
  const animation = restored.getAnimations().find(animation => animation.effect?.getTiming().duration === 300)!
  if (reduced) {
    expect(animation).toBeUndefined()
    expect(restored.querySelector('[data-card-surface]')!.getAttribute('aria-disabled')).toBe('false')
    expect(new DOMMatrix(getComputedStyle(restored).transform).m41).toBe(0)
    return
  }
  animation.pause()
  animation.currentTime = 0
  expect(new DOMMatrix(getComputedStyle(restored).transform).m41).toBe(-1200)
  expect(Number(getComputedStyle(restored).opacity)).toBe(0)
  expect(restored.querySelector('[data-card-surface]')!.getAttribute('aria-disabled')).toBe('true')
  if (next) {
    expect(document.querySelector(`[data-card-id="${deck.cards[1]!.id}"]`)).toBe(next)
  }
  animation.currentTime = 250
  expect(new DOMMatrix(getComputedStyle(restored).transform).m41).toBeGreaterThan(-1200)
  animation.finish()
  await expect.element(page.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled()
  expect(new DOMMatrix(getComputedStyle(restored).transform).m41).toBe(0)
  expect(Number(getComputedStyle(restored).opacity)).toBe(1)
})

it('shows pronunciation only after reveal without capturing, revealing, or rating from the speaker', async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
  const { card, rate, screen } = await setup()
  const wrapper = card.element().parentElement!
  const capture = vi.spyOn(wrapper, 'setPointerCapture').mockImplementation(() => undefined)
  await expect.element(page.getByRole('button', { name: 'study.audio.play' })).not.toBeInTheDocument()
  expect(play).not.toHaveBeenCalled()
  await card.click()
  capture.mockClear()
  const speaker = page.getByRole('button', { name: 'study.audio.play' })
  expect(speaker.element().closest('[role="button"]')).toBeNull()
  await speaker.click()
  expect(play).toHaveBeenCalledTimes(1)
  expect(capture).not.toHaveBeenCalled()
  expect(rate).not.toHaveBeenCalled()
  ;(speaker.element() as HTMLButtonElement).focus()
  await userEvent.keyboard('{Enter}')
  expect(play).toHaveBeenCalledTimes(2)
  expect(rate).not.toHaveBeenCalled()
  await screen.rerender({ card: studyDecks[0]!.cards[1]! })
  await expect.element(page.getByRole('button', { name: 'study.audio.play' })).not.toBeInTheDocument()
})

it('stops audio when dragging or hiding the reading, and when the card changes', async () => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
  const { card, screen } = await setup()
  await screen.rerender({ readingDisplay: 'visible' })
  const speaker = page.getByRole('button', { name: 'study.audio.play' })
  await speaker.click()
  const wrapper = card.element().parentElement!
  vi.spyOn(wrapper, 'setPointerCapture').mockImplementation(() => undefined)
  pause.mockClear()
  pointer(wrapper, 'pointerdown', 150, 150)
  expect(pause).toHaveBeenCalledOnce()
  pointer(wrapper, 'pointercancel', 150, 150)
  await speaker.click()
  pause.mockClear()
  await screen.rerender({ readingDisplay: 'reveal' })
  expect(pause).toHaveBeenCalled()
  await expect.element(page.getByRole('button', { name: 'study.audio.play' })).not.toBeInTheDocument()
  await screen.rerender({ readingDisplay: 'visible' })
  await speaker.click()
  pause.mockClear()
  await screen.rerender({ card: studyDecks[0]!.cards[1]! })
  expect(pause).toHaveBeenCalled()
})

it('preloads only the active card, retains it while hidden, and loads promoted and undone cards', async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
  const { screen } = await setup()
  const deck = studyDecks[0]!
  const audio = load.mock.contexts[0]!
  expect(audio.src).toContain(pronunciationByCard[deck.cards[0]!.id]!.src)
  expect(audio.preload).toBe('auto')
  expect(load).toHaveBeenCalledOnce()
  expect(play).not.toHaveBeenCalled()
  await screen.rerender({ upcoming: [{ ...deck.cards[1]!, deck }], readingDisplay: 'visible' })
  expect(load).toHaveBeenCalledOnce()
  await page.getByRole('button', { name: 'study.audio.play' }).click()
  expect(load).toHaveBeenCalledOnce()
  await screen.rerender({ card: deck.cards[1]! })
  expect(audio.src).toContain(pronunciationByCard[deck.cards[1]!.id]!.src)
  await screen.rerender({ card: deck.cards[0]!, readingDisplay: 'reveal' })
  expect(audio.src).toContain(pronunciationByCard[deck.cards[0]!.id]!.src)
  expect(new Set(load.mock.contexts).size).toBe(1)
  expect(play).toHaveBeenCalledOnce()
})
