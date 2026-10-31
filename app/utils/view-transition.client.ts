export function toggleDark() {
  const colorMode = useColorMode()
  const nextPreference = colorMode.value === 'dark' ? 'light' : 'dark'

  const isAppearanceTransition = typeof document.startViewTransition === 'function'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isAppearanceTransition) {
    colorMode.preference = nextPreference
    return
  }

  document.startViewTransition(async () => {
    colorMode.preference = nextPreference
    await nextTick()
  })
}
