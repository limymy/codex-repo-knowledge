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

最初设计采用 `deepseek-ai/deepseek-harness` 的 [00102833](https://github.com/deepseek-ai/deepseek-harness/tree/00102833dfaee1da9f48a3a8eae9d34005a75218) 快照，2026-09-30 功能复核采用 [639ed015](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)。2026-10-05 的目录与命名整理再次核对这两个固定快照；本页不把其中任何一个称为 DSH 的最新版本。

| 参考主题 | 原始设计基线 | 本次整理所用的固定依据 |
| --- | --- | --- |
| 长期规则与作用域 | [00102833 根 AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/AGENTS.md) | [639ed015 根 AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/AGENTS.md) |
| 文档职责与知识归属 | [00102833 docs/AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/docs/AGENTS.md) | [639ed015 docs/AGENTS](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/docs/AGENTS.md)、[结构目标](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/skills/dsh-doc/references/structure-hierarchy.md) |
| 决定理由、命名与生命周期 | [00102833 notes/README](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/notes/README.md) | [639ed015 notes/README](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/notes/README.md)、[已实施记录的维护规则](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/notes/implemented/AGENTS.md) |
| 写作与完整命题 | [00102833 prose-standard](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/skills/dsh-prose-standard/SKILL.md) | [639ed015 prose-standard](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/skills/dsh-prose-standard/SKILL.md#preserve-the-complete-proposition) |

2026-09-30 的写作补充原先引用浮动的 master；其历史记录不等于当时 master 的确切提交已知。上表提供已核对的固定依据，两个列出的快照均包含保留条件、例外、时序、义务与否定保证的要求。读者定位和仅在易误用处加入小例子是本插件结合这些原则的适配性表述，并非逐字引用。

## 目录、命名和内容职责的适配

DSH 在两个固定快照中都保留 `docs/architecture.md`、`docs/testing.md` 等顶层页面，并已有 `docs/user/` 和 `docs/subsystems/`。其结构技能还描述了 `learn/`、`developer/`、`scratch/` 等目标目录，但明确把它视为目标地图，而非大规模迁移的理由；不能把目标地图说成这些快照已有的完整目录。

本仓库采用适合小插件的部分：

- `docs/architecture.md` 是组件和责任地图；精确机制进入 `docs/subsystems/hook-protocol.md`
- 安装、配置和 Hook 核验进入 `docs/user/`；功能契约、跨层测试与参考来源继续留在 `docs/` 根层
- 普通主题页使用小写英文 `kebab-case.md`，当前说明不加日期；AGENTS.md、README.md 等约定入口名称保持原样
- 决定路径采用 `.agents/notes/{lifecycle}/{class}/YYYY-MM-DD-topic-title.md`，只建立有真实记录的 `implemented/architecture/`，保留原记录日期；具体状态与替代规则见 [notes/README](../.agents/notes/README.md)

这与 DSH 的职责分层和决定目录命名相符，是按项目规模裁剪的组织方式，不是完整复制。我们保留本插件既有的 `# Decision:`、标记与状态字段，不声称与 DSH 的 `# Agent Note:` 格式或检查器等同。目录只决定内容归属，不授权创建空模板、扩大任务或修改下游项目约定。

本插件不复现 DSH 的完整运行时、强制双语配对、网站生成、字数预算或包专属 CI；原生机制与行为适配的差异由 [功能契约](functional-contract.md) 维护。格式检查不能判断语义上是否有必要补写缺失的决定记录。
