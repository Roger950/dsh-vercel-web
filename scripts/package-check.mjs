import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const tarball = resolve(process.argv[2] ?? '../../outputs/dsh-vercel-web-0.1.0.tgz')
const { mkdir } = await import('node:fs/promises')
const dir = resolve('work/packed-smoke')
await mkdir(dir, { recursive: true })
const extraction = spawnSync('tar', ['-xzf', tarball, '-C', dir], { encoding: 'utf8' })
if (extraction.status !== 0) throw Error('Tarball extraction failed')
const pkg = JSON.parse(await readFile(resolve(dir, 'package/package.json'), 'utf8'))
assert.equal(pkg.name, 'dsh-vercel-web')
const module = await import(pathToFileURL(resolve(dir, 'package', pkg.main)).href)
assert.equal(module.name, 'vercel-web'); assert.equal(typeof module.apply, 'function')
const body = await readFile(resolve(dir, 'package/lib/client.js'), 'utf8')
assert.ok(body.includes('window.__ModuleLoader__.load'))
console.log('Runtime tarball imports successfully; Host and browser entry points present.')
