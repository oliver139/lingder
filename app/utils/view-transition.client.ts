export function toggleDark(event: MouseEvent) {
  const colorMode = useColorMode()
  const windowW = window.innerWidth
  const windowH = window.innerHeight
  const nextPreference = colorMode.value === 'dark' ? 'light' : 'dark'

  const isAppearanceTransition = typeof document.startViewTransition === 'function'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isAppearanceTransition) {
    colorMode.preference = nextPreference
    return
  }

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = (rect.right + rect.left) / 2
  const y = (rect.top + rect.bottom) / 2
  const rectEnlarge = [
    y - windowH,
    -x,
    -y,
    x - windowW,
  ]
  const rectShrink = [
    y,
    windowW - x,
    windowH - y,
    x,
  ]
  const transition = document.startViewTransition(async () => {
    colorMode.preference = nextPreference
    await nextTick()
  })
  transition.ready
    .then(() => {
      const clipPath = [
        `inset(${rectShrink.map(v => `${v}px`).join(' ')})`,
        `inset(${rectEnlarge.map(v => `${v}px`).join(' ')})`,
      ]
      document.documentElement.animate(
        {
          clipPath: colorMode.preference === 'dark'
            ? [...clipPath].reverse()
            : clipPath,
        },
        {
          duration: 400,
          easing: 'ease-out',
          fill: 'forwards',
          pseudoElement: colorMode.preference === 'dark'
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        },
      )
    })
}
