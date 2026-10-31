import { expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { page } from 'vitest/browser'
import DefaultLayout from '@/layouts/default.vue'

it('renders slotted content with working browser input and focus', async () => {
  render(DefaultLayout, {
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
