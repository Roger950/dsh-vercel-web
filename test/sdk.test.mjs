import test from 'node:test'
import assert from 'node:assert/strict'
import { createProviders } from '../src/host/provider.js'
import { DEFAULTS } from '../src/shared/config.js'

const ctx = { get: () => ({ resolve: async () => ({ value: 'test-only-key' }), describe: async () => ({ configured: true }) }) }
function sdkResponse(name, output) {
  return {
    content: [
      { type: 'tool-call', toolCallId: 'call-1', toolName: name, input: JSON.stringify(name.endsWith('search') ? { query: 'test' } : { url: 'https://example.com/' }), providerExecuted: true },
      { type: 'tool-result', toolCallId: 'call-1', toolName: name, result: output, providerExecuted: true },
      { type: 'text', text: 'Summary that must not replace raw tool output' },
    ],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage: { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 2, text: 2, reasoning: 0 } },
    warnings: [], providerMetadata: { gateway: { cost: '0.0008' } },
  }
}
for (const operation of ['search', 'fetch']) {
  test(`real AI SDK + Gateway transport preserves raw ${operation} output`, async () => {
    const requests = []
    const raw = operation === 'search' ? { results: [{ title: 'Source', url: 'https://example.com', snippet: 'real excerpt' }] } : { title: 'Example Domain', content: '# Original Markdown\n\nNo rewriting.' }
    const providers = createProviders(ctx, () => DEFAULTS, { fetch: async (url, init) => {
      requests.push({ url: String(url), init })
      return Response.json(sdkResponse(`deepseek_${operation}`, raw))
    } })
    const output = operation === 'search' ? await providers.search.search({ query: 'test' }) : await providers.fetch.fetch({ url: 'https://example.com' })
    assert.equal(requests.length, 1)
    assert.equal(requests[0].url, 'https://ai-gateway.vercel.sh/v4/ai/language-model')
    assert.equal(requests[0].init.redirect, 'error')
    const body = JSON.parse(requests[0].init.body)
    assert.equal(body.tools.length, 1); assert.equal(body.tools[0].id, `gateway.deepseek_${operation}`)
    assert.equal(providers.getReport().usage.inputTokens, 10)
    if (operation === 'fetch') assert.equal(output.body.content, raw.content)
    else assert.equal(output.sources[0].snippet, 'real excerpt')
  })
}
test('real SDK HTTP failure is mapped safely and is not retried', async () => {
  let count = 0
  const providers = createProviders(ctx, () => DEFAULTS, { fetch: async () => { count++; return Response.json({ error: { message: 'sensitive test-only-key', type: 'rate_limit_exceeded' } }, { status: 429 }) } })
  await assert.rejects(providers.search.search({ query: 'test' }), e => e.code === 'WEB_PROVIDER_RATE_LIMITED' && !e.message.includes('test-only-key'))
  assert.equal(count, 1)
})
