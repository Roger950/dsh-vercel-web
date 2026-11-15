window.__ModuleLoader__.load({id:'dsh-vercel-web',factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  SettingsCard: () => SettingsCard,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_react = __toESM(require("react"), 1);

// src/shared/config.js
var PACKAGE_NAME = "dsh-vercel-web";
var NAMESPACE = "vercel-web";
var ROW_ID = "vercel-web";
var DEFAULTS = Object.freeze({
  apiKeyEnv: "AI_GATEWAY_API_KEY",
  model: "meta/muse-spark-open",
  maxResults: 3,
  timeoutMs: 6e4,
  maxOutputTokens: 512,
  maxContentChars: 1e5
});
var FIELDS = Object.keys(DEFAULTS);
function validateConfig(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value.apiKeyEnv)) throw new Error("Invalid credential reference");
  if (typeof value.model !== "string" || !/^[\w.-]+\/[\w./:-]+$/.test(value.model)) throw new Error("Use a creator/model identifier");
  for (const [key, min, max] of [
    ["maxResults", 1, 50],
    ["timeoutMs", 1e3, 12e4],
    ["maxOutputTokens", 1, 2048],
    ["maxContentChars", 1e3, 5e5]
  ]) {
    if (!Number.isInteger(value[key]) || value[key] < min || value[key] > max) throw new Error(`Invalid ${key}: expected ${min}\u2013${max}`);
  }
  return value;
}

// src/shared/remote.js
var json = { mode: "src-json" };
var remoteContribution = {
  package: "dsh-vercel-web",
  descriptors: [
    ["status", []],
    ["saveKey", ["value"]],
    ["probe", ["operation"]]
  ].map(([method, parameters]) => ({
    id: `dsh-vercel-web#vercelWeb/${method}`,
    service: "vercelWeb",
    namespace: "vercelWeb",
    method,
    invocation: { kind: "direct" },
    parameters: parameters.map((name2) => ({ name: name2, wire: name2, source: "json", codec: json })),
    ...method === "probe" ? { cancellation: { parameter: "signal" } } : {},
    result: json
  }))
};

