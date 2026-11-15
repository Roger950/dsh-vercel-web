# dsh-vercel-web

[简体中文](README.zh-CN.md)

Native DeepSeek Harness `web_search` and `web_fetch` providers using **DeepSeek Search and Fetch through Vercel AI Gateway**. This is an independent community plugin, not an official DeepSeek or Vercel product.

## Status

Version 0.1.0 is a review build. The real AI SDK/Gateway transport has been tested with simulated HTTP responses, and provider registration, configuration reload and carrier-neutral Remote dispatch have been exercised with actual Harness packages. See `VALIDATION.md` in the source distribution for the current live-test and desktop qualification status. Mock success is not evidence of a successful live API call.

The plugin does not modify Harness core or start an MCP service. Search returns the tool's actual source records; Fetch returns its original Markdown. The auxiliary model's prose is never used as evidence or page text.

## Requirements and costs

- Node.js 22 or later. The local development environment used Node 24.21.0.
- DeepSeek Harness with `ctx.web` providers, credentials and Typert Remote support. The source tests use official `0.1.5-rc.3` packages, matching the locally retained package set. Newer provider-selection and configuration-form interfaces are supported, but must be qualified against the actual Desktop build before claiming full compatibility.
- A Vercel **AI Gateway** key and remaining credits. No separate DeepSeek key is required.
- Default auxiliary model: `meta/muse-spark-open`. This does not change your chat model. Eligibility and prices can change: check the [free-credit model list](https://vercel.com/ai-gateway/models?freeTier=true).

Each billable Search or Fetch costs **$0.00075**, plus auxiliary model input/output tokens, including tool content. Failed/empty tool operations have no tool charge according to Vercel's documentation, but model usage or an operation that finishes after a local timeout can still cost credits. [Official tool pricing](https://vercel.com/docs/ai-gateway/models-and-providers/web-search).

No top-up, payment, subscription, cross-provider fallback or automatic retry is implemented. This does **not** impose a billing-side free-only policy: if your Vercel account has purchased credits, Gateway can consume them. Remain on the free tier and use eligible models to meet a free-credit-only goal. Never buy credits just to pass the connection test.

## Install after review

Use the reviewed tarball, not an unreviewed name from the public npm registry. The examples assume you have the Harness `dsh` CLI. Desktop-only users can use its own plugin manager to install the local package into the Desktop profile; do not assume a CLI installation into `web` changes Desktop.

```powershell
dsh plugin --profile desktop add "C:\path\to\dsh-vercel-web-0.1.0.tgz"
```

Installing this bundle selects **both** `vercel-deepseek-search` and `vercel-deepseek-fetch` in its bundle layer. Save a copy of your existing Desktop profile configuration first. Existing user-layer overrides can take precedence; select these providers explicitly in **Plugins → Built-in plugin settings → Web search and fetch** when the menus are available. Restart the Host after installation.

Open the plugin's settings page (older builds: Settings → Plugins), keep the default host model, and enter the Gateway key in its password field. The key is stored only through the Harness credential service under `AI_GATEWAY_API_KEY`. Existing keys are never returned to the page. If an environment value shadows that reference, rotate it at its source or use another credential reference.

The settings card exposes separate Search and Fetch probe buttons. Each performs one billable-usage-capable request. It shows actual sources or a bounded Markdown preview and the usage/cost fields reported by Gateway. An absent cost is shown as unknown, never zero.

### Settings

| Field | Default | Behavior |
|---|---|---|
| `apiKeyEnv` | `AI_GATEWAY_API_KEY` | Harness credential reference; process environment is used only when no credential service exists |
| `model` | `meta/muse-spark-open` | Independent auxiliary model; choose a free-credit-eligible, tool-capable model |
| `maxResults` | `3` | Search count, 1–50; a smaller Harness request limit wins |
| `timeoutMs` | `60000` | Timeout, 1–120 seconds |
| `maxOutputTokens` | `512` | Auxiliary output cap, 1–2048 tokens |
| `maxContentChars` | `100000` | Returned Markdown character cap; truncation is explicit |

Both providers always call the fixed official Gateway origin using the pinned SDK's `/v4/ai` protocol. Custom endpoints and plaintext `apiKey` configuration are deliberately unsupported. Search queries must fit DeepSeek's 128-Unicode-character limit; Fetch accepts HTTP(S) URLs without embedded credentials, up to 8192 characters.

Fetch reports `statusCode: 200` when the retrieval service succeeds, not an independently observed target HTTP status. Gateway does not expose the final redirected URL through this tool, so the requested URL is retained. Website access restrictions and unavailable pages remain upstream limitations.

## Development and isolated verification

```powershell
npm ci --ignore-scripts
npm run build
npm run check
npm test
npm pack
```

The source distribution includes a development-only host:

```powershell
node scripts/preview.mjs         # mock Gateway; no external calls
node scripts/preview.mjs --live  # real Gateway; open the printed loopback URL
```

Both modes run real Cordis, WebRuntime, Settings and Typert services in isolation. They read no `~/.dsh` configuration and keep entered keys only in process memory. They are **not** the full Desktop application. Stop with Ctrl+C to clear the key. The mock banner identifies simulated results. The preview is excluded from the runtime tarball.

For an opt-in terminal check, set `AI_GATEWAY_API_KEY` in the launching process using your own secure workflow and run `npm run test:live`. It tests one search and one fetch, stops on the first failure, and never prints the key. Do not put keys in command-line arguments or share terminal histories containing them.

## Failure handling

- Missing key: configure the credential reference in Harness.
- 401: replace the Gateway key.
- 402/403: stop and check eligibility or credit renewal. There is no paid fallback.
- 429: retry manually later; no automatic retries are made.
- No raw tool result, invalid payload or tool error: fail explicitly rather than substitute model text.
- Cancellation/timeout: abort the HTTP call. Server-side work may already be billable.

## Disable / restore

Before removing the plugin, select the previous Search provider and `http` (or your previous Fetch provider) in built-in web settings. Then disable/remove the bundle in the same Desktop profile and restart. Bundle-layer defaults disappear on removal; user-layer selections of a removed provider must be changed explicitly. Do not delete the shared `AI_GATEWAY_API_KEY` credential if another integration uses it.

## Privacy and release

No telemetry or background model requests. The host sends the query or URL to Vercel and its upstream services. UI probes are explicit actions. SDK exceptions, request headers and unfiltered provider metadata are never logged or forwarded. The plugin keeps only bounded usage metadata in memory; Harness itself can retain normal conversation tool results according to its own settings.

This build has not been published. Before publishing: complete `VALIDATION.md`, confirm Desktop compatibility, check `npm pack --dry-run`, confirm name availability, add the final repository metadata, and run the secret/package-content checks. No repository URL or maintainer identity is fabricated in the manifest.

MIT. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for references and dependencies.
