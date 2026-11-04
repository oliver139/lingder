import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import { defineComponent } from 'vue'
import MasteredCollection from '@/components/study/MasteredCollection.vue'
import ModeSelector from '@/components/study/ModeSelector.vue'
import RatingControls from '@/components/study/RatingControls.vue'
import StudyCard from '@/components/study/StudyCard.vue'
import StudyComplete from '@/components/study/StudyComplete.vue'
import StudySettings from '@/components/study/StudySettings.vue'
import { useCardGesture } from '@/composables/useCardGesture'
import { usePronunciationAudio } from '@/composables/usePronunciationAudio'
import { useStudyModeQuery } from '@/composables/useStudyModeQuery'
import { useStudyPersistence } from '@/composables/useStudyPersistence'
import { studyDecks } from '@/data/decks'
import en from '@/i18n/locales/en.json'
import IndexPage from '@/pages/index.vue'
import { useStudyStore } from '@/stores/study'
import { STUDY_STORAGE_KEY } from '@/utils/study/persistence'
import { initialStudy, localDay } from '@/utils/study/session'

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
  vi.stubGlobal('useStudyModeQuery', useStudyModeQuery)
  vi.stubGlobal('useRoute', () => ({ path: '/en/', query: {}, hash: '' }))
  vi.stubGlobal('useRouter', () => ({ replace: vi.fn() }))
  vi.stubGlobal('useCardGesture', useCardGesture)
  vi.stubGlobal('usePronunciationAudio', usePronunciationAudio)
  vi.stubGlobal('useI18n', () => ({ t }))
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
})
afterEach(() => vi.restoreAllMocks())

async function setup(completed = false, exhausted = false, returning = false) {
  const saved = initialStudy()
  saved.modes.ja.settings.goal = 5
  saved.modes.ja.session.day = localDay()
  saved.modes.tw.session.day = localDay()
  if (completed) saved.modes.ja.session.completed = studyDecks[0]!.cards.slice(0, 5).map(card => card.id)
  if (exhausted) saved.modes.ja.mastered = studyDecks.filter(deck => deck.mode === 'ja').flatMap(deck => deck.cards.map(card => card.id))
  if (returning) {
    useStudyStore().initialize(saved)
  }
  localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(saved))
  await render(IndexPage, {
    global: {
      mocks: { $t: t },
      components: { StudyCard, StudyComplete, RatingControls, ModeSelector, StudySettings, MasteredCollection },
      stubs: {
        UIcon: true,
        UButton: defineComponent({ props: ['disabled', 'icon', 'color', 'variant', 'size'], template: '<button :disabled="disabled"><slot /></button>' }),
      },
    },
  })
  return useStudyStore()
}

it.each(['{Enter}', ' '])('focuses the initial card, then Extra practice, and starts a new focused deck with %s', async (activation) => {
  const store = await setup()
  const card = page.getByRole('button', { name: /card: / })
  await expect.element(card).toHaveFocus()

  for (let remaining = 5; remaining > 0; remaining--) {
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(() => store.progress.session.queue.length, { timeout: 2000 }).toBe(remaining - 1)
    if (remaining > 1) await expect.element(card).toHaveFocus()
  }

  const practice = page.getByRole('button', { name: 'Extra practice', exact: true })
  await expect.element(practice).toHaveFocus()
  await userEvent.keyboard(activation)
  await expect.poll(() => store.progress.session.extra).toBe(true)
  await expect.element(card).toHaveFocus()
  const remaining = store.progress.session.queue.length
  await userEvent.keyboard('{ArrowRight}')
  await expect.poll(() => store.progress.session.queue.length, { timeout: 2000 }).toBe(remaining - 1)
  await expect.element(card).toHaveFocus()
})

it('focuses Extra practice when reopening a completed daily session', async () => {
  await setup(true)
  await expect.element(page.getByRole('button', { name: 'Extra practice', exact: true })).toHaveFocus()
})

it('focuses the requested Zhuyin card after overriding saved Japanese mode', async () => {
  vi.stubGlobal('useRoute', () => ({ path: '/en/', query: { mode: 'tw' }, hash: '' }))
  const store = await setup()
  expect(store.saved.mode).toBe('tw')
  await expect.element(page.getByRole('button', { name: /card: / })).toHaveFocus()
  await expect.element(page.getByRole('button', { name: /Taiwan Zhuyin/, pressed: true })).toBeVisible()
})

it('focuses the completion message when every card is mastered', async () => {
  await setup(true, true)
  await expect.element(page.getByRole('button', { name: 'Extra practice', exact: true })).not.toBeInTheDocument()
  await expect.poll(() => document.activeElement?.classList.contains('completion')).toBe(true)
})

it('focuses the card when returning to an already initialized study session', async () => {
  await setup(false, false, true)
  await expect.element(page.getByRole('button', { name: /card: / })).toHaveFocus()
})

it('keeps focus on settings when changing reading presentation', async () => {
  const store = await setup()
  await page.getByText('Make it yours', { exact: true }).click()
  const input = document.querySelector<HTMLInputElement>('input[name="reading"]')!
  input.focus()
  store.setSettings({ reading: 'reveal' })
  await expect.poll(() => document.activeElement === input).toBe(true)
})
