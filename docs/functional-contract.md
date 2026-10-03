# 功能目标与验收边界

目标是让 Agent 在正常任务里读取、运用和维护项目知识，不要求用户每轮提醒写文档或启动总工作流。“自动”指宿主提供维护职责、Agent 依据任务主动判断，不是脚本自动摘抄聊天、自动生成笔记或替 Agent 判断设计是否正确。

## 需求、实现和要证明的行为

| 需求 | 当前实现位置 | 仍须行为验收的部分 |
| --- | --- | --- |
| 普通开发、调试、评审和设计分析先了解适用规则 | [启动职责](../rules/bootstrap.md)、[技能描述与检索步骤](../skills/repo-knowledge/SKILL.md) | 未提示使用插件时，先读取目标作用域规则；不能只依据已过时的聊天上下文 |
| 当前文档随实质行为变化维护 | [当前文档规范](../skills/repo-knowledge/references/current-docs.md) | 修改真正拥有该事实的 README/指南/JSDoc；恢复既有正确契约时不改文档迎合旧 bug |
| 有价值的取舍保留下来，轻微改动不写流水账 | [决定资格与归属](../skills/repo-knowledge/references/decisions.md) | 实际选择理由可被后来任务找到；机械重命名和明显局部修复不新增决定记录 |
| 方案、当前事实和已实现决定不混淆 | [决定生命周期](../skills/repo-knowledge/references/decisions.md) | 允许保存但未实施的方案保持 proposed；实施后更新原所有者和当前说明，保留真实验证缺口 |
| 新决定处理旧记录，而不是不断追加 | [替代与整合规则](../skills/repo-knowledge/references/decisions.md) | 主动找重叠记录；部分替代保留双方有效内容；反转产生明确替代关系；整合保留独有理由并修复链接 |
| 后续任务会检索并复用知识 | [主技能检索步骤](../skills/repo-knowledge/SKILL.md) | 新会话只给普通开发需求，也会读取前一任务的有关依据；只保持代码输出正确不足以证明检索发生 |
| 恢复、压缩和作用域变化后不盲用旧规则 | [SessionStart 适配](../scripts/lib/runtime.mjs)、[启动职责](../rules/bootstrap.md) | 实际 resume/compact 后读取更新的适用文件，应用新约束但保留仍有效的旧接口契约 |
| 尊重已有位置与权限 | [归属规则](../skills/repo-knowledge/references/current-docs.md)、[可选配置](configuration.md) | 使用项目既有 handbook/ADR/notes 及生命周期；只读请求没有项目文件变化；不自动提交或发布 |
| 保持轻量 | [收尾机制](architecture.md)、[配置](configuration.md) | 不强制规划、TDD、多 Agent 或每任务一篇笔记；测量额外工具调用、提醒续跑和无用文档比例 |

上述条目是行为目标，不因字符串测试、格式通过或 receipt 存在而自动成立。

## DSH 的原生机制与本插件的适配

复核的 DSH 当前版本为 [639ed015](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)。其 [根规则](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/AGENTS.md)、[文档规则](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/docs/AGENTS.md) 与 [Notes 生命周期](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/notes/README.md) 将维护判断交给 Agent；机械脚本检查结构和链接，不代写设计解释。

DSH 的 [agent-instructions 运行时](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/context/agent-instructions/src/index.ts) 在首个请求加载作用域链，跟随成功 read/write/edit 刷新嵌套、变更和移除的规则，并通过带来源的持久消息参与恢复。其 [技能目录/加载器](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/skill/tool-skill/src/index.ts) 让模型先看到描述，在匹配任务时按需加载全文。

本插件复用 Codex 原生 AGENTS/技能机制，通过 SessionStart 注入固定维护职责，并要求 Agent 在相关任务、作用域变化和恢复后重新检查适用文件。它没有实现 DSH 的文件触碰投影、规则变更消息或会话重放系统。固定职责重注入不等于项目规则已刷新，相关行为必须在真实宿主中观察，不能宣称完全同构。

DSH 的具体目录分类、双语页面、词数预算或完整运行时不是本插件强制迁移目标。项目已有约定优先。

## Receipt 的定位与负担

