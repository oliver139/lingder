import type { StudyMode } from '../types/study'

export function useStudyModeQuery(applyMode: (mode: StudyMode) => void) {
  const route = useRoute()
  const router = useRouter()

  // Run after mounted persistence has restored the cards, and keep SSG hydration stable.
  onMounted(() => {
    watch(() => route.query.mode, (value) => {
      if (value === 'ja' || value === 'tw') {
        applyMode(value)
      }
    }, { immediate: true })
  })

  function selectMode(mode: StudyMode) {
    applyMode(mode)
    return router.replace({ path: route.path, query: { ...route.query, mode }, hash: route.hash })
  }

  return { selectMode }
}
