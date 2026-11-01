// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { packageStatic, staticRoutes } from '../scripts/package-static'
import { smokeDeployment } from '../scripts/smoke-deployment'

const roots: string[] = []
const revision = 'a'.repeat(40)

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

async function fixture() {
  const root = await mkdtemp(resolve(tmpdir(), 'lingder-deploy-'))
  roots.push(root)
  for (const route of staticRoutes) {
    const directory = resolve(root, `.output/public${route}`)
    await mkdir(directory, { recursive: true })
    await writeFile(resolve(directory, 'index.html'), '<html lang="zh-Hant">Lingder</html>')
  }
  await writeFile(resolve(root, '.output/public/404.html'), '<html>Not found</html>')
  return root
}

describe('static deployment package', () => {
  it('produces a portable assets-only package and replaces stale assets on rebuild', async () => {
    const root = await fixture()
    const output = await packageStatic(root, revision)
    expect(output.rootConfig.buildContext).toEqual({ isPreview: false, mode: 'production' })
    expect(output.workers.default.config.name).toBe('lingder')
    expect(output.workers.default.config.domains).toBeUndefined()
    expect(output.workers.default.config.assets?.notFoundHandling).toBe('404-page')
    const directory = resolve(root, '.cloudflare/output/v0/workers/default/assets')
    expect(JSON.parse(await readFile(resolve(directory, 'deployment.json'), 'utf8'))).toEqual({ revision })
    await writeFile(resolve(directory, 'stale.js'), 'old')
    await packageStatic(root, 'b'.repeat(40))
    await expect(readFile(resolve(directory, 'stale.js'))).rejects.toThrow()
    await expect(readFile(resolve(root, '.cloudflare/output/v0/workers/default/bundle/index.js'))).rejects.toThrow()
  })

  it('rejects a partial generation before replacing an existing deployment package', async () => {
    const root = await fixture()
    await packageStatic(root, revision)
    await rm(resolve(root, '.output/public/ja/table/index.html'))
    await expect(packageStatic(root, 'b'.repeat(40))).rejects.toThrow()
    expect(JSON.parse(await readFile(resolve(root, '.cloudflare/output/v0/workers/default/assets/deployment.json'), 'utf8'))).toEqual({ revision })
  })

  it('requires an immutable full commit identifier', async () => {
    await expect(packageStatic(await fixture(), 'main')).rejects.toThrow('full Git commit SHA')
  })

  it('includes the custom domain only in the owner-run provisioning package', async () => {
    const output = await packageStatic(await fixture(), revision, true)
    expect(output.workers.default.config.domains).toEqual(['lingder.olimak.dev'])
  })
})

function healthyResponse(input: string | URL | Request) {
  const path = new URL(input instanceof Request ? input.url : input).pathname
  if (path === '/deployment.json') {
    return Response.json({ revision })
  }
  if (path.endsWith('.mp3')) {
    return new Response('audio', { headers: { 'content-type': 'audio/mpeg' } })
  }
  if (path.includes('missing-lingder')) {
    return new Response('Not found', { status: 404 })
  }
  return new Response('<html>Lingder</html>', { headers: { 'content-type': 'text/html' } })
}

describe('deployment smoke checks', () => {
  it('accepts localized pages, audio, 404s, and the exact release revision', async () => {
    await expect(smokeDeployment('https://example.com', revision, async input => healthyResponse(input))).resolves.toBeUndefined()
  })

  it('rejects an older live deployment', async () => {
    await expect(smokeDeployment('https://example.com', 'b'.repeat(40), async input => healthyResponse(input))).rejects.toThrow('release commit')
  })

  it('rejects SPA fallbacks masking missing assets', async () => {
    await expect(smokeDeployment('https://example.com', revision, async (input) => {
      if (String(input).includes('missing-lingder')) {
        return new Response('<html>Lingder</html>', { headers: { 'content-type': 'text/html' } })
      }
      return healthyResponse(input)
    })).rejects.toThrow('must return 404')
  })

  it('rejects HTML served in place of an audio file', async () => {
    await expect(smokeDeployment('https://example.com', revision, async (input) => {
      if (String(input).endsWith('.mp3')) {
        return new Response('<html>Lingder</html>', { headers: { 'content-type': 'text/html' } })
      }
      return healthyResponse(input)
    })).rejects.toThrow('must serve audio')
  })
})
