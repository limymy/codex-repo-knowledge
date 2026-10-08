# Decision: 优先采用已观察到的原生加载方式

<!-- repo-knowledge:decision -->
Status: implemented

## Problem
alpha2 压缩包可以成功安装，但在 Codex CLI 0.159.0-alpha.7 上，原生 `hooks/list` 未返回任何 Hook。因此，便携与兼容双 manifest 并不能证明插件会自动运行。打包选择需要以具体宿主的发现结果为依据，不能把安装成功当作 Hook 已被加载。

## Decision
仅保留 Codex 兼容 manifest `.codex-plugin/plugin.json`，以及原生宿主实际能够列出的默认 `hooks/hooks.json` 发现方式；不在兼容 manifest 中设置 `hooks` 字段，也不分发可移植根清单。采用这一布局的理由是它在受测 CLI 上确实暴露了技能和 Hook，而双 manifest 布局没有提供同样的发现结果。

## Alternatives considered
测试时保留了文档所述的便携 manifest，分别尝试显式指定和不指定 Hook 路径；受测 CLI 在两种情况下都未发现原生 Hook。只移除兼容 manifest 中的 `hooks` 字段仍不能解决双 manifest 布局的问题；改为只保留兼容 manifest 后，才成功发现 Hook。

这些比较支持所测版本的打包选择，不构成所有宿主版本通用的 manifest 优先级规则，也不表明未采用的格式永远无效。

## Consequences
在已测试的 alpha CLI 中，安装后的技能与 Hook 可以被发现；这不能证明稳定版兼容性、受信执行或模型遵从性。原生发现与真正运行 Hook 是不同的验证层次，后者仍受宿主支持、启用和信任设置约束。面向使用者的当前步骤由[安装说明](../../../../docs/user/installation.md)维护，不把一次发现结果扩大为最低版本或跨平台承诺。

## Evidence
本记录保留 2026-09-30 的打包发现决定；2026-10-05 的拆分仅回溯性澄清独立边界，不代表新实现或新原生、模型验收。

- 已观察历史：隔离环境中的原生安装与 app-server 发现，受测 CLI 为 `0.159.0-alpha.7`。具体运行结果及其版本归属保留在[验证记录](../../../../VERIFICATION.md)；原发现检查未更改 Hook 信任设置或使用者配置。
- 当前入口：[Codex manifest](../../../../.codex-plugin/plugin.json)、[Hook 定义](../../../../hooks/hooks.json)与[原生发现脚本](../../../../scripts/codex-smoke.mjs)。它们说明布局与复现入口，文件存在本身不能证明宿主已加载。
- 验证边界：[测试说明](../../../../docs/testing.md)区分包结构检查、原生发现与模型行为验收；后两者不能由本次文档拆分或离线结构检查代替。

## 相关记录
[Git 隔离决定](2026-09-30-git-isolation.md)保留原合并记录中关于过滤器、传输、子模块和状态目录的独立理由。[有界提醒与宿主回执](2026-09-28-bounded-advisory-review.md)负责提醒次数与回执归属的取舍。拆分没有否定或替代这些仍有效的选择。
