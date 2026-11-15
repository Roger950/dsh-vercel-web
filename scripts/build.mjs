import { build } from 'esbuild'
await build({
  entryPoints: ['src/client/index.jsx'], outfile: 'lib/client.js', bundle: true,
  platform: 'browser', format: 'cjs', external: ['react'], target: 'es2022',
  banner: { js: `window.__ModuleLoader__.load({id:'dsh-vercel-web',factory:(require)=>{var module={exports:{}};var exports=module.exports;` },
  footer: { js: 'return module.exports;}});' },
  legalComments: 'inline',
})
