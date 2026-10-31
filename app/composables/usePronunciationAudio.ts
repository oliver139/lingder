export function usePronunciationAudio() {
  const audio = shallowRef<HTMLAudioElement | null>(null)
  const loading = shallowRef(false)
  const playing = shallowRef(false)
  const error = shallowRef(false)
  let request = 0
  let source: string | null = null

  function stop() {
    request++
    source = null
    loading.value = false
    playing.value = false
    error.value = false
    if (audio.value) {
      audio.value.pause()
      audio.value.removeAttribute('src')
      audio.value.load()
    }
  }

  async function play(src: string) {
    if (typeof window === 'undefined') {
      return
    }
    stop()
    const currentRequest = request
    const element = audio.value ?? new Audio()
    audio.value = element
    element.preload = 'none'
    source = new URL(src, document.baseURI).href
    element.src = source
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
      stop()
      error.value = true
    }
  })
  onBeforeUnmount(() => {
    stop()
    audio.value = null
  })

  return { play, stop, loading, playing, error }
}
