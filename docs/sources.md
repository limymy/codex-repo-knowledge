# 参考来源与兼容性基线

本页资料于 2026-09-28 审阅，原生打包方式于 2026-09-30 复核。本插件受 DSH 的知识归属和决定记录规则启发，独立编写实现，不声称与 OpenAI 或 DeepSeek 存在隶属或合作关系。

## 宿主官方契约

- [Codex Hooks](https://learn.chatgpt.com/docs/hooks)：SessionStart/UserPromptSubmit/Stop、additionalContext、stop_hook_active、信任、PLUGIN_ROOT 和 PLUGIN_DATA。该页面目前重定向至 ChatGPT Learn。
- [插件打包](https://developers.openai.com/plugins/build/plugins)：Codex 兼容布局、默认 Hook 发现和仓库 marketplace。本包在原生发现测试后，有意省略可移植根清单。
- [Codex 技能](https://developers.openai.com/codex/skills)：按描述发现、SKILL.md 和调用策略。
- [AGENTS.md](https://developers.openai.com/codex/guides/agents-md)：长期项目规则和作用域发现。
- [OpenAI 的 Harness 工程实践](https://openai.com/index/harness-engineering/)：可被发现的仓库知识与可执行反馈。

以上是文档层面的兼容性参考，不能证明已测得最低 CLI 版本、安装成功、模型行为或平台兼容性。应使用原生冒烟检查和真实验收流程，核验具体客户端版本。

## DSH 参考设计

2026-09-28 最初参考的是 `deepseek-ai/deepseek-harness` 的 `00102833dfaee1da9f48a3a8eae9d34005a75218` 快照。

- [根目录长期规则](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/AGENTS.md)
- [文档归属](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/docs/AGENTS.md)
- [决定理由与生命周期](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/notes/README.md)
- [写作覆盖要求](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/skills/dsh-prose-standard/SKILL.md)

2026-09-30 的功能复核使用 `639ed015397290b3745d163aafe02ffee4aa3f84` 快照；作用域规则与运行时差异见 [当前 DSH 对照](functional-contract.md)。上面的旧链接用于保留最初的设计基线。

本插件有意不复现 DSH 的运行时、强制双语配对、网站生成或包专属 CI，也不声称格式检查能判断语义上是否有必要补写一篇缺失的决定记录。

## 本版本核对

2026-09-28 再次核对 [官方 Hooks 文档](https://learn.chatgpt.com/docs/hooks)：`PLUGIN_ROOT`/`PLUGIN_DATA`、`turn_id`、三个事件的 JSON 输出和 `stop_hook_active`。这是协议核对，不是客户端执行验证。

## 写作细节补充（2026-09-30）

“精简仍保留条件、例外、时序、义务与否定保证”对应 DSH prose-standard 的 [保留完整命题](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-prose-standard/SKILL.md#preserve-the-complete-proposition)；本轮核对的是 master，不冒充上述固定快照。读者背景与仅在易误用处加入小例子是结合读者定位、完整局部契约和避免无用复述作的适配性表述，不是逐字引用。
