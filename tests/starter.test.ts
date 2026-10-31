import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import DefaultLayout from '@/layouts/default.vue'

vi.stubGlobal('useRoute', () => ({ name: 'index___en' }))
vi.stubGlobal('useRouteBaseName', () => () => 'index')

describe('starter', () => {
  it('renders page content inside the main landmark', () => {
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
  })
})
