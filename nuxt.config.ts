// https://nuxt.com/docs/api/configuration/nuxt-config
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'

const siteName = process.env.SITE_NAME || 'Lingder'
const siteDescription = process.env.SITE_DESC
const siteUrl = process.env.SITE_URL || 'http://localhost:3000'
const siteImage = process.env.SITE_IMG

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui',
    // '@nuxt/content',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  devtools: { enabled: true },

  app: {
    head: {
      title: siteName,
      meta: [
        { name: 'twitter:card', content: siteImage ? 'summary_large_image' : 'summary' },
        { name: 'twitter:title', content: siteName },
        { property: 'og:title', content: siteName },
        { property: 'og:url', content: siteUrl },
        { property: 'og:type', content: 'website' },
        ...(siteDescription
          ? [
              { name: 'description', content: siteDescription },
              { name: 'twitter:description', content: siteDescription },
              { property: 'og:description', content: siteDescription },
            ]
          : []),
        ...(siteImage
          ? [
              { name: 'twitter:image', content: siteImage },
              { property: 'og:image', content: siteImage },
            ]
          : []),
      ],
    },
  },

  css: [
    '@/assets/css/main.css',
  ],

  experimental: {
    viewTransition: true,
  },

  compatibilityDate: '2025-07-15',

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: true,
      },
    },
  },

  i18n: {
    restructureDir: 'app/i18n',
    strategy: 'prefix_and_default',
    defaultLocale: 'en',

    locales: [
      { code: 'en', name: 'English', file: 'en.json', language: 'en', nuxtUiCode: 'en' },
      { code: 'zh', name: '繁體中文', file: 'zh.json', language: 'zh-Hant', nuxtUiCode: 'zh_tw' },
      // { code: 'ja', name: '日本語', file: 'ja.json', language: 'ja', nuxtUiCode: 'ja' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    baseUrl: siteUrl,
  },
})
