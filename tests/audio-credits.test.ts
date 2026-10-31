import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import AudioCredits from '@/components/study/AudioCredits.vue'
import { pronunciationRecordings } from '@/data/audio'

describe('audio credits', () => {
  it('lists the authors and source/license links for every recording, including the MOE notice', () => {
    const wrapper = mount(AudioCredits, {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: {
          UModal: defineComponent({ template: '<div><slot /><slot name="body" /></div>' }),
          UButton: true,
        },
      },
    })
    expect(wrapper.text()).toContain('2017 © 教育部，國語注音符號手冊-開放部件。')
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
