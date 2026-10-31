import type { StudyMode } from '../../types/study'
import manifest from './manifest.json'

export interface PronunciationRecording {
  id: string
  mode: string
  label: string
  src: string
  author: string
  sourceUrl: string
  downloadUrl: string
  originalFilename: string
  license: string
  licenseUrl: string
  licenseStatement: string
  originalSha256: string
  modifications: string
  sha256: string
}

export const pronunciationRecordings: readonly PronunciationRecording[] = manifest
export const pronunciationByCard: Readonly<Record<string, PronunciationRecording>> = Object.fromEntries(
  pronunciationRecordings.flatMap(recording => recording.mode === 'ja'
    ? ['hiragana', 'katakana'].map(script => [`ja-${script}-${recording.id.slice(3)}`, recording])
    : [[`tw-zhuyin-${recording.id.slice(3)}`, recording]]),
)
export const pronunciationGroups: readonly { mode: StudyMode, recordings: readonly PronunciationRecording[] }[] = [
  { mode: 'ja', recordings: pronunciationRecordings.filter(recording => recording.mode === 'ja') },
  { mode: 'tw', recordings: pronunciationRecordings.filter(recording => recording.mode === 'tw') },
]
