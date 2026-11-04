import type { StudyMode } from '@/types/study'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { createMemoryHistory, createRouter, useRoute, useRouter } from 'vue-router'
import { useStudyModeQuery } from '@/composables/useStudyModeQuery'
import { useStudyPersistence } from '@/composables/useStudyPersistence'
import { useStudyStore } from '@/stores/study'
import { decodeStudy, STUDY_STORAGE_KEY } from '@/utils/study/persistence'

const Screen = defineComponent({
  setup() {
    const store = useStudyStore()
    const { storageWarning } = useStudyPersistence()
    useStudyModeQuery(store.setMode)
    return { store, storageWarning }
  },
  template: '<div><output>{{ store.saved.mode }}</output><button @click="store.setMode(\'ja\')">Japanese</button><button @click="store.setMode(\'tw\')">Zhuyin</button><p v-if="storageWarning">{{ storageWarning }}</p></div>',
})

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.stubGlobal('useStudyStore', useStudyStore)
  // Use the real router, supplying only Nuxt's auto-import boundary.
  vi.stubGlobal('useRoute', useRoute)
  vi.stubGlobal('useRouter', useRouter)
})
afterEach(() => vi.restoreAllMocks())

async function setup(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: Screen }],
  })
  await router.push('/table/')
  await router.push(url)
  const wrapper = mount(Screen, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router, store: useStudyStore() }
}

function remember(mode: StudyMode) {
  const store = useStudyStore()
  store.initialize(null)
  store.setMode(mode)
  localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(store.saved))
  setActivePinia(createPinia())
}

