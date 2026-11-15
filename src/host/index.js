import { Service } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { DEFAULTS, NAMESPACE, readConfig } from '../shared/config.js'
import { remoteContribution } from '../shared/remote.js'
import { createProviders, credentialState, safeFailure } from './provider.js'

export const name = 'vercel-web'
export const inject = ['web']
function schema(volatile) {
  const field = s => volatile && typeof s.volatile === 'function' ? s.volatile() : s
  return z.object({
    apiKeyEnv: field(z.string().role('credential-ref').default(DEFAULTS.apiKeyEnv)),
    model: field(z.string().default(DEFAULTS.model)),
    maxResults: field(z.number().step(1).min(1).max(50).default(DEFAULTS.maxResults)),
    timeoutMs: field(z.number().step(1).min(1000).max(120000).default(DEFAULTS.timeoutMs)),
    maxOutputTokens: field(z.number().step(1).min(1).max(2048).default(DEFAULTS.maxOutputTokens)),
    maxContentChars: field(z.number().step(1).min(1000).max(500000).default(DEFAULTS.maxContentChars)),
  })
}
export const Config = schema(true)

export class VercelWebControl extends Service {
  constructor(ctx, options) {
    super(ctx, 'vercelWeb')
    this.options = options
    this.busy = false
    this.typertRemote = { service: this, serviceKey: 'vercelWeb', namespace: 'vercelWeb' }
  }
  async status() {
    try {
      const config = readConfig(this.options.current())
      return { ok: true, config, credential: await credentialState(this.ctx, config.apiKeyEnv), report: this.options.providers.getReport() }
    } catch { return { ok: false, code: 'WEB_PROVIDER_CONFIG_INVALID', message: 'Check the plugin configuration and credentials service.' } }
  }
  async saveKey(value) {
    try {
      if (typeof value !== 'string' || !value.trim() || value.length > 8192 || /[\r\n]/.test(value)) return { ok: false, message: 'Enter a nonempty single-line Gateway key.' }
      const config = readConfig(this.options.current())
      const credentials = this.ctx.get('credentials')
      if (!credentials) return { ok: false, message: 'No writable Harness credential service is available.' }
      await credentials.set(config.apiKeyEnv, value.trim())
      return { ok: true, credential: await credentialState(this.ctx, config.apiKeyEnv) }
    } catch { return { ok: false, message: 'Could not save the credential. Check whether an environment value shadows this reference.' } }
  }
  async probe(operation, signal) {
    if (this.busy) return { ok: false, code: 'WEB_PROVIDER_BUSY', message: 'A paid-usage probe is already running.' }
    this.busy = true
    try {
      const { result, report } = await this.options.providers.probe(operation, signal)
      const preview = operation === 'search' ? result : { ...result, body: { ...result.body, content: result.body.content.slice(0, 1000) }, previewOnly: true }
      return { ok: true, result: preview, report }
    } catch (error) {
      const safe = safeFailure(error, signal)
      return { ok: false, code: safe.code, message: safe.message }
    } finally { this.busy = false }
  }
}

export function apply(ctx, config = {}) {
  let current = () => readConfig(config)
  ctx.inject(['settings'], c => {
    if (typeof c.settings.installSection !== 'function') return
    c.settings.installSection(ctx, NAMESPACE, schema(false), readConfig(config), {
      setSource: source => { current = () => readConfig(source()) },
      onChange() {}, validate: readConfig,
    })
  })
  const providers = createProviders(ctx, () => current())
  ctx.web.registerSearchProvider(providers.search)
  ctx.web.registerFetchProvider(providers.fetch)
  new VercelWebControl(ctx, { providers, current: () => current() })
  ctx.inject(['typert'], c => {
    c.effect(() => c.typert.register({
      package: remoteContribution.package, face: 'host', schemas: [],
      model: { services: [], events: [], objects: [] }, invocations: remoteContribution.descriptors,
    }))
  })
  return providers
}
