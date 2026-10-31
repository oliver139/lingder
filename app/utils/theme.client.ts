export function toggleDark() {
  const colorMode = useColorMode()
  const preference = colorMode.value === 'dark' ? 'light' : 'dark'

  if (typeof document.startViewTransition !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    colorMode.preference = preference
    return
  }

  document.startViewTransition(async () => {
    colorMode.preference = preference
    await nextTick()
  })
}
