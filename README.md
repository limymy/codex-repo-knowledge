# Repo Knowledge

让 Codex 在日常开发中读取、运用和维护仓库知识：开发规则、当前文档和长期设计决定。

你照常描述需求、讨论方案或请求修改代码。插件让 Agent 在任务中检查适用约定，判断哪些说明需要更新、哪些理由值得留下，减少知识只存在于聊天里的情况。

当前为 Alpha 版本 `0.1.0-alpha.2+codex.20260930145548`，可从本仓库安装。实际验证范围见 [验证记录](VERIFICATION.md)。

## 维护什么

| 内容 | 何时维护 | 优先位置 |
| --- | --- | --- |
| 开发规则 | 用户确认应长期适用的项目约束时 | 已有 AGENTS.md 或局部规则 |
| 当前文档 | 接口、用法、配置、兼容性或重要限制改变时 | 已有 README、指南、参考文档或代码旁的契约 |
| 设计决定 | 存在代码和测试不能充分解释的长期取舍时 | 已有 ADR/notes；必要时使用 .agents/notes/ |

Agent 应把变化融入文档原有叙述，保持术语和逻辑一致；当前说明讲现在的行为，决定记录保留真实理由、取舍和验证缺口。方案未实现时仍是方案，部分替代的旧决定仍保留有效约束。

格式调整、内部重命名和明显局部修复通常不需要笔记。只读讨论不产生写权限，插件也不强制规划、TDD、多 Agent 或发布流程。

## 安装与开始使用

需要 Node.js 20+、Git，以及支持原生插件和 `/hooks` 的 Codex CLI。当前实测环境为 Linux CLI 0.159.0-alpha.7；最低兼容版本和 Windows/macOS App 原生执行尚未确定。命令 Hook 需要本地编排，云编排的 dots/Work Cloud 不支持它们，即使工具在电脑上执行。

从 GitHub 注册 marketplace 并安装插件：

```bash
codex plugin marketplace add limymy/codex-repo-knowledge
codex plugin add repo-knowledge@codex-repo-knowledge
codex plugin list --marketplace codex-repo-knowledge --json
```

确认版本与本页一致，再进入目标 Git 项目启动 Codex，通过 `/hooks` 审查插件定义并开启新会话。插件没有 npm 运行时依赖，也不需要单独的 API Key。完整步骤、来源检查、更新与卸载见 [安装指南](docs/installation.md)。

之后直接提出普通任务即可，例如：

```text
给导出命令增加 JSON 格式选项，保持现有默认输出不变。
只完成当前任务，不提交、不推送。
```

Agent 会按任务读取适用规则和既有知识，在必要时维护对应文档或决定。首次需要适配仓库位置时，可从技能列表选择 `repo-knowledge:repo-knowledge-setup`，要求复用已有规范、README 和 ADR；这一步是可选的，不必复制插件自己的 AGENTS.md。

## 如何参与正常开发

启动、恢复或压缩后，Hook 提供简短维护职责；Agent 负责实际检索、判断和写作。完成有相关变化的授权任务时，Agent 在最终答复末行分别报告文档与笔记的结果，例如：

```text
知识维护：文档=已更新；笔记=无需更新
```

每项可独立选择“已更新”“无需更新”或“暂缓”。宿主记录这项自报判断；只读且无变化的任务不需要该行。检测到变化却缺少有效状态时，收尾机制最多提醒一次。它不要求每次代码变化都改 Markdown，也不能证明维护内容一定正确。

默认无需项目配置。只想关闭收尾跟踪、保留启动职责，可在项目根目录的 .repo-knowledge.json 中设置：

```json
{ "version": 1, "stopReminder": "off" }
```

位置配置、状态格式和停用方式见 [配置说明](docs/configuration.md)。需要确认 Hook 是否实际执行时，使用默认关闭的 [本地诊断](docs/hook-diagnostics.md)。

## 权限与适用边界

Hook 脚本只处理有界的本地检查与插件状态，不修改业务文件、不读取会话日志、不访问网络、不启动额外模型，也不自动提交、推送或发布。写文档仍由当前 Agent 在用户授权范围内完成。

Git 变更检测无法可靠区分并发修改；子模块、检查预算或安全路径等条件不满足时会降级放行。机制与隐私说明见 [架构](docs/architecture.md) 和 [安全说明](SECURITY.md)。已测样本支持核心维护行为，但不代表所有任务、模型或平台都能得到相同结果；[功能目标与验收](docs/functional-contract.md) 说明具体证据边界。

## 开发与参考

开发者可运行 `npm run verify` 做离线检查。原生发现测试、合成任务准备和行为验收方法见 [测试说明](docs/testing.md) 与 [贡献指南](CONTRIBUTING.md)。

本插件受 DeepSeek Harness 的分层规则、Agent Notes 和文档维护方法，以及 OpenAI 的 Agent 工程实践启发，不属于上述项目的官方插件。参考与适配关系见 [规则来源](docs/sources.md)。

[MIT License](LICENSE)
