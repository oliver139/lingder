import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import AudioCredits from '@/components/study/AudioCredits.vue'
import { pronunciationRecordings } from '@/data/audio'
import en from '@/i18n/locales/en.json'
import zh from '@/i18n/locales/zh.json'

describe('audio credits', () => {
  it.each([['en', en], ['zh', zh]] as const)('lists recording credits and the localized MOE notice in %s', (_locale, messages) => {
    const wrapper = mount(AudioCredits, {
      global: {
        mocks: { $t: (key: string) => key === 'study.audio.zhuyinCredit' ? messages.study.audio.zhuyinCredit : key === 'study.audio.zhuyinLicense' ? messages.study.audio.zhuyinLicense : key },
        stubs: {
          UModal: defineComponent({ template: '<div><slot /><slot name="body" /></div>' }),
          UButton: true,
        },
      },
    })
    expect(wrapper.text()).toContain(messages.study.audio.zhuyinCredit)
    expect(wrapper.text()).toContain(messages.study.audio.zhuyinLicense)
    expect(wrapper.findAll('li')).toHaveLength(pronunciationRecordings.length)
    const links = wrapper.findAll('a').map(link => link.attributes('href'))
    for (const recording of pronunciationRecordings) {
      expect(wrapper.text()).toContain(recording.author)
      expect(links).toContain(recording.sourceUrl)
      expect(links).toContain(recording.licenseUrl)
    }
    expect(wrapper.findAll('details')).toHaveLength(2)
  })
})
