// Opt-in live verification: reads a preconfigured environment value, never prints it.
import { createProviders } from '../src/host/provider.js'
import { DEFAULTS } from '../src/shared/config.js'
if (!process.env.AI_GATEWAY_API_KEY?.trim()) {
  console.error('Set AI_GATEWAY_API_KEY in this process, or use the isolated local live preview. Never send the key in chat.')
  process.exitCode = 2
} else {
  const p = createProviders({ get: () => undefined }, () => ({ ...DEFAULTS, maxResults: 1 }))
  for (const operation of ['search', 'fetch']) {
    try {
      const { result, report } = await p.probe(operation)
      const summary = operation === 'search'
        ? { sourceCount: result.sources.length, urls: result.sources.map(s => s.url) }
        : { url: result.url, characters: result.body.content.length, containsExampleDomain: /Example Domain/.test(result.body.content) }
      console.log(JSON.stringify({ operation, ok: true, summary, report }))
    } catch (error) {
      console.error(JSON.stringify({ operation, ok: false, code: error.code, message: error.message }))
      process.exitCode = 1
      break
    }
  }
}
