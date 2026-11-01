import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import DefaultLayout from '@/layouts/default.vue'

const navigateTo = vi.fn()
vi.stubGlobal('navigateTo', navigateTo)
vi.stubGlobal('useI18n', () => ({ locale: 'en', locales: [{ code: 'zh-Hant', name: '繁體中文' }, { code: 'zh-Hans', name: '簡体中文' }, { code: 'en', name: 'English' }, { code: 'ja', name: '日本語' }] }))
vi.stubGlobal('useRoute', () => ({ name: 'index___en' }))
vi.stubGlobal('useRouteBaseName', () => () => 'index')

describe('starter', () => {
  it.each([
    ['/?from=menu#top', '/zh-Hant/?from=menu#top'],
    ['/table?from=menu#top', '/zh-Hant/table?from=menu#top'],
    ['/zh-Hant/table?from=menu#top', '/zh-Hant/table?from=menu#top'],
  ])('renders the layout and selects Traditional Chinese explicitly from %s', (defaultPath, expectedPath) => {
    vi.stubGlobal('useSwitchLocalePath', () => (code: string) => code === 'zh-Hant' ? defaultPath : `/${code}/?from=menu#top`)
    const wrapper = mount(DefaultLayout, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: {
          UHeader: defineComponent({ template: '<header><slot name="left" /><slot name="right" /></header>' }),
          UMain: defineComponent({ template: '<main><slot /></main>' }),
          UFooter: defineComponent({ template: '<footer><slot name="left" /><slot name="right" /></footer>' }),
          NuxtLinkLocale: true,
          ThemeToggler: true,
          AudioCredits: true,
          USelect: defineComponent({ name: 'USelect', props: ['items', 'modelValue', 'labelKey', 'valueKey'], emits: ['update:modelValue'], template: '<div />' }),
        },
      },
      slots: {
        default: '<p>Page content</p>',
      },
    })

    expect(wrapper.get('main').text()).toBe('Page content')
    expect(wrapper.findAll('main')).toHaveLength(1)
    expect(wrapper.find('main header, main footer').exists()).toBe(false)
    expect(wrapper.get('header').exists()).toBe(true)
    expect(wrapper.get('footer').exists()).toBe(true)
    const selector = wrapper.getComponent({ name: 'USelect' })
    expect(selector.props('items')).toEqual([
      { code: 'zh-Hant', name: '繁體中文' },
      { code: 'zh-Hans', name: '簡体中文' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' },
    ])
    expect(selector.props('labelKey')).toBe('name')
    expect(selector.props('valueKey')).toBe('code')
    selector.vm.$emit('update:modelValue', 'zh-Hans')
    expect(navigateTo).toHaveBeenCalledWith('/zh-Hans/?from=menu#top')
    selector.vm.$emit('update:modelValue', 'zh-Hant')
    expect(navigateTo).toHaveBeenLastCalledWith(expectedPath)
  })
})
