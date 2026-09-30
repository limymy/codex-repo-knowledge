# 安装与管理

## 前提

安装到实际执行 Codex 的机器。远程 Linux 上使用 Codex CLI 时在远程安装；不同 `CODEX_HOME` 的 profile 分别安装。Node.js 20+ 和 Git 需要能被 Hook 进程找到。

```bash
codex --version
node --version
git --version
codex plugin --help
```

当前在 CLI `0.159.0-alpha.7` 实测安装与技能/Hook 发现；未据此声明最低版本或所有稳定版兼容。真实兼容性和验证状态见 [验证记录](../VERIFICATION.md)。网页或桌面客户端与远程执行机器不是同一安装位置，本文以 CLI 为准。

## GitHub 或本地安装

从 GitHub 安装：

```bash
codex plugin marketplace add limymy/codex-repo-knowledge
codex plugin add repo-knowledge@codex-repo-knowledge
```

也可解压完整源码包并注册本地绝对路径：

```bash
codex plugin marketplace add /absolute/path/to/codex-repo-knowledge
codex plugin add repo-knowledge@codex-repo-knowledge
```

Windows PowerShell 示例：

```powershell
codex plugin marketplace add 'D:\tools\codex-repo-knowledge'
codex plugin add repo-knowledge@codex-repo-knowledge
```

marketplace 名为 `codex-repo-knowledge`，插件名为 `repo-knowledge`。同名来源已存在时先检查原配置，不要无意切换副本。

## 启用并审查 Hook

在 Codex 中用 `/hooks` 审查并信任插件的 `SessionStart`、`UserPromptSubmit`、`Stop`。重新开始会话，再用 `/plugins` 和 `/skills` 检查启用状态。当前实测技能名带命名空间：`repo-knowledge:repo-knowledge` 和 `repo-knowledge:repo-knowledge-setup`，显式调用时优先从技能列表选择。

若本机显式禁用 Hooks，在现有 `config.toml` 的 `[features]` 表中设置 `hooks = true`；不要追加重复表。组织管理员可能禁止脚本执行，插件不能绕过这种限制。

不要直接修改信任哈希，也不要禁用沙箱或审批。脚本使用 Node，不依赖 Bash；Windows/macOS 实际通过情况仍需分别验收。IDE、桌面程序和终端的 `PATH` 可能不同。

## 更新与卸载

GitHub 来源更新：

```bash
codex plugin marketplace upgrade codex-repo-knowledge
codex plugin add repo-knowledge@codex-repo-knowledge
```

本地来源先更新源码，再重新安装以更新缓存。Hook 定义改变后重新审查信任，并开启新会话。旧 `project-memory` 标识下的数据不自动迁移，升级前先卸载旧插件，避免重复运行两套 Hook。

```bash
codex plugin remove repo-knowledge@codex-repo-knowledge
codex plugin marketplace remove codex-repo-knowledge
```

卸载不删除业务仓库已有文档、笔记或已授权加入的规则。需要撤销时单独审查差异，不自动删除用户修改。

## 排查

没有 `codex plugin`：检查版本是否支持原生 Plugins。已安装但不自动注入：检查 `/plugins`、`/hooks`、是否禁用 Hooks、是否开启新会话以及 Hook 的 `PATH`。没有可访问 Git 工作区时，自动 Hook 不介入。变更检测预算、子模块、路径或权限问题会降级放行。

`scripts/rk.mjs doctor` 检查本地配置和 Git，不验证原生插件加载；`smoke:codex` 验证原生技能/Hook 发现以及仍未信任的状态，不验证 Hook 执行或模型遵循。不要把它们的检查结果混为一谈。
