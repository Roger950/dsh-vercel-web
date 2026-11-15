import React from 'react'
import { createRoot } from 'react-dom/client'
import { SettingsCard } from '../src/client/index.jsx'
const listeners = new Set()
let snapshot = { status: 'loading', value: undefined, writable: true, revision: undefined }
async function request(path, value) {
  const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-preview-token': window.previewToken }, body: JSON.stringify(value) })
  if (!response.ok) throw new Error('Preview request failed')
  return response.json()
}
const scope = {
  getSnapshot: () => snapshot,
  subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
  async mutate(ops, revision) { await request('/settings', { ops, revision }); await reload() },
}
async function reload() {
  const response = await request('/remote', { method: 'status', args: {} })
  snapshot = { status: 'ready', value: response.value.config, writable: true, revision: undefined }
  listeners.forEach(fn => fn())
}
const localeState = { active: 'zh', revision: 0 }
const ctx = {
  locale: { getSnapshot: () => localeState, subscribe: () => () => {} },
  remote: { vercelWeb: Object.fromEntries(['status', 'saveKey', 'probe'].map(method => [method, (...args) => request('/remote', { method, args: method === 'saveKey' ? { value: args[0] } : method === 'probe' ? { operation: args[0] } : {} })])) },
}
document.querySelector('#restart').onclick = async () => { await request('/restart', {}); await reload() }
await reload()
createRoot(document.getElementById('root')).render(<SettingsCard ctx={ctx} scope={scope} />)
