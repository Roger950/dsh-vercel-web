# dsh-vercel-web

[English](README.md)

通过 **Vercel AI Gateway 的 DeepSeek Search / Fetch**，为 DeepSeek Harness 提供原生 `web_search`、`web_fetch`。这是独立社区插件，不是 DeepSeek 或 Vercel 官方产品。

## 当前状态

0.1.0 为审核版。已通过真实 AI SDK 配合模拟 Gateway 响应的协议测试，并使用官方 Harness 包验证原生 provider 注册、配置重载和 Typert Remote 分发。真实 API 测试和完整桌面版的验证状态见源码包内 `VALIDATION.md`。模拟成功不代表真实 API 已成功。

插件使用原始 `toolResults`：搜索保留来源 URL、标题和摘要，抓取保留网页原始 Markdown；不会把宿主模型生成的回答当作网页原文。无需修改 Harness 核心，也无需 MCP 服务。

## 免费额度与费用

- 需要 Vercel **AI Gateway Key**，无需 DeepSeek Key。
- 默认宿主模型为 `meta/muse-spark-open`，独立于聊天模型。模型可用性和免费额度资格可能变化，使用前核对[支持免费额度的模型](https://vercel.com/ai-gateway/models?freeTier=true)。
- Search、Fetch 每次计费调用各 **$0.00075**，另计宿主模型输入、输出 tokens；网页内容也会进入宿主上下文。
- 插件不购买、不充值、不自动重试、不回退到其他计费服务。余额耗尽、模型受限或限流时明确报错。
- 插件不提供账单侧“仅使用免费额度”的硬性限制。如果账户已有购买额度，Gateway 仍可能扣除该余额。要保持只用每月免费额度，请保持免费层并选择符合条件的模型。
- 超时或取消不保证远端已完成的工作不计费。价格以 [Vercel 官方说明](https://vercel.com/docs/ai-gateway/models-and-providers/web-search)为准。

## 审核后安装

请使用此次交付的本地 tarball，不要直接安装公共 npm 上同名但未经审核的包。需要 Node.js 22 及以上版本。使用 Harness CLI 时：

```powershell
dsh plugin --profile desktop add "C:\路径\dsh-vercel-web-0.1.0.tgz"
```

只有桌面版、没有 `dsh` 命令时，使用桌面版自身的插件管理器安装本地插件包。`web` 与 `desktop` 是不同 profile；安装前备份原有桌面 profile 配置。

此 bundle 默认把搜索与抓取都切到 Vercel。已有用户配置可能覆盖 bundle 默认值：在“插件 → 内置插件设置 → Web search and fetch”中，分别选择 **Vercel · DeepSeek Search**、**Vercel · DeepSeek Fetch**。安装或移除后重启 Host。

打开本插件设置页（旧版在“设置 → 插件”），保留默认宿主模型，在密码输入框填入 Gateway Key 并保存。密钥通过 Harness 凭据服务保存为 `AI_GATEWAY_API_KEY`，不会回显或写入普通配置。若环境变量覆盖该引用，需要在原来源修改，或改用另一凭据引用。

分别点击“测试搜索”“测试抓取”即可验证。每次点击都可能消耗额度；界面显示真实检索来源、原始 Markdown 预览及接口返回的 token / 费用数据。费用缺失时显示未知，不显示为零。

## 配置项

| 配置 | 默认值 | 含义 |
|---|---|---|
| `apiKeyEnv` | `AI_GATEWAY_API_KEY` | Harness 凭据引用；只有缺少凭据服务时才使用进程环境变量 |
| `model` | `meta/muse-spark-open` | 支持工具调用及免费额度的宿主模型，不改聊天模型 |
| `maxResults` | `3` | 搜索结果数 1–50，与 Harness 请求上限取较小值 |
| `timeoutMs` | `60000` | 超时 1–120 秒 |
| `maxOutputTokens` | `512` | 宿主输出上限 1–2048 tokens |
| `maxContentChars` | `100000` | 网页 Markdown 返回字符上限，截断会明确标记 |

固定使用 Vercel 官方地址和锁定 SDK 的 `/v4/ai` 协议，不支持自定义网关地址或明文 `apiKey` 配置。搜索词最长 128 个 Unicode 字符；抓取仅接受不含用户名密码的 HTTP(S) URL，最长 8192 字符。

Fetch 成功时的 `statusCode: 200` 表示服务成功取回内容，并非插件独立观测到的目标网站状态码。工具不提供最终重定向 URL，因此保留请求 URL。网站访问限制由上游服务决定。

## 开发与隔离验收

```powershell
npm ci --ignore-scripts
npm run build
npm run check
npm test
npm pack
```

源码包包含开发专用预览：

```powershell
node scripts/preview.mjs
node scripts/preview.mjs --live
```

第一条使用带醒目标记的模拟 Gateway，不访问外网；第二条访问真实 Vercel，打开终端显示的本机地址后手动输入 Key。预览运行真实 Cordis、WebRuntime、Settings 和 Typert 服务，但不是完整 Harness 桌面程序；不读取 `~/.dsh`，密钥仅存进程内存。按 Ctrl+C 停止即清除。预览不会打进运行插件 tarball。

也可在启动进程中安全设置 `AI_GATEWAY_API_KEY` 后执行 `npm run test:live`，各测试一次搜索和抓取，首次失败即停止。不要把 Key 发到聊天、写入代码或作为命令行参数。

测试依赖使用官方 `0.1.5-rc.3` 包，匹配本机保留的包集。已实现新版配置表单及 provider 菜单接口接入；完整桌面运行时仍须按实际版本验收，不把运行时描述文件中的版本当作全部包的版本。

## 故障与恢复

- 401：检查或更换 Key。
- 402/403：检查免费模型资格、额度和账户限制；不要为通过测试购买 Credits。
- 429：稍后手动重试。
- 缺少原始工具结果、工具失败、无效数据：明确报错，不用模型回答填充。
- 配置 Key 后仍显示未配置：检查环境变量遮蔽、凭据引用及 Host 连接。

卸载前在内置联网设置中切回原搜索提供者，并将抓取切回 `http` 或原提供者，再禁用/移除此 bundle 并重启。bundle 层默认值会消失；用户层仍引用已移除 provider 时需要手动改回。共享的 `AI_GATEWAY_API_KEY` 可能被其他功能使用，不要随插件卸载一并删除。

## 隐私与发布

无遥测、无后台模型调用。查询词或 URL 会发送给 Vercel 及其上游服务。普通 Harness 工具结果仍可能按 Harness 自身设置写入会话历史。

此版未公开发布。发布前补齐真实验收、确认 npm 名称可用性、添加最终仓库信息并检查包内容。没有擅自创建 GitHub 仓库或 npm 发布记录。许可证为 MIT，参考及依赖见 `THIRD_PARTY_NOTICES.md`。
