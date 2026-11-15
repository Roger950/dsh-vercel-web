// Isolated development host. Never reads ~/.dsh or writes credentials to disk.
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { createHost } from '../test/fixtures/host.mjs'

const live = process.argv.includes('--live')
const token = randomBytes(24).toString('hex')
const values = new Map()
if (!live) values.set('AI_GATEWAY_API_KEY', 'isolated-preview-test-key')
if (!live) globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body)
  const search = body.tools[0].id === 'gateway.deepseek_search'
  const name = search ? 'deepseek_search' : 'deepseek_fetch'
  return Response.json({
    content: [
      { type: 'tool-call', toolCallId: 'preview-1', toolName: name, input: JSON.stringify(search ? { query: 'test' } : { url: 'https://example.com/' }), providerExecuted: true },
      { type: 'tool-result', toolCallId: 'preview-1', toolName: name, providerExecuted: true, result: search ? { results: [{ url: 'https://vercel.com/docs/ai-gateway/pricing', title: 'AI Gateway Pricing', snippet: 'Isolated fixture: no network request was made.' }] } : { title: 'Example Domain', content: '# Example Domain\n\nIsolated fixture Markdown — no network request was made.' } },
      { type: 'text', text: 'OK' },
    ],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage: { inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 2, text: 2, reasoning: 0 } }, warnings: [],
  })
}
const host = await createHost({ values })
const built = await build({ entryPoints: ['scripts/preview-client.jsx'], bundle: true, format: 'esm', write: false, platform: 'browser', target: 'es2022' })
const script = built.outputFiles[0].contents
const mode = live ? 'LIVE · 真实测试 · 消耗 Vercel 免费额度' : 'MOCK · 隔离测试 · 不访问外网、不消耗额度'
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vercel 联网插件 · 隔离验收</title><style>body{margin:28px auto;max-width:800px;background:#f4f7fb;color:#172033}button{padding:8px 12px;cursor:pointer;border:1px solid #aab7c8;border-radius:6px;background:white;color:#172033}button:disabled{opacity:.45;cursor:default}#root{background:white;border:1px solid #dae2ef;border-radius:10px;margin-top:18px}h1{font:600 22px system-ui}p{font-family:system-ui}</style><h1>Harness 原生 Vercel 联网插件</h1><p>${mode}</p><p>独立 Cordis / Harness host，日常 desktop profile 不受影响。密钥仅保存在此进程内存，停止即清除；请勿把密钥发到聊天。</p><button id="restart">重载插件（保留隔离设置）</button><div id="root"></div><script>window.previewToken=${JSON.stringify(token)}</script><script type="module" src="/preview.js"></script></html>`
function send(res, status, body, type = 'application/json') { res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "frame-ancestors 'none'" }); res.end(type === 'application/json' ? JSON.stringify(body) : body) }
const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') return send(res, 200, html, 'text/html; charset=utf-8')
    if (req.method === 'GET' && req.url === '/preview.js') return send(res, 200, script, 'text/javascript')
    if (req.method !== 'POST' || req.headers['x-preview-token'] !== token) return send(res, 403, { ok: false })
    let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 32768) return send(res, 413, { ok: false }) }
    const body = JSON.parse(text)
    if (req.url === '/settings') { await host.ctx.settings.mutate('vercel-web', body.ops, body.revision); return send(res, 200, { ok: true }) }
    if (req.url === '/restart') { await host.restart(); return send(res, 200, { ok: true }) }
    if (req.url === '/remote' && ['status', 'saveKey', 'probe'].includes(body.method)) {
      const controller = new AbortController()
      res.on('close', () => { if (!res.writableEnded) controller.abort() })
      const value = await host.invoke(body.method, body.args, controller.signal)
      return send(res, 200, { ok: true, value })
    }
    send(res, 404, { ok: false })
  } catch { send(res, 400, { ok: false, error: 'Request failed; check the isolated configuration.' }) }
})
server.listen(0, '127.0.0.1', () => console.log(`${mode}\nhttp://127.0.0.1:${server.address().port}`))
async function stop() { server.closeAllConnections(); server.close(); await host.close(); values.clear(); process.exit(0) }
process.on('SIGINT', stop); process.on('SIGTERM', stop)
