# Validation — 0.1.0 review build

Date: 2026-11-15. This file distinguishes executed checks from pending qualification.

## Confirmed environment

- Windows x64, Node 24.21.0, npm 11.19.0.
- User's retained Harness runtime descriptor reports Desktop 0.2.1-rc.2; inspected shared Harness packages report 0.1.5-rc.3. These facts do not establish the active Desktop application's complete dependency set.
- Dependencies installed from the official npm registry with exact direct versions and a lockfile; install audit reported zero vulnerabilities.
- Daily `~/.dsh/profiles/desktop` configuration and credential files were not modified. No GitHub repository or npm release was created.

## Automated checks

- `npm test`: 28 passed, zero failed/skipped.
- Build and syntax checks passed. Browser bundle contains no Host-only package imports.
- Real `ai` 7.0.173 and `@ai-sdk/gateway` 4.0.146 tested against simulated HTTP responses at the fixed official protocol URL. Search records and Fetch Markdown survive `toolResults` mapping unchanged.
- Provider tests cover input limits, empty results, malformed/absent/multiple/error tool results, source deduplication and truncation, missing/rotated credentials, HTTP 401/402/403/429/500, cancellation, timeout and safe error reporting.
- Real Cordis/WebRuntime/Settings/Typert package integration verifies provider registration, credential writes without value readback, configuration persistence through plugin reload, exact Remote arguments and provider removal on unload.
- Client contract fixtures exercise both old settings slots and new bundle/row configuration slots. These do not replace a full Desktop smoke test.
- Chinese and English settings cards render from the compiled browser bundle.
- The public Gateway model-list endpoint returned HTTP 200 from local Node without authentication or model usage. This checks network reachability only.
- `npm pack` produced a 13-file runtime tarball. The extracted tarball's Host module imported successfully and its browser entry was present. Package/source scans found no real-key patterns or local user paths.

## Browser checks performed

The development-only isolated Host was opened in Edge. With mock Gateway responses:

- Chinese settings form rendered with readable controls and explicit cost copy.
- Search result limit was changed to 2 and saved; it remained 2 after plugin reload.
- Search probe displayed a real-shaped source record from the fixture.
- Fetch probe displayed the fixture's original Markdown.
- A dummy key was saved to isolated process memory; the password input cleared and the response contained only configured state.

The development-only preview uses real Harness services, a small browser transport shim and a mock Gateway. It is not an installation in the full Desktop shell and does not demonstrate live API access.

## Pending qualification

- Full Desktop plugin-manager load and settings-card verification against the user's running release. Intentionally not installed in the daily profile because the user requested review first.
- Availability of the final npm package name and final repository/maintainer metadata, to be checked before publication.

## Live API verification — passed

The user manually supplied the Gateway key to the isolated loopback test page. Its value was never read back, printed or stored in a file. Exactly one Search probe and one Fetch probe were executed, through the plugin's real AI SDK provider and Harness Remote service.

| Operation | Confirmed raw result | Input / output tokens | Duration | Gateway-reported cost |
|---|---|---|---|---|
| DeepSeek Search | Official Vercel AI Gateway Pricing source, with source URL and excerpt | 2,885 / 440 | 3.26 s | $0.00524065 |
| DeepSeek Fetch | Raw page Markdown retrieved from `https://example.com/`, including its documentation-example text | 1,678 / 302 | 2.70 s | $0.0032862 |

Both used `meta/muse-spark-open`. Reported costs total **$0.00852685**; these are Gateway metadata, not an independently reconciled billing statement. The fetched page text was returned from `toolResults`, not the model's generated answer. No additional model calls or automatic retries were made. After verification the isolated test process was stopped, releasing its in-memory credential. No credits were purchased.

Screenshots of the settings page and live Fetch result are included with the review deliverables. Full Desktop-shell installation remains deliberately pending review.

## Privacy / billing limits

The plugin cannot promise billing-side free-only enforcement. It does not purchase credits, retry automatically or change providers, but Gateway can consume purchased balance if the account has it. Host/model availability and the default model's free eligibility can change. Aborted requests may already be billed remotely. The fixed API uses the SDK-native Gateway tool protocol, not the earlier Playground endpoint.
