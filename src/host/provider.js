import { generateText, stepCountIs } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { WebError } from '@deepseek-ai/dsh-web'
import { BASE_URL, readConfig } from '../shared/config.js'

export function fail(code, message) { return new WebError(message, code) }
const hints = {
  401: ['WEB_PROVIDER_CREDENTIAL_INVALID', 'Vercel rejected the Gateway key. Replace it in Harness credentials.'],
  402: ['WEB_PROVIDER_CREDIT_REQUIRED', 'Vercel credits are exhausted or this model requires purchased credits. Stop; select a free-credit-eligible model or wait for renewal.'],
  403: ['WEB_PROVIDER_FORBIDDEN', 'Vercel refused this model or tool. Check free-credit eligibility and account restrictions; no paid fallback was attempted.'],
  429: ['WEB_PROVIDER_RATE_LIMITED', 'Vercel rate limit reached. Retry manually later; no automatic retry was made.'],
}
export function safeFailure(error, signal) {
  if (error instanceof WebError) return error
  if (signal?.aborted || error?.name === 'AbortError') return fail('WEB_ABORTED', 'Vercel operation cancelled.')
  if (error?.name === 'TimeoutError') return fail('WEB_TIMEOUT', 'Vercel operation timed out. It may already have incurred usage; retry manually.')
  const status = Number(error?.statusCode ?? error?.status)
  const hint = hints[status]
  // Never forward SDK exceptions: they may carry headers, key values or response bodies.
  return fail(hint?.[0] ?? 'WEB_PROVIDER_ERROR', hint?.[1] ?? 'Vercel tool request failed. No automatic retry or provider fallback was made.')
}
export async function resolveKey(ctx, ref) {
  const credentials = ctx.get?.('credentials')
  const result = credentials ? (await credentials.resolve(ref))?.value : process.env[ref]
  if (typeof result !== 'string' || !result.trim()) throw fail('WEB_PROVIDER_CREDENTIAL_MISSING', `Configure ${ref} in Harness credentials before using Vercel web tools.`)
  return result.trim()
}
export async function credentialState(ctx, ref) {
  const credentials = ctx.get?.('credentials')
  if (credentials) {
    const state = await credentials.describe(ref)
    return { configured: state.configured === true, writable: state.writable === true }
  }
  return { configured: Boolean(process.env[ref]?.trim()), writable: false }
}
function queryInput(query) {
  if (typeof query !== 'string' || !query.trim() || [...query].length > 128) throw fail('WEB_QUERY_INVALID', 'Search queries must contain 1–128 Unicode characters.')
  return query.trim()
}
export function fetchInput(value) {
  if (typeof value !== 'string' || value.length > 8192) throw fail('WEB_URL_INVALID', 'Enter an HTTP(S) URL up to 8192 characters.')
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error()
    return url.href
  } catch { throw fail('WEB_URL_INVALID', 'Enter an HTTP(S) URL without embedded credentials.') }
}
export function extractToolOutput(result, toolName) {
  const content = result.content ?? []
  if (content.some(item => item.type === 'tool-error' && item.toolName === toolName)) throw fail('WEB_PROVIDER_TOOL_ERROR', 'Vercel reported a tool error. No synthesized answer was used.')
  const calls = (result.toolResults ?? []).filter(item => item.toolName === toolName)
  if (calls.length !== 1) throw fail('WEB_PROVIDER_TOOL_NOT_EXECUTED', 'Expected exactly one Vercel tool result; no synthesized answer was used.')
  const output = calls[0].output
  if (!output || typeof output !== 'object' || output.error) throw fail('WEB_PROVIDER_TOOL_ERROR', 'Vercel returned an unsuccessful tool result.')
  return output
}
export function searchOutput(output, limit) {
  if (!Array.isArray(output.results)) throw fail('WEB_PROVIDER_RESULT_INVALID', 'Vercel search returned an invalid result shape.')
  const sources = [], seen = new Set()
  for (const entry of output.results) {
    if (!entry || typeof entry.url !== 'string') continue
    let url
    try { url = fetchInput(entry.url) } catch { continue }
    if (seen.has(url)) continue
    seen.add(url)
    const source = { url }
    for (const [from, to] of [['title', 'title'], ['snippet', 'snippet'], ['summary', 'summary']]) {
      if (typeof entry[from] === 'string' && entry[from]) source[to] = entry[from]
    }
    if (typeof entry.date === 'string' && !Number.isNaN(Date.parse(entry.date))) source.publishedAt = new Date(entry.date).toISOString()
    sources.push(source)
  }
  if (output.results.length && !sources.length) throw fail('WEB_PROVIDER_RESULT_INVALID', 'Vercel returned results without usable source URLs.')
  return { sources: sources.slice(0, limit), truncated: sources.length > limit }
}
export function fetchOutput(output, url, maxChars) {
  if (typeof output.content !== 'string' || !output.content.trim()) throw fail('WEB_PROVIDER_RESULT_INVALID', 'Vercel fetch returned no page Markdown.')
  return {
    // The API supplies no final URL or target HTTP status. 200 means retrieval succeeded.
    url, statusCode: 200,
    body: { kind: 'text', content: output.content.slice(0, maxChars) },
    truncated: output.content.length > maxChars,
  }
}
function report(result, model, operation, started) {
  const raw = result.totalUsage ?? result.usage ?? {}
  const usage = Object.fromEntries(['inputTokens', 'outputTokens', 'totalTokens'].filter(k => Number.isFinite(raw[k])).map(k => [k, raw[k]]))
  const gateway = result.providerMetadata?.gateway ?? {}
  const costs = {}
  for (const k of ['cost', 'marketCost']) {
    const v = gateway[k]
    if ((typeof v === 'number' || typeof v === 'string') && v !== '' && Number.isFinite(Number(v))) costs[k] = Number(v)
  }
  return { operation, model, durationMs: Date.now() - started, usage, costs, costSource: Object.keys(costs).length ? 'gateway-metadata' : 'not-reported' }
}

