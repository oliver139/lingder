import type { StudyMode } from '../types/study'

export function useStudyModeQuery(applyMode: (mode: StudyMode) => void) {
  const route = useRoute()
  const router = useRouter()

  // Run after mounted persistence has restored the cards, and keep SSG hydration stable.
  onMounted(() => {
    watch(() => route.query.mode, (value) => {
      const mode = value === 'jp' ? 'ja' : value
      if (mode === 'ja' || mode === 'tw') {
        applyMode(mode)
        const query = { ...route.query }
        delete query.mode
        return router.replace({ path: route.path, query, hash: route.hash })
      }
    }, { immediate: true })
  })
}
