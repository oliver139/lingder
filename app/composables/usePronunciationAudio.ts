export function usePronunciationAudio() {
  const audio = shallowRef<HTMLAudioElement | null>(null)
  const loading = shallowRef(false)
  const playing = shallowRef(false)
  const error = shallowRef(false)
  let request = 0
  let source: string | null = null

  function stop(release = true) {
    request++
    if (release) source = null
    loading.value = false
    playing.value = false
    error.value = false
    if (audio.value) {
      audio.value.pause()
      if (release) {
        audio.value.removeAttribute('src')
        audio.value.load()
      } else {
        audio.value.currentTime = 0
      }
    }
  }

  function preload(src: string) {
    if (typeof window === 'undefined') return
    const nextSource = new URL(src, document.baseURI).href
    if (source === nextSource) return
    stop()
    const element = audio.value ?? new Audio()
    audio.value = element
    element.preload = 'auto'
    source = nextSource
    element.src = source
    element.load()
  }

  async function play(src: string) {
    if (typeof window === 'undefined') {
      return
    }
    const nextSource = new URL(src, document.baseURI).href
    const reusePreload = source === nextSource && audio.value?.preload === 'auto'
    stop(!reusePreload)
    const currentRequest = request
    const element = audio.value ?? new Audio()
    audio.value = element
    if (!reusePreload) {
      element.preload = 'none'
      source = nextSource
      element.src = source
    }
    loading.value = true
    try {
      await element.play()
      if (request === currentRequest) {
        loading.value = false
        playing.value = true
      }
    } catch {
      if (request === currentRequest) {
        stop()
        error.value = true
      }
    }
  }

  useEventListener(audio, 'ended', () => {
    if (source && audio.value?.currentSrc === source) {
      playing.value = false
      loading.value = false
    }
  })
  useEventListener(audio, 'error', () => {
    if (source && audio.value?.currentSrc === source) {
      const wasRequested = loading.value || playing.value
      stop()
      error.value = wasRequested
    }
  })
  onBeforeUnmount(() => {
    stop()
    audio.value = null
  })

  return { preload, play, stop, loading, playing, error }
}
