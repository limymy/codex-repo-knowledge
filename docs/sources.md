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

The reviewed repository snapshot was `deepseek-ai/deepseek-harness` at `00102833dfaee1da9f48a3a8eae9d34005a75218`.

- [Root standing rules](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/AGENTS.md)
- [Document ownership](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/docs/AGENTS.md)
- [Decision rationale and lifecycle](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/notes/README.md)
- [Writing coverage](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/.agents/skills/dsh-prose-standard/SKILL.md)

This plugin deliberately does not reproduce DSH's runtime, mandatory bilingual pairing, website generation or package-specific CI. It also does not claim that a format gate can decide whether an absent decision record is semantically necessary.

## 本版本核对

2026-09-28 再次核对 [官方 Hooks 文档](https://learn.chatgpt.com/docs/hooks)：`PLUGIN_ROOT`/`PLUGIN_DATA`、`turn_id`、三个事件的 JSON 输出和 `stop_hook_active`。这是协议核对，不是客户端执行验证。
