import { decodeStudy, STUDY_STORAGE_KEY } from '../utils/study/persistence'

export function useStudyPersistence() {
  const store = useStudyStore()
  const storageWarning = shallowRef<'unavailable' | 'invalid' | null>(null)

  onMounted(() => {
    if (!store.ready) {
      let recovered = null
      try {
        const raw = window.localStorage.getItem(STUDY_STORAGE_KEY)
        if (raw !== null) {
          recovered = decodeStudy(raw)
          if (!recovered) {
            storageWarning.value = 'invalid'
          }
        }
      } catch {
        storageWarning.value = 'unavailable'
      }
      store.initialize(recovered)
    } else {
      // Cards and Table share one live session; navigating between them must not reset Undo.
      store.refreshDay()
    }
    watch(() => store.saved, (value) => {
      try {
        window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(value))
        if (storageWarning.value === 'unavailable') {
          storageWarning.value = null
        }
      } catch {
        storageWarning.value = 'unavailable'
      }
    }, { deep: true, immediate: true, flush: 'sync' })
  })

  useIntervalFn(() => {
    if (store.ready) {
      store.refreshDay()
    }
  }, 1000)
  useEventListener('focus', () => {
    if (store.ready) {
      store.refreshDay()
    }
  })
  return { storageWarning }
}
