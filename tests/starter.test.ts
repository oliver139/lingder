import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DefaultLayout from '@/layouts/default.vue'
import IndexPage from '@/pages/index.vue'

describe('starter', () => {
  it('starts with an empty homepage', () => {
    const wrapper = mount(IndexPage)

    expect(wrapper.text()).toBe('')
    expect(wrapper.findAll('a, button, img')).toHaveLength(0)
  })

  it('renders page content inside the main landmark', () => {
    const wrapper = mount(DefaultLayout, {
      slots: {
        default: '<p>Page content</p>',
      },
    })

    expect(wrapper.get('main').text()).toBe('Page content')
  })
})