// src/client/index.jsx
var name = "vercel-web-client";
var inject = ["slots", "locale", "remote"];
var copy = {
  en: {
    title: "Vercel web tools",
    model: "Host model (separate from chat)",
    apiKeyEnv: "Credential reference",
    maxResults: "Search result limit",
    timeoutMs: "Timeout (ms)",
    maxOutputTokens: "Host output token limit",
    maxContentChars: "Page character limit",
    save: "Save settings",
    saved: "Settings saved",
    key: "Gateway API key",
    saveKey: "Store key",
    configured: "Key configured",
    missing: "Key not configured",
    testSearch: "Test Search \xB7 uses credits",
    testFetch: "Test Fetch \xB7 uses credits",
    busy: "Working\u2026",
    refresh: "Refresh status",
    fee: "Each billable Search or Fetch costs $0.00075 plus host model tokens. Tests consume your Vercel balance. No credits are purchased by this plugin.",
    usage: "Last operation",
    help: "Select Vercel providers for Search and Fetch in the built-in web settings. A saved key is never returned to this page.",
    readonly: "Settings are unavailable or read-only in this profile.",
    caution: "Free credits work only with eligible host models. An arbitrary paid model may consume purchased balance if your account has it.",
    error: "Operation failed. Check the Harness connection and configuration.",
    ready: "Ready",
    sources: "Retrieved sources",
    page: "Retrieved page Markdown",
    input: "Input tokens",
    output: "Output tokens",
    duration: "Duration",
    cost: "Reported cost",
    noCost: "Cost was not reported. Check Vercel usage for the bill."
  },
  zh: {
    title: "Vercel \u8054\u7F51\u5DE5\u5177",
    model: "\u5BBF\u4E3B\u6A21\u578B\uFF08\u72EC\u7ACB\u4E8E\u804A\u5929\u6A21\u578B\uFF09",
    apiKeyEnv: "\u51ED\u636E\u5F15\u7528\u540D\u79F0",
    maxResults: "\u641C\u7D22\u7ED3\u679C\u4E0A\u9650",
    timeoutMs: "\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09",
    maxOutputTokens: "\u5BBF\u4E3B\u8F93\u51FA token \u4E0A\u9650",
    maxContentChars: "\u7F51\u9875\u5B57\u7B26\u4E0A\u9650",
    save: "\u4FDD\u5B58\u8BBE\u7F6E",
    saved: "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58",
    key: "Gateway API Key",
    saveKey: "\u4FDD\u5B58\u5BC6\u94A5",
    configured: "\u5DF2\u914D\u7F6E\u5BC6\u94A5",
    missing: "\u672A\u914D\u7F6E\u5BC6\u94A5",
    testSearch: "\u6D4B\u8BD5\u641C\u7D22 \xB7 \u6D88\u8017\u989D\u5EA6",
    testFetch: "\u6D4B\u8BD5\u6293\u53D6 \xB7 \u6D88\u8017\u989D\u5EA6",
    busy: "\u5904\u7406\u4E2D\u2026",
    refresh: "\u5237\u65B0\u72B6\u6001",
    fee: "Search\u3001Fetch \u6BCF\u6B21\u8BA1\u8D39\u8C03\u7528\u5404 $0.00075\uFF0C\u53E6\u8BA1\u5BBF\u4E3B\u6A21\u578B tokens\u3002\u6D4B\u8BD5\u4F1A\u6D88\u8017 Vercel \u4F59\u989D\uFF1B\u63D2\u4EF6\u4E0D\u4F1A\u8D2D\u4E70\u989D\u5EA6\u3002",
    usage: "\u6700\u8FD1\u4E00\u6B21\u8C03\u7528",
    help: "\u5728\u5185\u7F6E\u8054\u7F51\u8BBE\u7F6E\u4E2D\u4E3A\u641C\u7D22\u3001\u6293\u53D6\u9009\u62E9 Vercel \u63D0\u4F9B\u8005\u3002\u5DF2\u4FDD\u5B58\u7684\u5BC6\u94A5\u4E0D\u4F1A\u56DE\u4F20\u5230\u6B64\u9875\u9762\u3002",
    readonly: "\u5F53\u524D profile \u7684\u8BBE\u7F6E\u4E0D\u53EF\u7528\u6216\u53EA\u8BFB\u3002",
    caution: "\u514D\u8D39\u989D\u5EA6\u4EC5\u652F\u6301\u7B26\u5408\u6761\u4EF6\u7684\u5BBF\u4E3B\u6A21\u578B\u3002\u5982\u679C\u8D26\u6237\u5DF2\u6709\u4ED8\u8D39\u4F59\u989D\uFF0C\u9009\u62E9\u4ED8\u8D39\u6A21\u578B\u53EF\u80FD\u6D88\u8017\u8BE5\u4F59\u989D\u3002",
    error: "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 Harness \u8FDE\u63A5\u53CA\u914D\u7F6E\u3002",
    ready: "\u5C31\u7EEA",
    sources: "\u68C0\u7D22\u6765\u6E90",
    page: "\u6293\u53D6\u7684\u7F51\u9875 Markdown",
    input: "\u8F93\u5165 tokens",
    output: "\u8F93\u51FA tokens",
    duration: "\u8017\u65F6",
    cost: "\u63A5\u53E3\u62A5\u544A\u8D39\u7528",
    noCost: "\u63A5\u53E3\u672A\u8FD4\u56DE\u8D39\u7528\uFF0C\u8BF7\u4EE5 Vercel \u7528\u91CF\u9875\u4E3A\u51C6\u3002"
  }
};
var inputStyle = { width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid var(--dsw-alias-border-l4, #cbd5e1)", borderRadius: 6, background: "var(--dsw-alias-bg-layer-3, #fff)", color: "inherit", font: "inherit" };
function SettingsCard({ ctx, scope }) {
  const locale = (0, import_react.useSyncExternalStore)((cb) => ctx.locale.subscribe(cb), () => ctx.locale.getSnapshot(), () => ctx.locale.getSnapshot());
  const lang = String(locale?.locale ?? locale?.language ?? locale?.active ?? "en").startsWith("zh") ? "zh" : "en";
  const t = copy[lang];
  const snapshot = (0, import_react.useSyncExternalStore)((cb) => scope.subscribe(cb), () => scope.getSnapshot(), () => scope.getSnapshot());
  const [draft, setDraft] = (0, import_react.useState)(() => ({ ...DEFAULTS, ...snapshot?.value }));
  const [key, setKey] = (0, import_react.useState)(""), [state, setState] = (0, import_react.useState)(null), [message, setMessage] = (0, import_react.useState)(""), [busy, setBusy] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    setDraft({ ...DEFAULTS, ...snapshot?.value });
  }, [snapshot?.value]);
  async function remote(method, ...args) {
    const response = await ctx.remote.vercelWeb[method](...args);
    if (!response.ok) throw new Error(t.error);
    return response.value;
  }
  async function refresh() {
    const next = await remote("status");
    setState(next);
    return next;
  }
  (0, import_react.useEffect)(() => {
    let active = true;
    remote("status").then((s) => {
      if (active) setState(s);
    }).catch(() => {
      if (active) setMessage(t.error);
    });
    return () => {
      active = false;
    };
  }, [snapshot?.value?.apiKeyEnv]);
  async function action(task) {
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    try {
      validateConfig(draft);
    } catch (e) {
      setMessage(e.message);
      return;
    }
    await action(async () => {
      await scope.mutate(FIELDS.map((field) => ({ op: "set", path: [field], value: draft[field] })), snapshot.revision);
      await refresh();
      setMessage(t.saved);
    });
  }
  async function storeKey() {
    const submitted = key;
    setKey("");
    await action(async () => {
      const result = await remote("saveKey", submitted);
      setMessage(result.ok ? t.configured : result.message);
      await refresh();
    });
  }
  async function probe(operation) {
    await action(async () => {
      const result = await remote("probe", operation);
      setState((s) => ({ ...s, probe: result, report: result.report ?? s?.report }));
      setMessage(result.ok ? t.ready : `${result.code}: ${result.message}`);
    });
  }
  const writable = snapshot?.writable === true;
  return /* @__PURE__ */ import_react.default.createElement("section", { "aria-label": t.title, style: { maxWidth: 720, padding: 16, color: "var(--dsw-alias-label-primary, #172033)", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 } }, /* @__PURE__ */ import_react.default.createElement("h2", { style: { marginTop: 0 } }, t.title), /* @__PURE__ */ import_react.default.createElement("p", null, t.fee), /* @__PURE__ */ import_react.default.createElement("p", { style: { fontSize: 13 } }, t.caution), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 } }, FIELDS.map((field) => /* @__PURE__ */ import_react.default.createElement("label", { key: field, style: { display: "grid", gap: 4 } }, t[field], /* @__PURE__ */ import_react.default.createElement("input", { "aria-label": t[field], style: inputStyle, disabled: !writable || busy, type: typeof DEFAULTS[field] === "number" ? "number" : "text", value: draft[field], onChange: (e) => setDraft((s) => ({ ...s, [field]: typeof DEFAULTS[field] === "number" ? Number(e.target.value) : e.target.value })) })))), /* @__PURE__ */ import_react.default.createElement("p", null, /* @__PURE__ */ import_react.default.createElement("button", { disabled: !writable || busy, onClick: save }, t.save), " ", !writable && t.readonly), /* @__PURE__ */ import_react.default.createElement("hr", null), /* @__PURE__ */ import_react.default.createElement("p", { role: "status" }, state?.credential?.configured ? t.configured : t.missing, " \xB7 ", state?.config?.apiKeyEnv ?? DEFAULTS.apiKeyEnv), /* @__PURE__ */ import_react.default.createElement("label", { style: { display: "grid", gap: 4 } }, t.key, /* @__PURE__ */ import_react.default.createElement("input", { "aria-label": t.key, style: inputStyle, type: "password", autoComplete: "off", spellCheck: false, value: key, disabled: busy || state?.credential?.writable !== true, onChange: (e) => setKey(e.target.value) })), /* @__PURE__ */ import_react.default.createElement("p", null, /* @__PURE__ */ import_react.default.createElement("button", { disabled: !key || busy || state?.credential?.writable !== true, onClick: storeKey }, t.saveKey), " ", /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy, onClick: () => action(refresh) }, t.refresh)), /* @__PURE__ */ import_react.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 } }, /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy || !state?.credential?.configured, onClick: () => probe("search") }, t.testSearch), /* @__PURE__ */ import_react.default.createElement("button", { disabled: busy || !state?.credential?.configured, onClick: () => probe("fetch") }, t.testFetch)), /* @__PURE__ */ import_react.default.createElement("p", { role: "status", "aria-live": "polite" }, busy ? t.busy : message), state?.report && /* @__PURE__ */ import_react.default.createElement("details", { open: true }, /* @__PURE__ */ import_react.default.createElement("summary", null, t.usage), /* @__PURE__ */ import_react.default.createElement("p", null, state.report.model), /* @__PURE__ */ import_react.default.createElement("dl", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 } }, /* @__PURE__ */ import_react.default.createElement("dt", null, t.input), /* @__PURE__ */ import_react.default.createElement("dd", null, state.report.usage.inputTokens ?? "\u2014"), /* @__PURE__ */ import_react.default.createElement("dt", null, t.output), /* @__PURE__ */ import_react.default.createElement("dd", null, state.report.usage.outputTokens ?? "\u2014"), /* @__PURE__ */ import_react.default.createElement("dt", null, t.duration), /* @__PURE__ */ import_react.default.createElement("dd", null, (state.report.durationMs / 1e3).toFixed(2), " s"), /* @__PURE__ */ import_react.default.createElement("dt", null, t.cost), /* @__PURE__ */ import_react.default.createElement("dd", null, state.report.costs.cost !== void 0 ? `$${state.report.costs.cost}` : "\u2014")), state.report.costs.cost === void 0 && /* @__PURE__ */ import_react.default.createElement("p", null, t.noCost)), state?.probe?.ok && state.probe.result.sources && /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("h3", null, t.sources), /* @__PURE__ */ import_react.default.createElement("ul", null, state.probe.result.sources.map((source) => /* @__PURE__ */ import_react.default.createElement("li", { key: source.url }, /* @__PURE__ */ import_react.default.createElement("a", { href: source.url, target: "_blank", rel: "noreferrer" }, source.title ?? source.url), /* @__PURE__ */ import_react.default.createElement("p", null, source.snippet ?? source.summary ?? ""))))), state?.probe?.ok && state.probe.result.body && /* @__PURE__ */ import_react.default.createElement("div", null, /* @__PURE__ */ import_react.default.createElement("h3", null, t.page), /* @__PURE__ */ import_react.default.createElement("pre", { style: { whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 300, overflow: "auto" } }, state.probe.result.body.content)), /* @__PURE__ */ import_react.default.createElement("p", { style: { fontSize: 13 } }, t.help));
}
async function apply(ctx) {
  const unmount = await ctx.remote.$mount(remoteContribution);
  ctx.effect(() => unmount);
  const register = (c, scope, slot, key) => c.slots.inject(slot, () => c.slots.register(
    { name: slot, key },
    (props) => props?.view === "summary" ? import_react.default.createElement("span", null, "Vercel \xB7 DeepSeek Search / Fetch") : import_react.default.createElement(SettingsCard, { ctx: c, scope })
  ));
  ctx.inject(["configForms"], (c) => {
    const wire = () => {
      const scope = c.configForms.get(NAMESPACE);
      for (const [slot, key] of [["plugins.bundle.config", PACKAGE_NAME], ["plugins.row.config", `${PACKAGE_NAME}#${ROW_ID}`]]) {
        register(c, scope, slot, key);
      }
    };
    if (c.configForms.whileServed) c.effect(() => c.configForms.whileServed([NAMESPACE], wire));
    else wire();
  });
  ctx.inject(["settingsScope"], (c) => register(c, c.settingsScope.bind({ namespace: NAMESPACE }), "settings.plugin.item", NAMESPACE));
}
return module.exports;}});
