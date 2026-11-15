import test from 'node:test'
import assert from 'node:assert/strict'
import { createHost } from './fixtures/host.mjs'
import { DEFAULTS } from '../src/shared/config.js'

test('real Cordis, web registry and Typert dispatch register native providers and safe control methods', async () => {
  const host = await createHost()
  try {
    const status = await host.invoke('status')
    assert.equal(status.ok, true); assert.deepEqual(status.config, DEFAULTS)
    assert.equal(status.credential.configured, false)
    await assert.rejects(host.ctx.web.search({ query: 'test' }), { code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
    const saved = await host.invoke('saveKey', { value: 'test-only-private-value' })
    assert.equal(saved.ok, true)
    assert.ok(!JSON.stringify(await host.invoke('status')).includes('test-only-private-value'))
    assert.ok(!JSON.stringify(host.state).includes('test-only-private-value'))
    await assert.rejects(host.invoke('saveKey', { value: 'x', unexpected: true }))
  } finally { await host.close() }
})
test('settings persist across restart and native provider unload removes selection', async () => {
  const host = await createHost()
  try {
    await host.ctx.settings.mutate('vercel-web', [{ op: 'set', path: ['maxResults'], value: 2 }])
    assert.equal((await host.invoke('status')).config.maxResults, 2)
    await host.restart()
    assert.equal((await host.invoke('status')).config.maxResults, 2)
    await host.disable()
    await assert.rejects(host.ctx.web.search({ query: 'test' }), { code: 'WEB_PROVIDER_CONFIGURED_MISSING' })
  } finally { await host.close() }
})
