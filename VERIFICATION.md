# 验证记录：0.1.0-alpha.2+codex.20260930014724

核验日期：2026-09-30。Linux x86_64，Node v24.19.0，Git 2.52.0，Codex CLI 0.159.0-alpha.7。结果见 [机器可读报告](reports/verification.json)。

## 已执行

- `npm run verify`：101 项通过、0 失败、0 跳过，包含真实临时 Git 仓库及 Hook 子进程协议测试
- 官方 Codex 兼容 manifest 验证器：通过
- `npm run smoke:codex`：在隔离 HOME/CODEX_HOME 注册、安装、列出和卸载插件；原生 app-server 发现两个技能和三个 Hook，均保持未信任
- 四项临时副本故障注入均被测试检出：移除提醒上限、复用过期 receipt、重新允许 Git filter 执行、移除最终状态目录边界检查；交付代码不含故障注入
- 安全复查后新增 clean/process filter、lazy-fetch transport、子模块降级、状态路径及诊断文本泄露的回归覆盖；另验证发现进程关闭 stdin、超限无换行输出及拒绝退出时的失败隔离和清理

原包的双 manifest 在当前 CLI 下安装成功但没有 Hook，兼容布局的对照样例正确发现三个 Hook；修正版据此保留 `.codex-plugin/plugin.json` 和默认 `hooks/hooks.json`。技能的原生命名空间为 `repo-knowledge:repo-knowledge` 与 `repo-knowledge:repo-knowledge-setup`。

## 未验证与限制

原生发现不等于 Hook 执行：没有改变任何真实 profile 的信任配置，没有绕过 Hook 信任，也没有复制认证信息。真正的启动、恢复、压缩、Stop 分发与模型遵循尚未通过端到端验收。

尝试复用已有登录进行 `exec --ephemeral --ignore-user-config` 的实际模型语义测试，但进程在请求模型前因只读文件系统无法初始化 app-server；隔离 profile 则没有登录。因此没有可报告的模型成功率。六类独立夹具可用于后续验收：当前文档更新、长期决定、机械重命名、只读讨论、决定替代和恢复原有契约。

当前本地结果仅针对上述 Linux/Node/CLI 组合，不是最低 CLI 版本或跨平台保证。GitHub CI 配置覆盖 Node 20/22 的 Linux/macOS/Windows，以及固定 Codex 版本的原生发现；实际远端结果应查看对应提交的 Actions，不能将配置存在等同于通过。

## 复现

```bash
npm run verify
npm run smoke:codex
npm run eval:prepare -- --out /absolute/path/to/new-eval-directory
```

详见 [测试说明](docs/testing.md)。真实模型测试需普通开发提示、观察原生 Hook 执行并人工审阅语义质量，不能用任意 Markdown 变化或 review receipt 代替。
