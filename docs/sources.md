# 参考来源与适配基线

本页维护外部参考的版本、出处和采用范围。本插件受 DSH 的知识归属、决定记录及写作规则启发，独立编写实现，不声称与 OpenAI 或 DeepSeek 存在隶属或合作关系。实际执行日期、受测版本与结果由 [验证记录](../VERIFICATION.md) 维护。

## 宿主官方契约

- [Codex Hooks](https://learn.chatgpt.com/docs/hooks)：SessionStart/UserPromptSubmit/Stop、additionalContext、stop_hook_active、信任、PLUGIN_ROOT、PLUGIN_DATA 与 turn_id
- [插件打包](https://developers.openai.com/plugins/build/plugins)：Codex 兼容布局、默认 Hook 发现和仓库 marketplace
- [Codex 技能](https://developers.openai.com/codex/skills)：按描述发现、SKILL.md 和调用策略
- [AGENTS.md](https://developers.openai.com/codex/guides/agents-md)：长期项目规则和作用域发现
- [OpenAI 的 Harness 工程实践](https://openai.com/index/harness-engineering/)：可被发现的仓库知识与可执行反馈

初次资料审阅与 Hooks 协议核对于 2026-09-28 记录，原生打包方式于 2026-09-30 复核。以上链接是文档层面的兼容性参考，不能证明最低 CLI 版本、安装成功、模型行为或平台兼容性。当前采用的布局由 [安装说明](user/installation.md) 维护，取舍由 [原生打包决定](../.agents/notes/implemented/architecture/2026-09-30-native-packaging.md) 解释；具体宿主仍须按 [测试说明](testing.md) 验证。

## DSH 的固定参考

最初设计采用 `deepseek-ai/deepseek-harness` 的 [00102833](https://github.com/deepseek-ai/deepseek-harness/tree/00102833dfaee1da9f48a3a8eae9d34005a75218) 快照，2026-09-30 功能复核采用 [639ed015](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)；两者均为固定参考，不代表 DSH 的最新版本。

| 参考主题 | 原始设计基线 | 功能复核的固定依据 |
| --- | --- | --- |
| 长期规则与作用域 | [00102833 根 AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/AGENTS.md) | [639ed015 根 AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/AGENTS.md) |
| 文档职责与知识归属 | [00102833 docs/AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/docs/AGENTS.md) | [639ed015 docs/AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/docs/AGENTS.md)、[结构目标](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/skills/dsh-doc/references/structure-hierarchy.md) |
| 决定理由、命名与生命周期 | [00102833 notes/README](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/notes/README.md) | [639ed015 notes/README](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/notes/README.md)、[已实施记录的维护规则](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/notes/implemented/AGENTS.md) |
| 写作与完整命题 | [00102833 prose-standard](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/skills/dsh-prose-standard/SKILL.md) | [639ed015 prose-standard](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/skills/dsh-prose-standard/SKILL.md#preserve-the-complete-proposition) |

2026-09-30 的写作补充原先引用浮动的 master；其历史记录不等于当时 master 的确切提交已知。上表提供已核对的固定依据，两个列出的快照均包含保留条件、例外、时序、义务与否定保证的要求。本插件据此提出面向读者组织内容、仅在易误用处补充小例子的写作要求，并非逐字引用。

## 目录、命名和内容职责的适配

本仓库按小插件规模采用 DSH 的职责分层和决定组织方式；具体目录、命名与维护要求见[文档维护规则](AGENTS.md)和[决定记录规则](../.agents/notes/README.md)。DSH 结构技能中的目标目录不等于固定快照的实际目录，也不授权大规模迁移。

决定记录保留本插件既有的 `# Decision:`、标记与状态字段，不等同于 DSH 的 `# Agent Note:` 格式或检查器。目录只决定内容归属，不授权创建空模板、扩大任务或修改下游项目约定。

本插件不复现 DSH 的完整运行时、强制双语配对、网站生成、字数预算或包专属 CI；原生机制与行为适配的差异由 [功能契约](functional-contract.md) 维护。格式检查不能判断语义上是否有必要补写缺失的决定记录。
