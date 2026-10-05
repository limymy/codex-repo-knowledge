# 功能目标与验收边界

本页定义插件要达到的行为，以及与 DSH 原生机制的差别。如何选择和执行检查见[测试说明](testing.md)；已观察结果、受测版本和未验证边界见[验证记录](../VERIFICATION.md)。有测试夹具、通过格式检查或收到回执，都不能单独证明目标已达到。

## 目标与非目标

目标是让 Agent 在正常开发、调试、评审和设计分析中读取、运用和维护项目知识，不要求用户每轮提醒写文档或启动总工作流。“自动”指宿主提供维护职责、Agent 依据任务主动判断，不是脚本自动摘抄聊天、自动生成笔记或替 Agent 判断设计是否正确。

插件是一层知识维护能力，不承担以下职责：

- 不以插件存在或 Hook 提醒扩大任务授权，不自动提交、推送或发布；只读讨论允许检索，不允许持久化
- 不强制规划、TDD、多 Agent 或每任务一篇笔记；机械修改和明显局部修复不因发生过工作就需要决定记录
- 不强制迁移项目既有 handbook、ADR、notes、状态或目录约定，也不把 DSH 的完整运行时作为兼容承诺
- 不把回执、Markdown 差异或脚本退出当作知识检索、判断和内容正确性的证明

## 行为验收标准

| 行为目标 | 应观察到的结果 | 规范入口 |
| --- | --- | --- |
| 普通任务先了解适用规则 | 未提示使用插件时，先读取目标作用域规则与有关知识，不能只依据已过时的聊天上下文 | [启动职责](../rules/bootstrap.md)、[技能检索步骤](../skills/repo-knowledge/SKILL.md) |
| 长期约束与一次性要求分开 | 经确认的长期规则维护到适用作用域；一次性任务要求不被提升为永久规则 | [规则维护](../skills/repo-knowledge/references/repository-rules.md) |
| 当前文档随实质行为变化维护 | 更新该事实所属的 README、指南或 JSDoc；恢复既有正确契约时不改文档迎合旧 bug | [当前文档规范](../skills/repo-knowledge/references/current-docs.md) |
| 有价值的取舍可供后续任务复用 | 保留实际选择的理由；机械重命名和明显局部修复不新增流水账式记录 | [决定资格与归属](../skills/repo-knowledge/references/decisions.md) |
| 方案、当前事实和已实现决定不混淆 | 获准保存但未实施的方案保持 proposed 或项目等价状态；实施后更新原记录和当前说明，保留真实验证缺口 | [决定生命周期](../skills/repo-knowledge/references/decisions.md) |
| 新决定处理旧记录 | 主动找重叠记录；部分替代保留双方有效内容；反转产生明确替代关系；整合保留独有理由并修复链接 | [替代与整合规则](../skills/repo-knowledge/references/decisions.md) |
| 后续任务检索并复用知识 | 新会话只给普通开发需求，也会读取前一任务的有关依据；只保持代码输出正确不足以证明检索发生 | [主技能检索步骤](../skills/repo-knowledge/SKILL.md) |
| 恢复、压缩和作用域变化后重新核对规则 | 读取更新的适用文件，应用新约束但保留仍有效的旧接口契约；同会话进入兄弟作用域时不沿用不适用的旧规则 | [启动职责](../rules/bootstrap.md) |
| 尊重已有知识位置与权限 | 沿用项目已有的知识存放位置及生命周期，不建立重复说明；只读请求没有项目文件变化，不自动提交或发布 | [归属规则](../skills/repo-knowledge/references/current-docs.md)、[可选配置](user/configuration.md) |
| 维护负担保持有限 | 不为满足插件制造无用文档、笔记或工具调用；正常收尾与遗漏状态后的辅助提醒分别评价 | [辅助收尾协议](subsystems/hook-protocol.md) |

这些标准要求检查实际读取、改动及知识内容。针对性检索不能由全树灌入上下文代替；诊断只能证明其记录的脚本步骤。某个任务、模型或平台中的样本通过，不构成其他组合的普遍保证。

## DSH 的原生机制与本插件的适配

本插件对照的 DSH 基线为 [639ed015](https://github.com/deepseek-ai/deepseek-harness/tree/639ed015397290b3745d163aafe02ffee4aa3f84)。其[根规则](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/AGENTS.md)、[文档规则](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/docs/AGENTS.md)与 [Notes 生命周期](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/.agents/notes/README.md)将维护判断交给 Agent；机械脚本检查结构和链接，不代写设计解释。

DSH 的 [agent-instructions 运行时](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/context/agent-instructions/src/index.ts)在首个请求加载作用域链，跟随成功 read/write/edit 刷新嵌套、变更和移除的规则，并通过带来源的持久消息参与恢复。其[技能目录/加载器](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/skill/tool-skill/src/index.ts)让模型先看到描述，在匹配任务时按需加载全文。

本插件复用 Codex 原生 AGENTS/技能机制，通过 SessionStart 注入固定维护职责，并要求 Agent 在相关任务、作用域变化和恢复后重新检查适用文件。它没有实现 DSH 的文件触碰投影、规则变更消息或会话重放系统。固定职责重注入不等于项目规则已刷新，相关行为必须在真实宿主中观察，不能声称两者机制完全相同。组件职责见[架构地图](architecture.md)，事件和状态细节见 [Hook 协议](subsystems/hook-protocol.md)。

DSH 的具体目录分类、双语页面、词数预算或完整运行时不是本插件强制迁移目标。项目已有约定优先。

## 辅助收尾的验收边界

收尾状态是本插件的可关闭辅助机制，不是 DSH 的核心。Agent 完成有变化的授权任务后自报文档和笔记的维护结果，由宿主记录；正常流程不应要求用户手工填回执，也不应增加模型写插件数据目录的工具命令。只读且无变化的任务无需状态。回执只能表示自报检查过，不能证明检索、判断或内容正确。

状态缺失或无效时，工作树变化才可能引发一次额外续跑。Git 变化无法判断语义重要性，也无法可靠区分并发写入，因此提醒仍需尊重任务边界。关闭辅助收尾应保留启动职责；具体开关及影响由[配置说明](user/configuration.md)维护，收集与提醒顺序由 [Hook 协议](subsystems/hook-protocol.md)维护。

正常状态收集、遗漏状态后的提醒和续答登记是不同的验收主张。正常 Stop 或首次就有效的答复不证明兜底分支成立；状态数量也不是完成指标。评估额外工具调用、遗漏率、无用记录率和额外延迟的方法见[测试说明](testing.md)，各次实际结果见[验证记录](../VERIFICATION.md)。
