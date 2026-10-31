import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DefaultLayout from '@/layouts/default.vue'

describe('starter', () => {
  it('renders page content inside the main landmark', () => {
    const wrapper = mount(DefaultLayout, {
      slots: {
        default: '<p>Page content</p>',
      },
    })

    expect(wrapper.get('main').text()).toBe('Page content')
  })
})
