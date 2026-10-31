import antfu from '@antfu/eslint-config'
import oli from '@oliver139/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(antfu(...oli({
  tailwind: {
    entryPoint: './app/assets/css/main.css',
  },
  vue: {
    blockOrder: 'sf',
  },
})))