收尾状态是本插件的可关闭辅助机制，不是 DSH 的核心。Agent 正常完成有变化的授权任务后，在最终答复末行独立报告文档/笔记状态；宿主 Stop Hook 记录，不再增加模型写插件数据目录的工具命令，用户无需手工填回执。它只能表示自报检查过，不能证明检索、判断或内容正确。

只有状态缺失或无效时，工作树变化才可能引发一次额外续跑。Git 变化无法判断语义重要性或可靠区分并发写入，因此提醒仍需尊重任务边界。`stopReminder: "off"` 保留启动职责并关闭 baseline、自动状态收集与 Stop 跟踪。只读无变化无需状态。应评估遗漏率、无用记录率和额外延迟，而非把状态数量当完成指标。

## 连续场景验收

[连续样例](../evals/continuity-cases.json) 的前五组各有三阶段：跨任务决定检索；提案到实施及部分替代；已有所有者与恢复/压缩后的规则刷新；机械修改、契约修复和只读讨论；项目自有状态/目录中的实施、完整替代归档与拒绝。其余针对性场景和当前证据边界见下文。

```bash
node scripts/eval.mjs prepare-continuity --out /absolute/path/to/new-continuity-eval
```

准备器只创建隔离仓库和控制说明，不运行模型、不宣称验收通过。测试控制方依次使用同一仓库，并按阶段要求新建会话、恢复或真正触发原生压缩。只把 `prompt` 交给模型，不能把 review 清单或期望文件变化混入提示；外部规则更新由测试控制方在模型空闲时施加并单独记账，然后真正恢复会话或执行原生压缩、观察生命周期事件，最后才发送普通任务提示。

每阶段记录开始时的项目清单、实际读文件/Hook 事件和最终差异。尤其不能仅凭“最后输出仍是 JSON”推断旧决定被读取，不能把构造 SessionStart JSON 当成真实压缩，也不能拿任意 Markdown diff 代替语义复核。检索应有针对性，不以全树灌入上下文达标。

## 当前证据与待验边界

实际结果按日期、受测版本、模型和执行方式记录在 [验证记录](../VERIFICATION.md)。本页定义需要证明的行为，不重复保存各轮测试日志。

| 范围 | 已有证据 | 不能由此推出 |
| --- | --- | --- |
| 普通维护与生命周期 | 2026-09-30 的限定 CLI/model/Linux 组合观察到已有文档维护、真实 resume/compact、正常变更回执和只读不变 | 所有模型或平台通用；所有后续文档或规则修订均重新经过原生验收 |
| 规则、决定与知识定位 | 显式提供技能的合成任务覆盖长期/一次性规则、作用域切换、记录整合和多所有者调试 | 自动技能发现可靠率、任意大型仓库召回率或无插件对照的因果收益 |
| 插件用于自身仓库 | 2026-10-02 的恢复 setup 完成，三个原生 Hook 均完成，未产生项目改动；后续文档审查中断 | 有改动后的收尾验收、完整文档审查或随后新会话复用已经通过 |
| 缺失状态后的辅助恢复 | 确定性回归覆盖最多一次提醒与续答登记 | 真实宿主中的提醒、续答回执及额外延迟已全部观察；此前短会话直接给出有效状态没有覆盖该分支 |

最低 CLI 版本、Windows/macOS 原生执行及更广泛的模型兼容性仍需各自证据。诊断只证明相应脚本步骤，回执只表示自报检查；都不能代替对实际读取、改动和知识内容的判断。

连续夹具共包含 10 组 23 阶段，涵盖前述生命周期以及长期子树规则、兄弟作用域、重叠决定整合、缺失状态恢复和多所有者调试。夹具存在不代表所有阶段已通过；按 [测试说明](testing.md) 选择尚需证明的最小场景，不要求每次文档维护运行全部场景。

仓库当前文档可以由维护者直接依据源码和相同规则维护，其质量通过整页审阅及本地检查判断。只有待证明的主张依赖原生宿主或模型行为时，才需要相应的真实 Codex 任务。不要以长时间的全仓库写作代替小范围行为验收，也不要用直接修订后的文档冒充模型原始产物。