describe('shareable study mode', () => {
  it.each(['/', '/en/', '/zh-Hant/', '/zh-Hans/', '/ja/', '/table/', '/en/table/'])('remembers and removes the URL mode on %s', async (path) => {
    remember('ja')
    const { wrapper, router, store } = await setup(`${path}?mode=tw`)
    expect(wrapper.get('output').text()).toBe('tw')
    expect(store.current!.deck.mode).toBe('tw')
    expect(decodeStudy(localStorage.getItem(STUDY_STORAGE_KEY)!)?.mode).toBe('tw')
    expect(router.currentRoute.value.fullPath).toBe(path)
  })

  it.each([
    { path: '/en/', mode: 'ja' },
    { path: '/en/', mode: 'jp' },
    { path: '/ja/table/', mode: 'ja' },
    { path: '/ja/table/', mode: 'jp' },
  ])('accepts mode=$mode on $path and remembers Japanese using its canonical code', async ({ path, mode }) => {
    remember('tw')
    const { wrapper, router, store } = await setup(`${path}?mode=${mode}`)
    expect(wrapper.get('output').text()).toBe('ja')
    expect(store.current!.deck.mode).toBe('ja')
    expect(decodeStudy(localStorage.getItem(STUDY_STORAGE_KEY)!)?.mode).toBe('ja')
    expect(router.currentRoute.value.fullPath).toBe(path)
  })

  it.each(['', '?mode', '?mode=', '?mode=invalid', '?mode=JA', '?mode=ja&mode=tw', '?mode=ja&mode=ja', '?mode=jp&mode=ja'])('keeps the saved choice for missing or ambiguous mode %s', async (query) => {
    remember('tw')
    const { wrapper } = await setup(`/en/${query}`)
    expect(wrapper.get('output').text()).toBe('tw')
  })

  it('defaults to Japanese when neither storage nor the URL supplies a mode', async () => {
    const { wrapper } = await setup('/en/table/')
    expect(wrapper.get('output').text()).toBe('ja')
  })

  it('removes only mode without dropping the locale, other queries or hash, or adding history entries', async () => {
    const { wrapper, router } = await setup('/zh-Hans/table/?source=friend&mode=tw#pronunciation')
    expect(router.currentRoute.value.fullPath).toBe('/zh-Hans/table/?source=friend#pronunciation')
    expect(wrapper.get('output').text()).toBe('tw')
    expect(decodeStudy(localStorage.getItem(STUDY_STORAGE_KEY)!)?.mode).toBe('tw')
    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/table/'))
  })

  it('remembers switch changes without adding a query or navigating', async () => {
    const { wrapper, router } = await setup('/zh-Hans/table/?source=friend#pronunciation')
    const replace = vi.spyOn(router, 'replace')
    await wrapper.get('button:last-of-type').trigger('click')
    await flushPromises()
    expect(wrapper.get('output').text()).toBe('tw')
    expect(decodeStudy(localStorage.getItem(STUDY_STORAGE_KEY)!)?.mode).toBe('tw')
    expect(router.currentRoute.value.fullPath).toBe('/zh-Hans/table/?source=friend#pronunciation')
    expect(replace).not.toHaveBeenCalled()
  })

  it('consumes later shared links once so Back/Forward keeps the latest choice and progress', async () => {
    const { wrapper, router, store } = await setup('/en/?mode=ja&visit=first')
    store.rate(store.current!.id, 'mastered')
    store.setMode('tw')
    store.setSettings({ goal: 5 })
    while (store.current) store.rate(store.current.id, 'review')
    store.startExtra()
    store.rate(store.current!.id, 'mastered')
    store.setMode('ja')
    const progress = JSON.parse(JSON.stringify(store.saved.modes))

    await router.push({ query: { mode: 'tw', visit: 'second' } })
    await flushPromises()
    expect(wrapper.get('output').text()).toBe('tw')
    expect(router.currentRoute.value.query).toEqual({ visit: 'second' })
    expect(store.saved.modes).toEqual(progress)
    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ visit: 'first' }))
    expect(wrapper.get('output').text()).toBe('tw')
    router.forward()
    await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ visit: 'second' }))
    expect(wrapper.get('output').text()).toBe('tw')
    expect(store.saved.modes).toEqual(progress)
  })

  it('preserves Undo for unrelated queries and clears it only when changing the study mode', async () => {
    const { router, store } = await setup('/en/?mode=ja')
    store.rate(store.current!.id, 'mastered')
    const rating = store.lastRating
    await router.push({ query: { mode: 'ja', source: 'friend' } })
    await flushPromises()
    expect(store.lastRating).toBe(rating)
    expect(router.currentRoute.value.query).toEqual({ source: 'friend' })
    await router.push({ query: { mode: 'tw' } })
    await nextTick()
    expect(store.lastRating).toBeNull()
  })

  it('shares the selected mode across page mounts without reinitializing the session or Undo', async () => {
    const first = await setup('/en/?mode=tw')
    first.store.rate(first.store.current!.id, 'mastered')
    const saved = JSON.parse(JSON.stringify(first.store.saved))
    const rating = first.store.lastRating
    first.wrapper.unmount()

    const table = await setup('/en/table/')
    expect(table.wrapper.get('output').text()).toBe('tw')
    expect(table.store.saved).toEqual(saved)
    expect(table.store.lastRating).toBe(rating)
    await table.wrapper.get('button').trigger('click')
    await flushPromises()
    table.wrapper.unmount()

    const cards = await setup('/en/')
    expect(cards.wrapper.get('output').text()).toBe('ja')
    cards.wrapper.unmount()
    setActivePinia(createPinia())
    const reload = await setup('/en/table/')
    expect(reload.wrapper.get('output').text()).toBe('ja')
    expect(reload.store.saved.modes).toEqual(saved.modes)
  })

  it('honors a different URL mode when returning to an already initialized store', async () => {
    const first = await setup('/en/?mode=tw')
    first.wrapper.unmount()
    const second = await setup('/en/table/?mode=ja')
    expect(second.wrapper.get('output').text()).toBe('ja')
    expect(decodeStudy(localStorage.getItem(STUDY_STORAGE_KEY)!)?.mode).toBe('ja')
  })

  it('reloads a cleaned URL using the remembered choice, including a later manual switch', async () => {
    const first = await setup('/en/table/?mode=tw')
    const cleanUrl = first.router.currentRoute.value.fullPath
    expect(cleanUrl).toBe('/en/table/')
    first.wrapper.unmount()
    setActivePinia(createPinia())

    const reload = await setup(cleanUrl)
    expect(reload.wrapper.get('output').text()).toBe('tw')
    await reload.wrapper.get('button').trigger('click')
    reload.wrapper.unmount()
    setActivePinia(createPinia())

    const switched = await setup(cleanUrl)
    expect(switched.wrapper.get('output').text()).toBe('ja')
    expect(switched.router.currentRoute.value.query.mode).toBeUndefined()
  })

  it('keeps the final selection when the switches are clicked rapidly', async () => {
    const { wrapper, router } = await setup('/en/?mode=ja')
    wrapper.get('button:last-of-type').element.click()
    wrapper.get('button').element.click()
    await flushPromises()
    expect(wrapper.get('output').text()).toBe('ja')
    expect(router.currentRoute.value.query.mode).toBeUndefined()
  })

  it('stops reacting to URLs after leaving the page', async () => {
    const { wrapper, router, store } = await setup('/en/?mode=ja')
    wrapper.unmount()
    await router.push({ query: { mode: 'tw' } })
    expect(store.saved.mode).toBe('ja')
  })

  it('supports a shared link when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const { wrapper } = await setup('/en/table/?mode=tw')
    expect(wrapper.get('output').text()).toBe('tw')
    expect(wrapper.get('p').text()).toBe('unavailable')
  })
})
