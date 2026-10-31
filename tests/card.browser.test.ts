import { afterEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import StudyCard from '@/components/study/StudyCard.vue'
import { useCardGesture } from '@/composables/useCardGesture'
import { studyDecks } from '@/data/decks'

vi.stubGlobal('useCardGesture', useCardGesture)
afterEach(() => vi.clearAllMocks())

async function setup() {
  const rate = vi.fn()
  const deck = studyDecks[0]!
  const screen = await render(StudyCard, {
    props: { card: deck.cards[0]!, deck, readingDisplay: 'reveal', onRate: rate },
    global: { mocks: { $t: (key: string) => key } },
  })
  return { rate, screen, card: page.getByRole('button') }
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
  const element = card.element()
  // Synthetic pointers have no active browser capture; capture itself is exercised by real mouse below.
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  pointer(element, 'pointerdown', 150, 150)
  pointer(element, 'pointermove', 150 + x, 150 + y)
  pointer(element, 'pointerup', 150 + x, 150 + y)
  pointer(element, 'pointerup', 150 + x, 150 + y)
  await expect.poll(() => rate.mock.calls).toEqual([['ja-hiragana-a', rating]])
})

it('returns short and cancelled drags without rating or revealing', async () => {
  const { card, rate } = await setup()
  const element = card.element()
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
  await expect.poll(() => rate.mock.calls).toEqual([['ja-hiragana-a', 'review']])
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
  await expect.poll(() => rate.mock.calls).toEqual([['ja-hiragana-a', rating]])
  await expect.element(card).toHaveFocus()
})

it('ignores secondary pointers, lost capture, held keys and detached elements', async () => {
  const { card, rate, screen } = await setup()
  const element = card.element()
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
  const element = card.element() as HTMLElement
  const next = document.querySelector(`[data-card-id="${deck.cards[1]!.id}"]`)!
  vi.spyOn(element, 'setPointerCapture').mockImplementation(() => undefined)
  element.focus()
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
  await expect.poll(() => rate.mock.calls).toEqual([['ja-hiragana-a', 'review']])
  const finalTransform = new DOMMatrix(getComputedStyle(element).transform)
  expect(finalTransform.m41).toBeGreaterThan(window.innerWidth)
  expect(Number(getComputedStyle(element).opacity)).toBe(0)

  await screen.rerender({ card: deck.cards[1]!, upcoming: deck.cards.slice(2, 4).map(card => ({ ...card, deck })) })
  expect(card.element()).toBe(next)
  await expect.element(card).toHaveFocus()
  expect(document.querySelector(`[data-card-id="${deck.cards[0]!.id}"]`)).toBeNull()
  expect(document.querySelector(`[data-card-id="${deck.cards[3]!.id}"]`)).not.toBeNull()
  expect(document.querySelectorAll('[data-card-id]')).toHaveLength(3)
  expect(card.element().getAttribute('aria-describedby')).toBe('card-help card-reading')
})

it('cancels a pending rating when the deck changes', async () => {
  const { card, screen, rate } = await setup()
  card.element().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
  const animation = card.element().getAnimations()[0]!
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
    expect(rate).toHaveBeenCalledExactlyOnceWith('ja-hiragana-a', 'mastered')
    expect(card.element().getAnimations()).toHaveLength(0)
  } finally {
    media.mockRestore()
  }
})

it.each(['left', 'right', 'up', 'down'])('fades while dragging toward the %s edge and preserves transparency on release', async (direction) => {
  const { card, rate } = await setup()
  const element = card.element() as HTMLElement
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
