<script setup lang="ts">
const { t, locale } = useI18n()
const route = useRoute()
const routeBaseName = useRouteBaseName()
const site = useSiteConfig()
const config = useRuntimeConfig()
const page = computed(() => routeBaseName(route) === 'table' ? 'table' : 'cards')
const title = computed(() => `${t(`seo.${page.value}.title`)} | ${site.name}`)
const description = computed(() => config.public.siteDescription || t(`seo.${page.value}.description`))
const image = computed(() => new URL(config.public.siteImage || `/og/${locale.value}.jpg`, site.url).href)

// Titles already include the brand; override the module's default title template.
useHead({ titleTemplate: null })

useSeoMeta({
  title: () => title.value,
  description: () => description.value,
  ogTitle: () => title.value,
  ogDescription: () => description.value,
  ogSiteName: () => site.name,
  ogType: 'website',
  ogImage: () => image.value,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/jpeg',
  ogImageAlt: () => t('seo.imageAlt'),
  twitterCard: 'summary_large_image',
  twitterTitle: () => title.value,
  twitterDescription: () => description.value,
  twitterImage: () => image.value,
  twitterImageAlt: () => t('seo.imageAlt'),
})

useSchemaOrg([
  {
    '@type': 'WebApplication',
    '@id': () => `${site.url}/#application`,
    name: () => site.name,
    url: () => site.url,
    description: () => t('seo.cards.description'),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    inLanguage: ['zh-Hant', 'zh-Hans', 'en', 'ja'],
  },
])
</script>

<template>
  <slot />
</template>

<style scoped>
</style>
