import { readdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) await walk(path)
    else if (/\.(m?js)$/.test(path)) {
      const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' })
      if (result.status !== 0) throw new Error(result.stderr)
    }
  }
}
await walk('src/host'); await walk('src/shared'); await walk('scripts')
const bundle = await readFile('lib/client.js', 'utf8')
if (bundle.includes('node:') || /require\(["']@deepseek-ai\//.test(bundle)) throw new Error('Host dependency leaked into browser bundle')
console.log('Syntax and browser bundle checks passed.')
