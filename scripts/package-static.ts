import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { cleanBuildOutputDir, getWorkerAssetsDir, readBuildOutput, writeAssets, writeRootConfig, writeWorkerConfig } from '@cloudflare/build-output-utils'
import config from '../cloudflare.config.ts'

export const staticRoutes = ['/', '/table', '/zh', '/zh/table', '/en', '/en/table', '/ja', '/ja/table']

export async function packageStatic(root: string, revision: string, bindDomain = false) {
  if (!/^[a-f0-9]{40}$/.test(revision)) {
    throw new Error('A full Git commit SHA is required to package a release')
  }

  const sourceDirectory = resolve(root, '.output/public')
  // Fail before replacing a previous package if generation missed a locale or page.
  for (const route of staticRoutes) {
    const html = await readFile(resolve(sourceDirectory, `.${route}/index.html`), 'utf8')
    if (!html.includes('<html')) {
      throw new Error(`Missing generated HTML for ${route}`)
    }
  }
  await readFile(resolve(sourceDirectory, '404.html'))
  await cleanBuildOutputDir(root)
  await writeAssets({ root, sourceDirectory })
  await writeWorkerConfig({ root, config: { ...config.worker, ...(bindDomain ? { domains: ['lingder.olimak.dev'] } : {}) } })
  await writeRootConfig(root, {}, { isPreview: false, mode: 'production' })
  await writeFile(resolve(getWorkerAssetsDir(root), 'deployment.json'), `${JSON.stringify({ revision })}\n`)
  return readBuildOutput(root)
}

if (import.meta.main) {
  await packageStatic(process.cwd(), process.env.DEPLOY_REVISION ?? '', process.argv.includes('--bind-domain'))
}
