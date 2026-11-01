import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import AppSeo from '@/components/AppSeo.vue'
import en from '@/i18n/locales/en.json'
import ja from '@/i18n/locales/ja.json'

afterEach(() => vi.unstubAllGlobals())

describe('localized page metadata', () => {
  it('updates titles, descriptions and images when the page or language changes', () => {
    const locale = ref<'en' | 'ja'>('en')
    const page = ref('index')
    const messages = { en, ja }
    const seo = vi.fn()
    vi.stubGlobal('useI18n', () => ({
      locale,
      t: (key: string) => key.split('.').reduce((value, part) => (value as Record<string, unknown>)[part], messages[locale.value] as unknown),
    }))
    vi.stubGlobal('useRoute', () => ({}))
    vi.stubGlobal('useRouteBaseName', () => () => page.value)
    vi.stubGlobal('useSiteConfig', () => ({ url: 'https://lingder.olimak.dev', name: 'Lingder' }))
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { siteDescription: '', siteImage: '' } }))
    vi.stubGlobal('useHead', vi.fn())
    vi.stubGlobal('useSeoMeta', seo)
    vi.stubGlobal('useSchemaOrg', vi.fn())
    const wrapper = mount(AppSeo)
    const meta = seo.mock.calls[0]![0]
    expect(meta.title()).toBe(`${en.seo.cards.title} | Lingder`)
    expect(meta.description()).toBe(en.seo.cards.description)
    expect(meta.ogImage()).toBe('https://lingder.olimak.dev/og/en.jpg')
    page.value = 'table'
    locale.value = 'ja'
    expect(meta.title()).toBe(`${ja.seo.table.title} | Lingder`)
    expect(meta.description()).toBe(ja.seo.table.description)
    expect(meta.ogImage()).toBe('https://lingder.olimak.dev/og/ja.jpg')
    expect(meta.ogImageAlt()).toBe(ja.seo.imageAlt)
    wrapper.unmount()
  })
})
