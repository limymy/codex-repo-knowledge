# Decision: 优先采用已观察到的原生加载方式与有界 Git 隔离

<!-- repo-knowledge:decision -->
Status: implemented

## Problem
alpha2 压缩包可以成功安装，但在 Codex CLI 0.159.0-alpha.7 上，原生 `hooks/list` 未返回任何 Hook。因此，便携与兼容双 manifest 并不能证明插件会自动运行。看似只读的 Git 状态命令，还可能执行 clean/process 过滤器、子模块本地过滤器，或触发延迟获取传输。

## Decision
仅保留 Codex 兼容 manifest，以及原生宿主实际能够列出的默认 `hooks/hooks.json` 发现方式。在每个 Git 子进程中，禁用已配置的过滤器可执行程序和延迟获取传输。在运行状态检查之前检测 gitlink；对于包含子模块的仓库，降级放行。根据项目根目录校验最终推导出的状态目录。

## Alternatives considered
曾测试过保留文档所述的便携 manifest，既测试了显式指定 Hook 路径的情况，也测试了未指定的情况；在所观察的 CLI 上，两者都未发现原生 Hook。仅移除兼容 manifest 中的 hooks 字段，不能解决问题。只保留兼容 manifest 的打包方式则可以。递归清理所有子模块配置，会引入规模更大且易受竞态影响的配置遍历器；对含 gitlink 的仓库跳过提醒，则可以维持仅提供提醒的职责边界。

## Consequences
在已测试的 alpha CLI 中，安装后的技能与 Hook 可以被发现；这不能证明稳定版兼容性、受信执行或模型遵从性。包含子模块的项目仍保留长期有效的维护指导，但失去自动改动提醒。Git 在评估状态时仍可能读取受跟踪的内容；插件的哈希计算限制并不是 Git 的总 I/O 预算。

## Evidence
证据包括隔离环境中的原生安装与 app-server 发现、Git 过滤器及传输标记复现、状态目录包含关系的回归测试，以及当前[验证记录](../../VERIFICATION.md)。未更改任何 Hook 信任设置或使用者配置。