export function createProviders(ctx, configSource, dependencies = {}) {
  const generate = dependencies.generateText ?? generateText
  const gatewayFactory = dependencies.createGateway ?? createGateway
  let latest = null
  async function ready() {
    try { const config = readConfig(configSource()); return (await credentialState(ctx, config.apiKeyEnv)).configured } catch { return false }
  }
  async function run(operation, request, signal) {
    const started = Date.now()
    let timeout
    try {
      const config = readConfig(configSource())
      const input = operation === 'search' ? queryInput(request.query) : fetchInput(request.url)
      const limit = Math.min(config.maxResults, request.maxResults ?? config.maxResults)
      if (!Number.isInteger(limit) || limit < 1) throw fail('WEB_QUERY_INVALID', 'maxResults must be a positive integer.')
      if (signal?.aborted) throw fail('WEB_ABORTED', 'Vercel operation cancelled.')
      const key = await resolveKey(ctx, config.apiKeyEnv)
      const controller = new AbortController()
      let timedOut = false
      timeout = setTimeout(() => { timedOut = true; controller.abort() }, config.timeoutMs)
      const abortSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal
      const gateway = gatewayFactory({ apiKey: key, baseURL: BASE_URL, fetch: (url, init) => {
        // Defense in depth: SDK requests must stay on the official endpoint, with no redirects.
        const target = new URL(url)
        if (target.origin !== 'https://ai-gateway.vercel.sh' || !target.pathname.startsWith('/v4/ai/')) throw fail('WEB_PROVIDER_ENDPOINT_INVALID', 'Non-official Gateway endpoint blocked.')
        return (dependencies.fetch ?? globalThis.fetch)(url, { ...init, redirect: 'error' })
      } })
      const toolName = `deepseek_${operation}`
      const tool = operation === 'search'
        ? gateway.tools.deepseekSearch({ query: input, count: limit, needContent: false })
        : gateway.tools.deepseekFetch({ url: input })
      let result
      try {
        result = await generate({
          model: gateway(config.model),
          prompt: 'Execute the supplied web tool once. Do not summarize or reproduce its content. Then reply OK.',
          tools: { [toolName]: tool }, toolChoice: 'required',
          stopWhen: stepCountIs(1), maxRetries: 0,
          maxOutputTokens: config.maxOutputTokens, abortSignal,
        })
      } catch (error) {
        if (timedOut && !signal?.aborted) throw fail('WEB_TIMEOUT', 'Vercel operation timed out; usage may already have been charged. Retry manually.')
        throw error
      }
      latest = report(result, config.model, operation, started)
      const output = extractToolOutput(result, toolName)
      return operation === 'search' ? searchOutput(output, limit) : fetchOutput(output, input, config.maxContentChars)
    } catch (error) { throw safeFailure(error, signal) }
    finally { clearTimeout(timeout) }
  }
  const available = () => { try { readConfig(configSource()); return true } catch { return false } }
  return {
    search: { id: 'vercel-deepseek-search', title: 'Vercel · DeepSeek Search', description: { en: 'Uses Vercel credits. Tool fee plus host model tokens.', zh: '消耗 Vercel 额度，费用包含工具调用及宿主模型 tokens。' }, available, ready, search: (request, signal) => run('search', request, signal) },
    fetch: { id: 'vercel-deepseek-fetch', title: 'Vercel · DeepSeek Fetch', description: { en: 'Returns raw page Markdown via Vercel. Tool fee plus host model tokens.', zh: '通过 Vercel 返回网页原始 Markdown，另计宿主模型 tokens。' }, available, ready, fetch: (request, signal) => run('fetch', request, signal) },
    getReport: () => latest,
    async probe(operation, signal) {
      if (!['search', 'fetch'].includes(operation)) throw fail('WEB_QUERY_INVALID', 'Unknown probe operation.')
      const result = operation === 'search'
        ? await run('search', { query: 'site:vercel.com/docs/ai-gateway pricing', maxResults: 1 }, signal)
        : await run('fetch', { url: 'https://example.com' }, signal)
      return { result, report: latest }
    },
  }
}
