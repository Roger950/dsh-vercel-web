import { Context } from '@deepseek-ai/cordis'
import WebRuntime from '@deepseek-ai/dsh-web'
import SettingsProvider from '@deepseek-ai/dsh-settings'
import CredentialProvider from '@deepseek-ai/dsh-credentials'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import TypertGateway from '@deepseek-ai/dsh-api-gateway'
import * as plugin from '../../src/host/index.js'

export class FixtureSettings extends SettingsProvider {
  writable = true
  constructor(ctx, options) { super(ctx); this.state = options.state }
  async load() { return this.state.document ?? {} }
  async persist(namespace, section) { this.state.document ??= {}; this.state.document[namespace] = structuredClone(section) }
}
export class FixtureCredentials extends CredentialProvider {
  constructor(ctx, options) { super(ctx); this.values = options.values }
  async describe(ref) { return { configured: Boolean(this.values.get(ref)), writable: true } }
  async resolve(ref) { const value = this.values.get(ref); return value ? { value, source: 'isolated-memory' } : undefined }
  async set(ref, value) { this.values.set(ref, value); this.notifyUpdated(ref) }
  async unset(ref) { this.values.delete(ref); this.notifyUpdated(ref) }
}
export async function createHost({ state = {}, values = new Map(), config = {} } = {}) {
  const ctx = new Context(), fibers = []
  for (const [entry, options] of [
    [FixtureSettings, { state }], [FixtureCredentials, { values }], [TypertRegistry, {}], [TypertGateway, {}],
    [WebRuntime, { searchProvider: 'vercel-deepseek-search', fetchProvider: 'vercel-deepseek-fetch' }],
  ]) fibers.push(await ctx.plugin(entry, options))
  let pluginFiber = await ctx.plugin(plugin, config)
  // Child injections may finish in the next lifecycle microtask.
  await ctx.inject(['vercelWeb', 'typert'], () => {})
  return {
    ctx, state, values,
    async restart() { await pluginFiber.restart(); await ctx.inject(['vercelWeb', 'typert'], () => {}) },
    async disable() { await pluginFiber.dispose() },
    async close() { await pluginFiber.dispose(); for (const fiber of fibers.reverse()) await fiber.dispose() },
    invoke: (method, args = {}, signal) => ctx.typertGateway.invoke({ namespace: 'vercelWeb', method, args, signal }),
  }
}
