# References and third-party notices

This plugin was independently implemented against public interfaces. No source files from community plugins were vendored.

Design references:

- [vitas/dsh-web-search-gateway](https://github.com/vitas/dsh-web-search-gateway), Apache-2.0: native web-provider architecture, configuration-form compatibility patterns and explicit connection tests.
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), MIT: `ctx.web` contracts, configuration scopes, credentials and Typert Remote carrier interfaces.
- [Vercel AI SDK](https://github.com/vercel/ai), Apache-2.0: official Gateway tools and raw `toolResults` examples.

Runtime dependencies installed with the package retain their own licenses:

- `ai` 7.0.173, `@ai-sdk/gateway` 4.0.146 and AI SDK transitive packages: Apache-2.0.
- Harness/Cordis/Schemastery peers: MIT (provided by the Host).
- React is external in the browser bundle and supplied by Harness, MIT.

Development dependencies (not bundled in the runtime tarball) include esbuild, React/ReactDOM and official Harness testing packages, under their respective MIT licenses. Dependency provenance, exact transitive versions and integrity hashes are recorded in `package-lock.json` in the source distribution. `npm ci` installs their original license files.
