import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import { defineComponent } from 'vue'
import DefaultLayout from '@/layouts/default.vue'

vi.stubGlobal('useLocalePath', () => (path: string) => path)

it('renders slotted content with working browser input and focus', async () => {
  await render(DefaultLayout, {
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        UHeader: defineComponent({ template: '<header><slot name="left" /><slot name="right" /></header>' }),
        UMain: defineComponent({ template: '<main><slot /></main>' }),
        UFooter: defineComponent({ template: '<footer><slot name="left" /><slot name="right" /></footer>' }),
        NuxtLink: true,
        ThemeToggler: true,
      },
    },
    slots: {
      default: '<label>Name<input name="name"></label>',
    },
  })

  const input = page.getByRole('main').getByRole('textbox', { name: 'Name' })

  await expect.element(input).toBeVisible()
  await input.fill('Template')
  await expect.element(input).toHaveValue('Template')
  await expect.element(input).toHaveFocus()
})
