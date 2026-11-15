import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DEFAULTS } from '../src/shared/config.js'
const require = createRequire(import.meta.url)
async function client() {
  const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  let exported
  vm.runInNewContext(source, { window: { __ModuleLoader__: { load: ({ id, factory }) => { assert.equal(id, 'dsh-vercel-web'); exported = factory(require) } } }, console })
  return exported
}
const scope = { getSnapshot: () => ({ value: DEFAULTS, writable: true, status: 'ready' }), subscribe: () => () => {} }
test('browser bundle mounts its Remote contract and registers the old settings slot', async () => {
  const exported = await client(), registrations = [], mounted = []
  const ctx = {
    remote: { $mount: async value => { mounted.push(value); return () => {} } },
    slots: { inject: (name, callback) => callback(), register: (meta, component) => registrations.push({ meta, component }) },
    settingsScope: { bind: ({ namespace }) => { assert.equal(namespace, 'vercel-web'); return scope } },
    effect: fn => fn(),
    inject: (deps, fn) => { if (deps.every(name => ctx[name])) fn(ctx) },
  }
  await exported.apply(ctx)
  assert.equal(mounted[0].descriptors.length, 3)
  assert.equal(registrations.length, 1); assert.equal(registrations[0].meta.name, 'settings.plugin.item')
})
test('new configuration form registers bundle and row slots with exact package identity', async () => {
  const exported = await client(), entries = []
  const ctx = {
    remote: { $mount: async () => () => {} }, effect: fn => fn(),
    configForms: { get: () => scope, whileServed: (names, callback) => { assert.deepEqual([...names], ['vercel-web']); callback(); return () => {} } },
    slots: { inject: (name, fn) => fn(), register: (meta) => entries.push(meta) },
    inject: (deps, fn) => { if (deps.every(name => ctx[name])) fn(ctx) },
  }
  await exported.apply(ctx)
  assert.deepEqual(entries.map(e => e.key), ['dsh-vercel-web', 'dsh-vercel-web#vercel-web'])
})
for (const [active, title] of [['zh', 'Vercel 联网工具'], ['en', 'Vercel web tools']]) {
  test(`settings card renders ${active} without exposing saved credential material`, async () => {
    const exported = await client()
    const snapshot = { active }
    const ctx = { locale: { getSnapshot: () => snapshot, subscribe: () => () => {} } }
    const html = renderToStaticMarkup(React.createElement(exported.SettingsCard, { ctx, scope }))
    assert.ok(html.includes(title)); assert.ok(html.includes('type="password"'))
    assert.ok(!html.includes('Authorization:')); assert.ok(!html.includes('Bearer '))
    assert.ok(html.includes('meta/muse-spark-open'))
  })
}
