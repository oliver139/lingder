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
  expect(rate).toHaveBeenCalledExactlyOnceWith('ja-hiragana-a', rating)
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
  await expect.element(page.getByText('study.tapReveal')).toBeVisible()
  expect(rate).not.toHaveBeenCalled()
  expect((element as HTMLElement).style.transform).toBe('translate(0px, 0px) rotate(0deg)')
})

it('supports focus, Space/Enter reveal, arrow keys and prevents held-key duplicate ratings', async () => {
  const { card, rate } = await setup()
  await userEvent.tab()
  await expect.element(card).toHaveFocus()
  await userEvent.keyboard(' ')
  await expect.element(page.getByText('a', { exact: true })).toBeVisible()
  await userEvent.keyboard('{ArrowRight}')
  await userEvent.keyboard('{ArrowUp}')
  expect(rate).toHaveBeenCalledExactlyOnceWith('ja-hiragana-a', 'review')
})

it('reveals with a real pointer click and resets reading for the next card', async () => {
  const { card, screen } = await setup()
  await card.click()
  await expect.element(page.getByText('a', { exact: true })).toBeVisible()
  await screen.rerender({ card: studyDecks[0]!.cards[1]! })
  await expect.element(page.getByText('study.tapReveal')).toBeVisible()
  await userEvent.keyboard('{Enter}')
  await expect.element(page.getByText('i', { exact: true })).toBeVisible()
})
