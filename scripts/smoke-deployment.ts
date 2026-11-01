import assert from 'node:assert/strict'
import process from 'node:process'
import { staticRoutes } from './package-static.ts'

export async function smokeDeployment(origin: string, revision: string, request: typeof fetch = fetch) {
  const base = new URL(origin)
  for (const route of staticRoutes) {
    const response = await request(new URL(route, base), { signal: AbortSignal.timeout(15000) })
    assert.equal(response.status, 200, `${route} must return 200`)
    assert.match(response.headers.get('content-type') ?? '', /text\/html/, `${route} must serve HTML`)
    assert.match(await response.text(), /<html/, `${route} must contain a document`)
  }
  for (const path of ['/audio/ja/a.mp3', '/audio/tw/3105.mp3']) {
    const response = await request(new URL(path, base), { signal: AbortSignal.timeout(15000) })
    assert.equal(response.status, 200, `${path} must be available`)
    assert.match(response.headers.get('content-type') ?? '', /audio\//, `${path} must serve audio`)
    assert.ok((await response.arrayBuffer()).byteLength > 0)
  }
  for (const path of ['/missing-lingder-page', '/_nuxt/missing-lingder-asset.js']) {
    const response = await request(new URL(path, base), { signal: AbortSignal.timeout(15000) })
    assert.equal(response.status, 404, `${path} must return 404`)
  }
  const response = await request(new URL(`/deployment.json?revision=${revision}`, base), { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { revision }, 'The live deployment must match the release commit')
}

if (import.meta.main) {
  await smokeDeployment(process.env.DEPLOY_URL ?? 'https://lingder.olimak.dev', process.env.DEPLOY_REVISION ?? '')
  console.log('Deployment smoke checks passed')
}
