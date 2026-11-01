<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { locale, localeProperties, setLocale } = useI18n()
const route = useRoute()
const rememberedLocale = useCookie<string>('lingder.locale', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
  path: '/',
})
const i18nHead = useLocaleHead()

// Wait for Nuxt/i18n hydration before restoring preferences; explicit locale URLs win.
let stopRemembering: (() => void) | undefined
onNuxtReady(() => {
  stopRemembering = watch(() => route.path, async (path) => {
    const explicitLocale = /^\/(zh-Hant|zh-Hans|en|ja)(?:\/|$)/.exec(path)?.[1]
    if (explicitLocale) {
      rememberedLocale.value = explicitLocale
    } else if (path === '/') {
      const target = rememberedLocale.value === 'en' || rememberedLocale.value === 'ja' || rememberedLocale.value === 'zh-Hans'
        ? rememberedLocale.value
        : 'zh-Hant'
      rememberedLocale.value = target
      if (locale.value !== target) {
        await setLocale(target)
      }
    }
  }, { immediate: true })
})
onBeforeUnmount(() => stopRemembering?.())

useHead(() => ({
  htmlAttrs: i18nHead.value.htmlAttrs,
  link: i18nHead.value.link || [],
  meta: i18nHead.value.meta || [],
}))
</script>

<template>
  <UApp :locale="locales[localeProperties.nuxtUiCode as keyof typeof locales]">
    <AppSeo />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<style scoped>
</style>
