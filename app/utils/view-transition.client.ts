export function toggleDark(event: MouseEvent) {
  const colorMode = useColorMode()
  const { width: windowW, height: windowH } = useWindowSize()

  const isAppearanceTransition = document.startViewTransition
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isAppearanceTransition) {
    colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
    return
  }

  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = (rect.right + rect.left) / 2
  const y = (rect.top + rect.bottom) / 2
  const rectEnlarge = [
    y - windowH.value,
    -x,
    -y,
    x - windowW.value,
  ]
  const rectShrink = [
    y,
    windowW.value - x,
    windowH.value - y,
    x,
  ]
  const transition = document.startViewTransition(async () => {
    colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
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
