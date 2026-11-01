import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { usePronunciationAudio } from '@/composables/usePronunciationAudio'

const originalAudio = globalThis.Audio

class FakeAudio extends EventTarget {
  static instances: FakeAudio[] = []
  src = ''
  preload = ''
  currentSrc = ''
  currentTime = 0
  pause = vi.fn()
  load = vi.fn()
  play = vi.fn(() => Promise.resolve())
  removeAttribute = vi.fn(() => {
    this.src = ''
    this.currentSrc = ''
  })

  constructor() {
    super()
    FakeAudio.instances.push(this)
  }
}

function setup() {
  let player!: ReturnType<typeof usePronunciationAudio>
  const wrapper = mount(defineComponent({
    setup() {
      player = usePronunciationAudio()
      return () => null
    },
  }))
  return { player, wrapper }
}

beforeEach(() => {
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
})
afterEach(() => vi.stubGlobal('Audio', originalAudio))

describe('pronunciation playback', () => {
  it('preloads silently once and plays the buffered clip without clearing it', async () => {
    const { player } = setup()
    player.preload('/audio/ja/a.mp3')
    const audio = FakeAudio.instances[0]!
    expect(audio.preload).toBe('auto')
    expect(audio.load).toHaveBeenCalledOnce()
    expect(audio.play).not.toHaveBeenCalled()
    expect(player.loading.value).toBe(false)
    expect(player.playing.value).toBe(false)
    player.preload('/audio/ja/a.mp3')
    expect(audio.load).toHaveBeenCalledOnce()
    await player.play('/audio/ja/a.mp3')
    audio.currentTime = 0.5
    player.stop(false)
    expect(audio.currentTime).toBe(0)
    expect(player.playing.value).toBe(false)
    await player.play('/audio/ja/a.mp3')
    expect(audio.removeAttribute).not.toHaveBeenCalled()
    expect(audio.load).toHaveBeenCalledOnce()
    expect(audio.play).toHaveBeenCalledTimes(2)
  })

  it('replaces the preloaded clip and releases it on unmount', () => {
    const { player, wrapper } = setup()
    player.preload('/audio/ja/a.mp3')
    player.preload('/audio/ja/i.mp3')
    expect(FakeAudio.instances).toHaveLength(1)
    const audio = FakeAudio.instances[0]!
    expect(audio.src).toContain('/audio/ja/i.mp3')
    expect(audio.play).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(audio.src).toBe('')
  })

  it('keeps background preload errors quiet and retries on click', async () => {
    const { player } = setup()
    player.preload('/audio/ja/a.mp3')
    await nextTick()
    const audio = FakeAudio.instances[0]!
    audio.currentSrc = audio.src
    audio.dispatchEvent(new Event('error'))
    expect(player.error.value).toBe(false)
    expect(audio.src).toBe('')
    await player.play('/audio/ja/a.mp3')
    expect(player.playing.value).toBe(true)
    expect(audio.src).toContain('/audio/ja/a.mp3')
  })

  it('ignores pending playback when preloading a different card', async () => {
    const { player } = setup()
    player.preload('/audio/ja/a.mp3')
    const audio = FakeAudio.instances[0]!
    let resolve!: () => void
    audio.play.mockImplementationOnce(() => new Promise<void>((done) => {
      resolve = done
    }))
    const pending = player.play('/audio/ja/a.mp3')
    player.preload('/audio/ja/i.mp3')
    resolve()
    await pending
    expect(player.playing.value).toBe(false)
    expect(player.loading.value).toBe(false)
    expect(audio.src).toContain('/audio/ja/i.mp3')
  })

  it('creates one player only on demand, reuses it, and restarts clips', async () => {
    const { player } = setup()
    expect(FakeAudio.instances).toHaveLength(0)
    await player.play('/audio/ja/a.mp3')
    const audio = FakeAudio.instances[0]!
    expect(audio.preload).toBe('none')
    expect(audio.src).toContain('/audio/ja/a.mp3')
    expect(player.playing.value).toBe(true)
    await player.play('/audio/ja/a.mp3')
    await player.play('/audio/tw/3105.mp3')
    expect(FakeAudio.instances).toHaveLength(1)
    expect(audio.play).toHaveBeenCalledTimes(3)
    expect(audio.pause).toHaveBeenCalledTimes(2)
    expect(audio.src).toContain('/audio/tw/3105.mp3')
  })

  it('ignores a stale playback rejection after a newer request succeeds', async () => {
    const { player } = setup()
    await player.play('/audio/ja/a.mp3')
    const audio = FakeAudio.instances[0]!
    let reject!: (reason: Error) => void
    audio.play.mockImplementationOnce(() => new Promise<void>((_resolve, fail) => {
      reject = fail
    }))
    const pending = player.play('/audio/ja/i.mp3')
    expect(player.loading.value).toBe(true)
    await player.play('/audio/ja/u.mp3')
    reject(new Error('Cancelled old load'))
    await pending
    expect(player.playing.value).toBe(true)
    expect(player.error.value).toBe(false)
  })

  it('stops pending playback and ignores its later resolution', async () => {
    const { player } = setup()
    await player.play('/audio/ja/a.mp3')
    const audio = FakeAudio.instances[0]!
    let resolve!: () => void
    audio.play.mockImplementationOnce(() => new Promise<void>((done) => {
      resolve = done
    }))
    const pending = player.play('/audio/ja/i.mp3')
    player.stop()
    resolve()
    await pending
    expect(player.playing.value).toBe(false)
    expect(player.loading.value).toBe(false)
    expect(player.error.value).toBe(false)
    expect(audio.src).toBe('')
  })

  it('reports playback failures and permits retry', async () => {
    const { player } = setup()
    await player.play('/audio/ja/a.mp3')
    const audio = FakeAudio.instances[0]!
    audio.play.mockRejectedValueOnce(new Error('Playback unavailable'))
    await player.play('/audio/ja/i.mp3')
    expect(player.error.value).toBe(true)
    expect(player.playing.value).toBe(false)
    await player.play('/audio/ja/i.mp3')
    expect(player.error.value).toBe(false)
    expect(player.playing.value).toBe(true)
  })

  it('handles ended and source errors, ignoring events for an old source', async () => {
    const { player } = setup()
    await player.play('/audio/ja/a.mp3')
    await nextTick()
    const audio = FakeAudio.instances[0]!
    audio.currentSrc = audio.src
    audio.dispatchEvent(new Event('ended'))
    expect(player.playing.value).toBe(false)
    await player.play('/audio/ja/i.mp3')
    audio.currentSrc = 'https://example.com/old.mp3'
    audio.dispatchEvent(new Event('error'))
    expect(player.error.value).toBe(false)
    audio.currentSrc = audio.src
    audio.dispatchEvent(new Event('error'))
    expect(player.error.value).toBe(true)
    expect(player.playing.value).toBe(false)
  })

  it('invalidates an in-flight play promise after a media error', async () => {
    const { player } = setup()
    await player.play('/audio/ja/a.mp3')
    await nextTick()
    const audio = FakeAudio.instances[0]!
    let resolve!: () => void
    audio.play.mockImplementationOnce(() => new Promise<void>((done) => {
      resolve = done
    }))
    const pending = player.play('/audio/ja/i.mp3')
    audio.currentSrc = audio.src
    audio.dispatchEvent(new Event('error'))
    resolve()
    await pending
    expect(player.error.value).toBe(true)
    expect(player.playing.value).toBe(false)
    expect(player.loading.value).toBe(false)
  })

  it('releases media and removes listeners on unmount', async () => {
    const { player, wrapper } = setup()
    await player.play('/audio/ja/a.mp3')
    await nextTick()
    const audio = FakeAudio.instances[0]!
    const remove = vi.spyOn(audio, 'removeEventListener')
    wrapper.unmount()
    expect(audio.pause).toHaveBeenCalled()
    expect(audio.src).toBe('')
    expect(remove).toHaveBeenCalledWith('ended', expect.any(Function), undefined)
    expect(remove).toHaveBeenCalledWith('error', expect.any(Function), undefined)
  })
})
