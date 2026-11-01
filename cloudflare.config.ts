import { defineConfig } from 'cf/config'

// Assets are packaged by scripts/package-static.ts, not by cf's framework detection.
// Custom domains are managed separately with the owner's local credentials.
export default defineConfig({
  worker: {
    name: 'lingder',
    compatibilityDate: '2026-11-01',
    assets: {
      htmlHandling: 'auto-trailing-slash',
      notFoundHandling: '404-page',
      runWorkerFirst: false,
    },
  },
})
