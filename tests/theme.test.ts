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
  const start = vi.fn<(callback: () => Promise<void>) => void>()
  Object.defineProperty(document, 'startViewTransition', { configurable: true, value: options.supported ? start : undefined })
  return { mode, animate, start }
}

describe('theme transition', () => {
  it('toggles the resolved system theme when the transition API is absent', () => {
    const { mode } = setup({ dark: true })
    toggleDark()
    expect(mode.preference).toBe('light')
  })

  it('honors reduced motion without starting an animation', () => {
    const { mode, start } = setup({ reduced: true, supported: true })
    toggleDark()
    expect(mode.preference).toBe('dark')
    expect(start).not.toHaveBeenCalled()
  })

  it.each([true, false])('updates inside the native transition when initially dark=%s', async (dark) => {
    const { mode, animate, start } = setup({ supported: true, dark })
    toggleDark()
    expect(start).toHaveBeenCalledOnce()
    expect(mode.preference).toBe('system')
    await start.mock.calls[0]![0]()
    expect(mode.preference).toBe(dark ? 'light' : 'dark')
    expect(animate).not.toHaveBeenCalled()
  })
})
