# 安装与管理

安装位置应是实际运行 Codex 的机器。使用远程 CLI 时在远程安装；不同 CODEX_HOME 的 profile 分别管理插件。本文以本地编排的 Codex CLI 为准，不把 CLI 的结果当作 App 线程执行 Hook 的证明。

## 检查环境

需要 Node.js 20+、Git，以及提供原生插件和 `/hooks` 的 Codex CLI。Node 和 Git 必须在 Hook 进程的 PATH 中可见；终端、IDE 和桌面程序的 PATH 可能不同。

```bash
codex --version
node --version
git --version
codex plugin --help
```

已测环境为 Linux CLI 0.159.0-alpha.7，最低兼容版本及 Windows/macOS App 原生执行尚未确定。云编排的 dots/Work Cloud 不支持本地插件命令 Hook，即使执行工具在电脑上。版本与行为证据见 [验证记录](../VERIFICATION.md)。

## 从 GitHub 安装

本仓库同时提供插件源码和 marketplace。通常无需先克隆仓库或下载压缩包，在实际运行 Codex 的终端执行：

```bash
codex plugin marketplace add limymy/codex-repo-knowledge
codex plugin add repo-knowledge@codex-repo-knowledge
codex plugin list --marketplace codex-repo-knowledge --json
```

以上命令也适用于 Windows PowerShell。当前版本为 `0.1.0-alpha.2+codex.20260930145548`；将列表中的安装版本与本仓库 `.codex-plugin/plugin.json` 核对。marketplace 名为 `codex-repo-knowledge`，插件名为 `repo-knowledge`。若已有同名 marketplace，先用 `codex plugin marketplace list` 检查来源，避免装到另一副本。

### 使用本地源码开发

需要修改插件时，可以克隆仓库或解压完整源码包，保留隐藏目录，再将真实路径注册为本地来源。例如 Windows PowerShell：

```powershell
codex plugin marketplace add 'D:\tools\codex-repo-knowledge'
codex plugin add repo-knowledge@codex-repo-knowledge
```

GitHub 与本地来源使用相同 marketplace 名称，选择一个来源即可。切换来源前先核对现有配置，再移除旧 marketplace 并添加新来源；不要手工修改缓存。插件没有 npm 运行时依赖，无需在业务仓库执行 npm install。要核验插件源码，在其目录运行 `npm run verify`。

## 启用并审查 Hook

进入准备开发的 Git 项目，再启动 Codex：

```bash
cd /absolute/path/to/your-git-project
codex
```

通过 `/hooks` 审查插件的 SessionStart、UserPromptSubmit 和 Stop 定义，按宿主要求信任后开启新会话。用 `/plugins` 和 `/skills` 检查启用状态；当前技能名为 `repo-knowledge:repo-knowledge` 与 `repo-knowledge:repo-knowledge-setup`，显式调用时从列表选择即可。

如果本机配置明确禁用了 Hooks，可在现有 config.toml 的 `[features]` 表中设置 `hooks = true`，不要重复追加同名表。组织策略可能禁止脚本执行，插件无法绕过这种限制。不要手工编辑信任哈希、关闭沙箱或审批。模型沿用 Codex 的账号或 provider，插件不要求额外 API Key。

启用只说明配置允许使用，不证明 Hook 已执行。需要实际证据时按 [本地核验步骤](hook-diagnostics.md) 检查；不假定所有 App 版本有相同的命令或日志界面。

## 更新

GitHub 来源刷新 marketplace 并核对已安装版本：

```bash
codex plugin marketplace upgrade codex-repo-knowledge
codex plugin list --marketplace codex-repo-knowledge --json
```

当前 Codex 实现在 Git marketplace 发生变化时会刷新已配置插件的安装缓存；通常不必重复安装。若列表显示未安装或版本未更新，再运行 `codex plugin add repo-knowledge@codex-repo-knowledge`，并检查来源及命令结果。该刷新行为来自[官方实现](https://github.com/openai/codex/blob/main/codex-rs/core-plugins/src/manager.rs)；不同版本以实际列表为准。

`git pull` 只更新你克隆的源码目录；GitHub marketplace 快照和已安装插件缓存由 Codex 管理，不能把源码更新当作安装更新。这里提供可主动执行并核对的流程，不承诺所有客户端自动、即时更新。

本地来源先在原注册目录拉取新版本或更新完整源码包，再重新安装：

```bash
codex plugin add repo-knowledge@codex-repo-knowledge
codex plugin list --marketplace codex-repo-knowledge --json
```

核对安装版本，并开启新会话。无需手工编辑 manifest，也不要依赖相同版本覆盖缓存。更新后检查宿主显示的 Hook 定义及待审状态，只信任已审阅的内容。旧 `project-memory` 标识不会自动迁移；若仍安装着旧插件，先移除它，避免两套 Hook 同时运行。

## 卸载

```bash
codex plugin remove repo-knowledge@codex-repo-knowledge
codex plugin marketplace remove codex-repo-knowledge
```

卸载不会删除业务仓库的文档、笔记或已加入的规则。要撤销这些项目修改，应单独审查差异；插件不会自动删除用户内容。

## 常见排查

- 找不到 `codex plugin`：检查客户端是否支持原生插件
- 已安装却没有维护职责：检查运行方式、启用状态、Hook 信任、新会话与 Node/PATH
- 能看到职责却没有收尾跟踪：检查 Git 工作区、项目配置、子模块和检测预算；不满足安全检查条件时会放行

`doctor` 只检查本地配置与 Git；`smoke:codex` 检查隔离环境中的原生管理和技能/Hook 发现，保持未信任且不运行模型。实际 Hook 执行与 Agent 是否采用职责需要另外的 [诊断与行为核验](hook-diagnostics.md)。
