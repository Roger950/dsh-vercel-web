import React, { useEffect, useState, useSyncExternalStore } from 'react'
import { DEFAULTS, FIELDS, NAMESPACE, PACKAGE_NAME, ROW_ID, validateConfig } from '../shared/config.js'
import { remoteContribution } from '../shared/remote.js'

export const name = 'vercel-web-client'
export const inject = ['slots', 'locale', 'remote']
const copy = {
  en: {
    title: 'Vercel web tools', model: 'Host model (separate from chat)', apiKeyEnv: 'Credential reference',
    maxResults: 'Search result limit', timeoutMs: 'Timeout (ms)', maxOutputTokens: 'Host output token limit', maxContentChars: 'Page character limit',
    save: 'Save settings', saved: 'Settings saved', key: 'Gateway API key', saveKey: 'Store key', configured: 'Key configured', missing: 'Key not configured',
    testSearch: 'Test Search · uses credits', testFetch: 'Test Fetch · uses credits', busy: 'Working…', refresh: 'Refresh status',
    fee: 'Each billable Search or Fetch costs $0.00075 plus host model tokens. Tests consume your Vercel balance. No credits are purchased by this plugin.',
    usage: 'Last operation', help: 'Select Vercel providers for Search and Fetch in the built-in web settings. A saved key is never returned to this page.',
    readonly: 'Settings are unavailable or read-only in this profile.', caution: 'Free credits work only with eligible host models. An arbitrary paid model may consume purchased balance if your account has it.',
    error: 'Operation failed. Check the Harness connection and configuration.', ready: 'Ready', sources: 'Retrieved sources', page: 'Retrieved page Markdown', input: 'Input tokens', output: 'Output tokens', duration: 'Duration', cost: 'Reported cost', noCost: 'Cost was not reported. Check Vercel usage for the bill.',
  },
  zh: {
    title: 'Vercel 联网工具', model: '宿主模型（独立于聊天模型）', apiKeyEnv: '凭据引用名称',
    maxResults: '搜索结果上限', timeoutMs: '超时（毫秒）', maxOutputTokens: '宿主输出 token 上限', maxContentChars: '网页字符上限',
    save: '保存设置', saved: '设置已保存', key: 'Gateway API Key', saveKey: '保存密钥', configured: '已配置密钥', missing: '未配置密钥',
    testSearch: '测试搜索 · 消耗额度', testFetch: '测试抓取 · 消耗额度', busy: '处理中…', refresh: '刷新状态',
    fee: 'Search、Fetch 每次计费调用各 $0.00075，另计宿主模型 tokens。测试会消耗 Vercel 余额；插件不会购买额度。',
    usage: '最近一次调用', help: '在内置联网设置中为搜索、抓取选择 Vercel 提供者。已保存的密钥不会回传到此页面。',
    readonly: '当前 profile 的设置不可用或只读。', caution: '免费额度仅支持符合条件的宿主模型。如果账户已有付费余额，选择付费模型可能消耗该余额。',
    error: '操作失败，请检查 Harness 连接及配置。', ready: '就绪', sources: '检索来源', page: '抓取的网页 Markdown', input: '输入 tokens', output: '输出 tokens', duration: '耗时', cost: '接口报告费用', noCost: '接口未返回费用，请以 Vercel 用量页为准。',
  },
}
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid var(--dsw-alias-border-l4, #cbd5e1)', borderRadius: 6, background: 'var(--dsw-alias-bg-layer-3, #fff)', color: 'inherit', font: 'inherit' }
export function SettingsCard({ ctx, scope }) {
  const locale = useSyncExternalStore(cb => ctx.locale.subscribe(cb), () => ctx.locale.getSnapshot(), () => ctx.locale.getSnapshot())
  const lang = String(locale?.locale ?? locale?.language ?? locale?.active ?? 'en').startsWith('zh') ? 'zh' : 'en'
  const t = copy[lang]
  const snapshot = useSyncExternalStore(cb => scope.subscribe(cb), () => scope.getSnapshot(), () => scope.getSnapshot())
  const [draft, setDraft] = useState(() => ({ ...DEFAULTS, ...snapshot?.value }))
  const [key, setKey] = useState(''), [state, setState] = useState(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { setDraft({ ...DEFAULTS, ...snapshot?.value }) }, [snapshot?.value])
  async function remote(method, ...args) {
    const response = await ctx.remote.vercelWeb[method](...args)
    if (!response.ok) throw new Error(t.error)
    return response.value
  }
  async function refresh() { const next = await remote('status'); setState(next); return next }
  useEffect(() => { let active = true; remote('status').then(s => { if (active) setState(s) }).catch(() => { if (active) setMessage(t.error) }); return () => { active = false } }, [snapshot?.value?.apiKeyEnv])
  async function action(task) {
    setBusy(true); setMessage('')
    try { await task() } catch { setMessage(t.error) } finally { setBusy(false) }
  }
  async function save() {
    try { validateConfig(draft) } catch (e) { setMessage(e.message); return }
    await action(async () => {
      await scope.mutate(FIELDS.map(field => ({ op: 'set', path: [field], value: draft[field] })), snapshot.revision)
      await refresh(); setMessage(t.saved)
    })
  }
  async function storeKey() {
    const submitted = key; setKey('')
    await action(async () => {
      const result = await remote('saveKey', submitted)
      setMessage(result.ok ? t.configured : result.message); await refresh()
    })
  }
  async function probe(operation) {
    await action(async () => {
      const result = await remote('probe', operation)
      setState(s => ({ ...s, probe: result, report: result.report ?? s?.report }))
      setMessage(result.ok ? t.ready : `${result.code}: ${result.message}`)
    })
  }
  const writable = snapshot?.writable === true
  return <section aria-label={t.title} style={{ maxWidth: 720, padding: 16, color: 'var(--dsw-alias-label-primary, #172033)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
    <h2 style={{ marginTop: 0 }}>{t.title}</h2>
    <p>{t.fee}</p><p style={{ fontSize: 13 }}>{t.caution}</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      {FIELDS.map(field => <label key={field} style={{ display: 'grid', gap: 4 }}>{t[field]}
        <input aria-label={t[field]} style={inputStyle} disabled={!writable || busy} type={typeof DEFAULTS[field] === 'number' ? 'number' : 'text'} value={draft[field]} onChange={e => setDraft(s => ({ ...s, [field]: typeof DEFAULTS[field] === 'number' ? Number(e.target.value) : e.target.value }))} />
      </label>)}
    </div>
    <p><button disabled={!writable || busy} onClick={save}>{t.save}</button> {!writable && t.readonly}</p>
    <hr />
    <p role="status">{state?.credential?.configured ? t.configured : t.missing} · {state?.config?.apiKeyEnv ?? DEFAULTS.apiKeyEnv}</p>
    <label style={{ display: 'grid', gap: 4 }}>{t.key}<input aria-label={t.key} style={inputStyle} type="password" autoComplete="off" spellCheck={false} value={key} disabled={busy || state?.credential?.writable !== true} onChange={e => setKey(e.target.value)} /></label>
    <p><button disabled={!key || busy || state?.credential?.writable !== true} onClick={storeKey}>{t.saveKey}</button> <button disabled={busy} onClick={() => action(refresh)}>{t.refresh}</button></p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <button disabled={busy || !state?.credential?.configured} onClick={() => probe('search')}>{t.testSearch}</button>
      <button disabled={busy || !state?.credential?.configured} onClick={() => probe('fetch')}>{t.testFetch}</button>
    </div>
    <p role="status" aria-live="polite">{busy ? t.busy : message}</p>
    {state?.report && <details open><summary>{t.usage}</summary>
      <p>{state.report.model}</p>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <dt>{t.input}</dt><dd>{state.report.usage.inputTokens ?? '—'}</dd>
        <dt>{t.output}</dt><dd>{state.report.usage.outputTokens ?? '—'}</dd>
        <dt>{t.duration}</dt><dd>{(state.report.durationMs / 1000).toFixed(2)} s</dd>
        <dt>{t.cost}</dt><dd>{state.report.costs.cost !== undefined ? `$${state.report.costs.cost}` : '—'}</dd>
      </dl>
      {state.report.costs.cost === undefined && <p>{t.noCost}</p>}
    </details>}
    {state?.probe?.ok && state.probe.result.sources && <div><h3>{t.sources}</h3><ul>{state.probe.result.sources.map(source => <li key={source.url}>
      <a href={source.url} target="_blank" rel="noreferrer">{source.title ?? source.url}</a><p>{source.snippet ?? source.summary ?? ''}</p>
    </li>)}</ul></div>}
    {state?.probe?.ok && state.probe.result.body && <div><h3>{t.page}</h3><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 300, overflow: 'auto' }}>{state.probe.result.body.content}</pre></div>}
    <p style={{ fontSize: 13 }}>{t.help}</p>
  </section>
}
export async function apply(ctx) {
  const unmount = await ctx.remote.$mount(remoteContribution)
  ctx.effect(() => unmount)
  const register = (c, scope, slot, key) => c.slots.inject(slot, () => c.slots.register(
    { name: slot, key }, props => props?.view === 'summary' ? React.createElement('span', null, 'Vercel · DeepSeek Search / Fetch') : React.createElement(SettingsCard, { ctx: c, scope }),
  ))
  ctx.inject(['configForms'], c => {
    const wire = () => {
      const scope = c.configForms.get(NAMESPACE)
      for (const [slot, key] of [['plugins.bundle.config', PACKAGE_NAME], ['plugins.row.config', `${PACKAGE_NAME}#${ROW_ID}`]]) {
        register(c, scope, slot, key)
      }
    }
    if (c.configForms.whileServed) c.effect(() => c.configForms.whileServed([NAMESPACE], wire))
    else wire()
  })
  ctx.inject(['settingsScope'], c => register(c, c.settingsScope.bind({ namespace: NAMESPACE }), 'settings.plugin.item', NAMESPACE))
}
