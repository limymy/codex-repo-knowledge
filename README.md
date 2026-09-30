# Repo Knowledge

**让 Codex 在日常开发中维护仓库知识：开发规则、当前文档和长期设计决定。**

你正常描述需求、讨论方案、让 Agent 修改代码。插件提供默认维护职责和按需写作规范，让 Agent 判断哪些内容需要更新，而不是要求你每轮提醒“写 docs”“记 notes”。

> **Alpha：`0.1.0-alpha.2+codex.20260930014724`。** 已验证离线逻辑和原生安装、技能/Hook 发现；真实 Hook 执行与模型行为尚待验收。已完成与未完成的验证分别记录在 [VERIFICATION.md](VERIFICATION.md)。

## 解决什么问题

项目越改越大，重要约定容易只留在聊天中：文档与实现不一致，设计取舍反复讨论，换一个会话就重新解释项目。Repo Knowledge 把维护职责接入正常开发，同时限制无用记录。

| 内容 | 什么时候维护 | 放在哪里 |
| --- | --- | --- |
| 开发规则 | 用户确认应长期适用的项目约束时 | 已有 `AGENTS.md` 或局部规则 |
| 当前文档 | 接口、配置、用法、兼容性或重要限制变化时 | 已有 README、指南或参考文档 |
| 设计决定 | 出现代码和测试不能充分解释的长期取舍时 | 已有 ADR/notes；没有合适位置时使用 `.agents/notes/` |

普通格式调整、变量重命名和明显局部修复不强制写笔记；未实现方案不写成当前事实；只读讨论不产生写权限。已有规范和内容位置优先，不批量生成空目录。

## 安装

需要 **Node.js 20+、Git**，以及提供 `codex plugin` 和 `/hooks` 的 Codex CLI。插件没有 npm 运行时依赖，不需要在业务仓库执行 `npm install`。最低兼容 Codex 版本尚未实测确定。

在实际运行 Codex 的机器上安装：

```bash
codex plugin marketplace add limymy/codex-repo-knowledge
codex plugin add repo-knowledge@codex-repo-knowledge
```

然后在 Codex 中打开 `/hooks`，审查并信任 **Repo Knowledge** 的 Hook，重新开始会话。安装插件不等于信任脚本；如果你曾禁用 Hooks，需要恢复该功能。Node 和 Git 必须在 Hook 进程的 `PATH` 中。

通过 `/plugins` 检查插件是否已启用，通过 `/skills` 检查 `repo-knowledge` 是否可见。无需提供额外的 API Key；模型仍由原来的 Codex 账号或 provider 调用。

### 从源码包本地安装

解压完整源码后，进入解压得到的 `codex-repo-knowledge` 目录：

```bash
npm run verify
codex plugin marketplace add /absolute/path/to/codex-repo-knowledge
codex plugin add repo-knowledge@codex-repo-knowledge
```

把路径替换为真实绝对路径，再按上述步骤审查 Hook 并开始新会话。已在 Codex CLI `0.159.0-alpha.7` 实测原生安装与技能/Hook 发现；这不是最低支持版本或全部稳定版兼容保证。

更多更新、卸载、Windows/远程环境和故障排查见 [安装指南](docs/installation.md)。

## 使用

**日常直接提需求，不必调用一个总工作流：**

```text
给导出命令增加 JSON 格式选项，保持现有默认输出不变。
只完成当前任务，不提交、不推送。
```

Agent 应检查已有约定，在必要时更新对应说明；只有出现长期有效的非显然取舍才记录决定。插件不强制规划、TDD、多 Agent 编排或发布流程。

需要首次适配已有文档位置时，可显式调用一次：

```text
$repo-knowledge:repo-knowledge-setup
适配当前仓库，复用已有规范、README 和 ADR 位置。
只修改必要的规则或配置，不修改业务代码，不提交、不推送。
```

这个步骤是可选的。自动规则由 Hook 提供，不依赖将插件自己的根 `AGENTS.md` 复制到每个项目。

## 工作机制

```text
启动 / 恢复 / 压缩后：注入简短维护职责
                     ↓
正常开发：按变化读取规则，更新必要的文档或决定
                     ↓
收尾：分别报告 docs / notes 的维护判断
                     ↓
检测到变化但未报告时：最多提醒一次，允许无需更新或暂缓
```

收尾脚本不判断“有代码变动就必须改 Markdown”。它比较本轮前后的 Git 摘要，允许 `updated`、`not-needed`、`deferred`；检查结果是 Agent 自报，不是正确性证明。只读请求、无变化和不可安全检查的情况不应扩展任务。并发修改不能可靠归因，Agent 必须遵守任务边界。包含 Git 子模块的仓库只提供启动职责，不做收尾变更检测，以免执行子模块的外部 Git 配置。

## 配置与边界

默认无需配置。只关闭收尾提醒、保留启动规则时，在项目根目录的 `.repo-knowledge.json` 中加入：

```json
{ "version": 1, "stopReminder": "off" }
```

自定义位置和完全停用见 [配置说明](docs/configuration.md)。

Hook 脚本不修改业务文件，不读取会话日志，不访问网络，不启动第二个模型，不自动提交、推送或发布。它只把运行状态写进 Codex 提供的插件数据目录。大仓库的变更检测有预算，超出预算时会提示并放行。详见 [安全与隐私](SECURITY.md)。

## 开发与验证

```bash
npm run verify
npm run smoke:codex
npm run eval:prepare -- --out /absolute/path/to/new-eval-directory
```

`verify` 执行离线测试；`smoke:codex` 使用隔离的 `HOME` / `CODEX_HOME` 检查原生 marketplace、插件管理与技能/Hook 发现，不登录、不信任 Hook、不运行模型，缺少 Codex 时明确跳过。`eval:prepare` 只建立独立示例仓库，后续需在真实 Codex 中验收自动行为。

[测试方法](docs/testing.md) · [架构](docs/architecture.md) · [贡献指南](CONTRIBUTING.md) · [验证记录](VERIFICATION.md)

## 致谢与许可

受 DeepSeek Harness 的分层开发规则、Agent Notes 和文档维护方法，以及 OpenAI 的 Agent 工程实践启发；不是上述项目的官方插件。参考资料见 [规则来源](docs/sources.md)。

[MIT License](LICENSE)。
