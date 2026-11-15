import test from 'node:test'
import assert from 'node:assert/strict'
import { createProviders, searchOutput, fetchOutput, extractToolOutput, safeFailure, fetchInput } from '../src/host/provider.js'
import { DEFAULTS, readConfig } from '../src/shared/config.js'

const key = 'test-only-secret-do-not-expose'
const context = { get: () => ({ resolve: async () => ({ value: key }), describe: async () => ({ configured: true, writable: true }) }) }
const result = (operation, output) => ({ content: [], toolResults: [{ toolName: `deepseek_${operation}`, output }], usage: { inputTokens: 15, outputTokens: 3, totalTokens: 18 }, providerMetadata: { gateway: { cost: '0.0009', requestHeaders: { authorization: key } } }, text: 'Invented summary must never be used' })
function fixture(generate, config = DEFAULTS, ctx = context) {
  return createProviders(ctx, () => config, { generateText: generate })
}
test('search uses pinned provider tool, one step, no retries, normalized raw sources', async () => {
  let calls = 0
  const p = fixture(async args => {
    calls++; assert.equal(args.maxRetries, 0); assert.equal(args.toolChoice, 'required'); assert.equal(args.maxOutputTokens, 512)
    assert.deepEqual(Object.keys(args.tools), ['deepseek_search'])
    assert.equal(args.tools.deepseek_search.args.query, 'real query')
    assert.equal(args.tools.deepseek_search.args.count, 2)
    return result('search', { results: [{ url: 'https://example.com/a', title: 'Actual', summary: 'Original excerpt' }] })
  })
  const output = await p.search.search({ query: 'real query', maxResults: 2 })
  assert.equal(calls, 1); assert.equal(output.sources[0].summary, 'Original excerpt'); assert.equal(output.content, undefined)
  assert.deepEqual(p.getReport().costs, { cost: 0.0009 }); assert.ok(!JSON.stringify(p.getReport()).includes(key))
})
test('fetch preserves original Markdown, not model text, and truncates explicitly', async () => {
  const raw = '# Raw title\n\n**Actual page**\n' + 'x'.repeat(1500)
  const p = fixture(async args => {
    assert.deepEqual(Object.keys(args.tools), ['deepseek_fetch'])
    assert.equal(args.tools.deepseek_fetch.args.url, 'https://example.com/')
    return result('fetch', { content: raw, title: 'Raw title' })
  }, { ...DEFAULTS, maxContentChars: 1000 })
  const output = await p.fetch.fetch({ url: 'https://example.com' })
  assert.equal(output.body.content, raw.slice(0, 1000)); assert.equal(output.truncated, true); assert.equal(output.body.kind, 'text')
})
test('query and URL validation happens before resolving credentials or calling model', async () => {
  const p = fixture(() => { throw new Error('must not execute') }, DEFAULTS, { get() { throw new Error('must not read key') } })
  for (const query of ['', ' ', '界'.repeat(129)]) await assert.rejects(p.search.search({ query }), { code: 'WEB_QUERY_INVALID' })
  for (const url of ['file:///secret', 'https://user:pass@example.com', 'not-url']) await assert.rejects(p.fetch.fetch({ url }), { code: 'WEB_URL_INVALID' })
})
test('Unicode query length counts characters rather than UTF-16 code units', async () => {
  const p = fixture(async () => result('search', { results: [] }))
  assert.deepEqual((await p.search.search({ query: '😀'.repeat(128) })).sources, [])
})
test('missing key readiness never causes network traffic', async () => {
  const p = fixture(() => { throw Error('network') }, DEFAULTS, { get: () => ({ describe: async () => ({ configured: false }), resolve: async () => undefined }) })
  assert.equal(await p.search.ready(), false)
  await assert.rejects(p.search.search({ query: 'test' }), { code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
})
test('credentials are resolved freshly for every call; credential service is authoritative', async () => {
  let version = 0
  const p = fixture(async () => result('search', { results: [] }), DEFAULTS, { get: () => ({ resolve: async () => { version++; return { value: key } } }) })
  await p.search.search({ query: 'first' }); await p.search.search({ query: 'second' }); assert.equal(version, 2)
})
for (const [statusCode, code] of [[401, 'WEB_PROVIDER_CREDENTIAL_INVALID'], [402, 'WEB_PROVIDER_CREDIT_REQUIRED'], [403, 'WEB_PROVIDER_FORBIDDEN'], [429, 'WEB_PROVIDER_RATE_LIMITED'], [500, 'WEB_PROVIDER_ERROR']]) {
  test(`HTTP ${statusCode} becomes safe error without retries or leaking SDK request`, async () => {
    let calls = 0
    const p = fixture(async () => { calls++; throw Object.assign(new Error(`Authorization: Bearer ${key}`), { statusCode, requestBodyValues: { key } }) })
    await assert.rejects(p.search.search({ query: 'test' }), error => error.code === code && !String(error.stack).includes(key) && !error.cause)
    assert.equal(calls, 1)
  })
}
test('pre-aborted calls do not contact Gateway', async () => {
  const p = fixture(() => { throw new Error('network') })
  await assert.rejects(p.search.search({ query: 'test' }, AbortSignal.abort()), { code: 'WEB_ABORTED' })
})
test('in-flight cancellation is propagated', async () => {
  const ac = new AbortController()
  const p = fixture(args => new Promise((resolve, reject) => { args.abortSignal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))); ac.abort() }))
  await assert.rejects(p.fetch.fetch({ url: 'https://example.com' }, ac.signal), { code: 'WEB_ABORTED' })
})
test('timeout stops the SDK call without retrying', async () => {
  let calls = 0
  const p = fixture(args => new Promise((resolve, reject) => { calls++; args.abortSignal.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError'))) }), { ...DEFAULTS, timeoutMs: 1000 })
  await assert.rejects(p.search.search({ query: 'test' }), { code: 'WEB_TIMEOUT' }); assert.equal(calls, 1)
})
test('missing, multiple and errored tool results never fall back to model answers', () => {
  for (const output of [{ toolResults: [], text: 'fabricated' }, { toolResults: [{ toolName: 'deepseek_search', output: {} }, { toolName: 'deepseek_search', output: {} }] }]) assert.throws(() => extractToolOutput(output, 'deepseek_search'), { code: 'WEB_PROVIDER_TOOL_NOT_EXECUTED' })
  assert.throws(() => extractToolOutput({ content: [{ type: 'tool-error', toolName: 'deepseek_search', error: key }] }, 'deepseek_search'), { code: 'WEB_PROVIDER_TOOL_ERROR' })
  assert.throws(() => extractToolOutput(result('fetch', { error: { message: key } }), 'deepseek_fetch'), { code: 'WEB_PROVIDER_TOOL_ERROR' })
})
test('search deduplicates, validates sources, preserves excerpts and bounds output', () => {
  const raw = { results: [
    { url: 'https://example.com/a', title: 'A', snippet: 'excerpt', date: '2026-11-01' },
    { url: 'https://example.com/a' }, { url: 'javascript:alert(1)' }, { url: 'https://example.com/b' },
  ] }
  const mapped = searchOutput(raw, 1)
  assert.equal(mapped.sources.length, 1); assert.equal(mapped.truncated, true); assert.equal(mapped.sources[0].publishedAt, '2026-11-01T00:00:00.000Z')
  assert.deepEqual(searchOutput({ results: [] }, 3), { sources: [], truncated: false })
  assert.throws(() => searchOutput({}, 3), { code: 'WEB_PROVIDER_RESULT_INVALID' })
  assert.throws(() => searchOutput({ results: [{ title: 'missing URL' }] }, 3), { code: 'WEB_PROVIDER_RESULT_INVALID' })
})
test('empty and invalid fetch bodies fail without generating substitute content', () => {
  for (const content of [undefined, '', ' ']) assert.throws(() => fetchOutput({ content }, 'https://example.com', 1000), { code: 'WEB_PROVIDER_RESULT_INVALID' })
})
test('live accessor changes apply on the next request', () => {
  let value = 'meta/muse-spark-open'
  const config = { model: { get: () => value } }
  assert.equal(readConfig(config).model, value); value = 'nvidia/nemotron-3.5-lightning-free'; assert.equal(readConfig(config).model, value)
})
test('endpoint cannot be reconfigured through settings', () => {
  assert.equal(readConfig({ baseURL: 'https://attacker.invalid' }).baseURL, undefined)
})
