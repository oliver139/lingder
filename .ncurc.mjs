import { defineConfig } from 'npm-check-updates'

export default defineConfig({
  format: 'group',
  upgrade: true,
  interactive: true,
  cooldown: (name) => {
    const prefixes = [
      '@oliver139/',
      '@iconify-json/',
    ]

    return prefixes.some(prefix => name.startsWith(prefix)) ? 0 : 7
  },
  reject: [
    'pnpm',
  ],
  target: (name) => {
    const minor = [
      '@types/node',
      'typescript',
    ]

    return minor.includes(name) ? 'minor' : 'latest'
  },
})
