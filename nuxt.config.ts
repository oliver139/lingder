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
    '@nuxtjs/seo',
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
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'apple-mobile-web-app-title', content: siteName },
      ],
    },
  },

  css: [
    '@/assets/css/main.css',
  ],

  site: {
    url: siteUrl,
    name: siteName,
    defaultLocale: 'zh-Hant',
    trailingSlash: true,
  },

  colorMode: {
    disableTransition: true,
  },

  runtimeConfig: {
    public: {
      siteDescription: siteDescription || '',
      siteImage: siteImage || '',
    },
  },

  compatibilityDate: '2025-07-15',

  nitro: {
    prerender: {
      routes: ['/', '/table', '/zh-Hant', '/zh-Hant/table', '/zh-Hans', '/zh-Hans/table', '/en', '/en/table', '/ja', '/ja/table'],
      failOnError: true,
    },
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  aiReady: false,

  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: true,
      },
    },
  },

  fonts: {
    provider: 'google',
    families: [
      { name: 'Noto Sans', weights: [400, 500, 600, 700], styles: ['normal'] },
      { name: 'Noto Serif JP', weights: [400], styles: ['normal'], subsets: ['japanese', 'latin'] },
      { name: 'Noto Serif TC', weights: [400], styles: ['normal'], subsets: ['chinese-traditional', 'latin'] },
    ],
  },

  i18n: {
    restructureDir: 'app/i18n',
    strategy: 'prefix_and_default',
    trailingSlash: true,
    defaultLocale: 'zh-Hant',

    locales: [
      { code: 'zh-Hant', name: '繁體中文', file: 'zh-Hant.json', language: 'zh-Hant', nuxtUiCode: 'zh_tw' },
      { code: 'zh-Hans', name: '簡体中文', file: 'zh-Hans.json', language: 'zh-Hans', nuxtUiCode: 'zh_cn' },
      { code: 'en', name: 'English', file: 'en.json', language: 'en', nuxtUiCode: 'en' },
      { code: 'ja', name: '日本語', file: 'ja.json', language: 'ja', nuxtUiCode: 'ja' },
    ],
    // app.vue restores the remembered locale at / without browser-language detection.
    detectBrowserLanguage: false,
    baseUrl: siteUrl,
  },

  icon: {
    clientBundle: { scan: true },
    fallbackToApi: false,
  },

  // BCP 47 language prefixes intentionally contain uppercase script subtags.
  linkChecker: { skipInspections: ['no-uppercase-chars'] },

  ogImage: false,
  seo: { canonicalLowercase: false },
  sitemap: { zeroRuntime: true, exclude: ['/zh-Hant', '/zh-Hant/**'] },
  skewProtection: false,
})
