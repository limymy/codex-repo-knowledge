# Sources and compatibility baseline

Reviewed on 2026-09-28; native packaging rechecked on 2026-09-30. This is an independently written implementation inspired by DSH's knowledge ownership and decision-record rules; no affiliation with OpenAI or DeepSeek is claimed.

## Official host contracts

- [Codex Hooks](https://learn.chatgpt.com/docs/hooks): SessionStart/UserPromptSubmit/Stop, additionalContext, stop_hook_active, trust, PLUGIN_ROOT and PLUGIN_DATA. The page currently redirects to ChatGPT Learn.
- [Plugin packaging](https://developers.openai.com/plugins/build/plugins): Codex compatibility layout, default hooks discovery and repository marketplace. This package intentionally omits the portable root manifest after native discovery testing.
- [Codex Skills](https://developers.openai.com/codex/skills): description-driven discovery, SKILL.md and invocation policy.
- [AGENTS.md](https://developers.openai.com/codex/guides/agents-md): standing project guidance and scoped discovery.
- [OpenAI harness engineering](https://openai.com/index/harness-engineering/): discoverable repository knowledge and executable feedback.

These are documentation-level compatibility references. They do not establish a tested minimum CLI version, successful installation, model behavior or platform compatibility. Check the exact client version with the native smoke and real acceptance procedure.

## DSH reference design

The original 2026-09-28 reference snapshot was `deepseek-ai/deepseek-harness` at `00102833dfaee1da9f48a3a8eae9d34005a75218`.

- [Root standing rules](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/AGENTS.md)
- [Document ownership](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/docs/AGENTS.md)
- [Decision rationale and lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/notes/README.md)
- [Writing coverage](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/skills/dsh-prose-standard/SKILL.md)

The 2026-09-30 functional re-review used snapshot `639ed015397290b3745d163aafe02ffee4aa3f84`; see the [current DSH comparison](functional-contract.md) for the scoped instructions and runtime distinction. The older links above preserve the original design baseline.

This plugin deliberately does not reproduce DSH's runtime, mandatory bilingual pairing, website generation or package-specific CI. It also does not claim that a format gate can decide whether an absent decision record is semantically necessary.

## 本版本核对

2026-09-28 再次核对 [官方 Hooks 文档](https://learn.chatgpt.com/docs/hooks)：`PLUGIN_ROOT`/`PLUGIN_DATA`、`turn_id`、三个事件的 JSON 输出和 `stop_hook_active`。这是协议核对，不是客户端执行验证。

## 写作细节补充（2026-09-30）

“精简仍保留条件、例外、时序、义务与否定保证”对应 DSH prose-standard 的 [Preserve the complete proposition](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-prose-standard/SKILL.md#preserve-the-complete-proposition)；本轮核对的是 master，不冒充上述固定快照。读者背景与仅在易误用处加入小例子是结合读者定位、完整局部契约和避免无用复述作的适配性表述，不是逐字引用。
