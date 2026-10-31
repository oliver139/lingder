import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { toggleDark } from '@/utils/view-transition.client'

afterEach(() => {
  vi.restoreAllMocks()
})

function setup(options: { reduced?: boolean, supported?: boolean, dark?: boolean } = {}) {
  const mode = { preference: 'system', value: options.dark ? 'dark' : 'light' }
  const animate = vi.fn()
  vi.stubGlobal('useColorMode', () => mode)
  vi.stubGlobal('nextTick', nextTick)
  vi.stubGlobal('matchMedia', () => ({ matches: options.reduced ?? false }))
  Object.defineProperty(document.documentElement, 'animate', { configurable: true, value: animate })
  const start = vi.fn((callback: () => Promise<void>) => ({ ready: callback() }))
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: options.supported ? start : undefined })
  const button = document.createElement('button')
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ left: 10, right: 30, top: 20, bottom: 40 } as DOMRect)
  const event = new MouseEvent('click')
  Object.defineProperty(event, 'target', { value: button })
  return { mode, animate, start, event }
}

describe('theme transition', () => {
  it('toggles the resolved system theme when the transition API is absent', () => {
    const { mode, event } = setup({ dark: true })
    toggleDark(event)
    expect(mode.preference).toBe('light')
  })

  it('honors reduced motion without starting an animation', () => {
    const { mode, event, start } = setup({ reduced: true, supported: true })
    toggleDark(event)
    expect(mode.preference).toBe('dark')
    expect(start).not.toHaveBeenCalled()
  })

  it.each([true, false])('animates the correct pseudo-element when initially dark=%s', async (dark) => {
    const { mode, event, animate } = setup({ supported: true, dark })
    toggleDark(event)
    await nextTick()
    await nextTick()
    expect(mode.preference).toBe(dark ? 'light' : 'dark')
    expect(animate).toHaveBeenCalledWith({ clipPath: expect.any(Array) }, expect.objectContaining({
      duration: 400,
      pseudoElement: dark ? '::view-transition-new(root)' : '::view-transition-old(root)',
    }))
  })
})
