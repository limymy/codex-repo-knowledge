# 架构

本页提供组件地图、职责边界与阅读入口。精确字段、回合顺序和失败语义由 [Hook 协议](subsystems/hook-protocol.md) 维护；功能目标由 [功能契约](functional-contract.md) 定义，实际测试结果见 [验证记录](../VERIFICATION.md)。

## 系统边界

Repo Knowledge 是 Codex 上的知识维护层，不是完整开发工作流。它复用宿主的 AGENTS.md 与技能发现机制，通过本地 Hook 提供维护职责和有界提醒；当前 Agent 在用户授权范围内检索、判断并维护项目知识。

三个角色各负其责：

- 宿主与 Hook 交付固定职责，观察有界 Git 快照，并持久化自报维护状态
- Agent 读取适用规则与既有知识，维护该内容所属的文档或记录；可以判断无需写文档或笔记
- 维护者审阅内容与证据，判断实现、说明和取舍是否准确；可直接维护本仓库文档，无需启动模型会话

Hook 不写项目知识、不启动另一个模型、不解析会话记录，也不授予文件修改、提交或发布权限。回执不是语义正确性证明。文件与进程风险由 [安全说明](../SECURITY.md) 维护。

## 组件与实现入口

| 组件 | 职责与入口 | 详细说明 |
| --- | --- | --- |
| 插件发现 | [.codex-plugin/plugin.json](../.codex-plugin/plugin.json)、[marketplace](../.agents/plugins/marketplace.json) 与 [hooks.json](../hooks/hooks.json) 连接宿主和本地事件脚本 | [安装](user/installation.md)、[打包决定](../.agents/notes/implemented/architecture/2026-09-30-native-packaging.md) |
| 知识维护指导 | [bootstrap](../rules/bootstrap.md) 提供启动职责；[主技能](../skills/repo-knowledge/SKILL.md) 按需引导检索与维护；[setup 技能](../skills/repo-knowledge-setup/SKILL.md) 仅显式调用 | [功能契约](functional-contract.md) |
| 事件边界与回合协调 | [hook.mjs](../scripts/hook.mjs) 接收宿主事件；[runtime.mjs](../scripts/lib/runtime.mjs) 协调基线、状态收集和最多一次提醒 | [Hook 协议](subsystems/hook-protocol.md) |
| 状态解析与观察 | [final-status.mjs](../scripts/lib/final-status.mjs) 识别末行；[git.mjs](../scripts/lib/git.mjs) 生成有界快照；[store.mjs](../scripts/lib/store.mjs) 与 [io.mjs](../scripts/lib/io.mjs) 管理项目外状态及文件访问 | [Hook 协议](subsystems/hook-protocol.md)、[安全说明](../SECURITY.md) |
| 配置与本地检查 | [config.mjs](../scripts/lib/config.mjs)、[notes.mjs](../scripts/lib/notes.mjs) 和操作者入口 [rk.mjs](../scripts/rk.mjs) 提供选项与结构检查，不承担原生 Hook 分发 | [配置](user/configuration.md) |
| 可选诊断 | [diagnostics.mjs](../scripts/lib/diagnostics.mjs) 独立记录有界的执行类别，不证明宿主交付或模型采用 | [Hook 核验](user/hook-diagnostics.md) |

## 事件与知识的流向

1. SessionStart 提供包内固定维护职责和资源位置；Codex 负责原生指令加载，Agent 仍需有针对性地刷新适用项目知识
2. UserPromptSubmit 为适用回合记录 Git 基线；Agent 继续完成获授权的普通任务
3. Stop 将有效最终状态与当前快照关联；需要审阅却没有新有效状态时，至多请求一次建议式续跑

状态按项目、会话和回合区分，存放在宿主提供的项目外目录。它是运行数据，不能替代仓库文档或设计理由。共享工作树和并发编辑不会因此被隔离；缺失上下文或无法安全观察时，会关闭受影响的跟踪路径。完整的适用条件、处理顺序、重放保护和降级规则见 [Hook 协议](subsystems/hook-protocol.md)。

## 相关知识归属

- 使用者操作：在 [安装](user/installation.md)、[配置](user/configuration.md) 和 [Hook 核验](user/hook-diagnostics.md) 中查找
- 能力目标、非目标和与 DSH 的差异：见 [功能契约](functional-contract.md)
- 可重复执行的检查与验收方法：见 [测试说明](testing.md)；按日期保存的观察与缺口：见 [验证记录](../VERIFICATION.md)
- 为什么采用当前取舍：见 [决定记录](../.agents/notes/README.md)；引用版本与适配依据：见 [来源](sources.md)

目录和命名的维护规则见 [docs/AGENTS.md](AGENTS.md)。本仓库只建立已有内容需要的层次，不把自身布局强制施加给使用本插件的项目。
