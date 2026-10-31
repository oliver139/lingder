import { defineConfig } from 'taze'

export default defineConfig({
  interactive: true,
  exclude: [
    'pnpm',
  ],
  force: true,
  write: true,
  ignoreOtherWorkspaces: true,
  maturityPeriod: 7,
  depFields: {
    overrides: false,
  },
  packageMode: {
    '@types/node': 'minor',
  },
})
