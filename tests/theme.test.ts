import { describe, expect, it, vi } from 'vitest'
import { toggleDark } from '@/utils/theme.client'

describe('nuxt theme toggle', () => {
  it.each(['light', 'dark'])('updates Nuxt from resolved %s inside the transition', async (value) => {
    const mode = { preference: 'system', value }
    const start = vi.fn<(callback: () => Promise<void>) => void>()
    vi.stubGlobal('useColorMode', () => mode)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: start })
    toggleDark()
    expect(mode.preference).toBe('system')
    expect(start).toHaveBeenCalledOnce()
    await start.mock.calls[0]![0]()
    expect(mode.preference).toBe(value === 'dark' ? 'light' : 'dark')
  })

  it.each([true, false])('switches directly with reduced motion or unsupported API (supported=%s)', (supported) => {
    const mode = { preference: 'system', value: 'dark' }
    const start = vi.fn()
    vi.stubGlobal('useColorMode', () => mode)
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: supported ? start : undefined })
    toggleDark()
    expect(mode.preference).toBe('light')
    expect(start).not.toHaveBeenCalled()
  })
})
