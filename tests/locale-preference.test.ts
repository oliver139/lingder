import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import App from '../app/app.vue'

afterEach(() => {
  for (const name of ['useI18n', 'useRoute', 'useCookie', 'useLocaleHead', 'useHead', 'onNuxtReady']) {
    Reflect.deleteProperty(globalThis, name)
  }
})

function setup(path = '/', saved?: string, initialLocale = 'zh') {
  const route = ref({ path })
  const cookie = ref(saved)
  const locale = ref(initialLocale)
  let ready: () => void = vi.fn()
  const setLocale = vi.fn(async (value: string) => {
    locale.value = value
    route.value.path = `/${value}/`
  })
  vi.stubGlobal('useI18n', () => ({ locale, localeProperties: { nuxtUiCode: 'zh_tw' }, setLocale }))
  vi.stubGlobal('useRoute', () => route.value)
  vi.stubGlobal('useCookie', () => cookie)
  vi.stubGlobal('useLocaleHead', () => ref({ htmlAttrs: {}, link: [], meta: [] }))
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('onNuxtReady', (callback: () => void) => {
    ready = callback
  })
  const wrapper = mount(App, {
    global: { stubs: { UApp: { template: '<div><slot /></div>' }, NuxtLayout: true, NuxtPage: true, NuxtRouteAnnouncer: true } },
  })
  return { route, cookie, locale, setLocale, ready: () => ready(), wrapper }
}

describe('remembered interface language', () => {
  it.each([undefined, 'invalid', 'zh'])('defaults / to Chinese for preference %s', async (saved) => {
    const app = setup('/', saved)
    app.ready()
    await flushPromises()
    expect(app.locale.value).toBe('zh')
    expect(app.cookie.value).toBe('zh')
    expect(app.setLocale).not.toHaveBeenCalled()
  })

  it.each(['en', 'ja'])('restores %s at / only after Nuxt is ready', async (saved) => {
    const app = setup('/', saved)
    expect(app.setLocale).not.toHaveBeenCalled()
    app.ready()
    await flushPromises()
    expect(app.setLocale).toHaveBeenCalledWith(saved)
    expect(app.route.value.path).toBe(`/${saved}/`)
    expect(app.cookie.value).toBe(saved)
  })

  it.each(['/en/', '/zh/', '/ja/', '/en/table', '/ja'])('honors and remembers explicit URL %s', async (path) => {
    const app = setup(path, 'ja', path.split('/')[1])
    app.ready()
    await flushPromises()
    expect(app.cookie.value).toBe(path.split('/')[1])
    expect(app.setLocale).not.toHaveBeenCalled()
  })

  it('remembers language-switch navigation and restores it on a later root visit', async () => {
    const app = setup('/en/', 'zh', 'en')
    app.ready()
    await flushPromises()
    app.route.value.path = '/ja/table'
    app.locale.value = 'ja'
    await flushPromises()
    expect(app.cookie.value).toBe('ja')
    app.route.value.path = '/'
    app.locale.value = 'zh'
    await flushPromises()
    expect(app.setLocale).toHaveBeenCalledWith('ja')
    app.wrapper.unmount()
    app.route.value.path = '/en/'
    await flushPromises()
    expect(app.cookie.value).toBe('ja')
  })

  it('does not change a remembered language on the unprefixed table page', async () => {
    const app = setup('/table', 'en')
    app.ready()
    await flushPromises()
    expect(app.cookie.value).toBe('en')
    expect(app.setLocale).not.toHaveBeenCalled()
  })
})
