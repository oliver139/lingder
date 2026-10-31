<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const { localeProperties } = useI18n()
const i18nHead = useLocaleHead()

useHead(() => ({
  htmlAttrs: i18nHead.value.htmlAttrs,
  link: i18nHead.value.link || [],
  meta: i18nHead.value.meta || [],
}))
</script>

<template>
  <UApp :locale="locales[localeProperties.nuxtUiCode as keyof typeof locales]">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<style scoped>
</style>
