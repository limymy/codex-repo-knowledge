# 贡献指南

本项目只负责仓库知识维护，不接管规划、实现、测试或发布的整体流程。修改前阅读 [AGENTS.md](AGENTS.md)、受影响目录的规则、现有文档和实现。

仓库文档由维护者直接维护，不要求交给一次 Codex 会话生成。遵循插件自己的 [当前文档规范](skills/repo-knowledge/references/current-docs.md)；确有长期取舍时，再按 [决定规范](skills/repo-knowledge/references/decisions.md) 维护已有记录。核对源码与真实验证结果，按内容所有者整合说明，回读完整章节，不能用测试日志、模型自述或形式正确的模板代替准确连贯的内容。

## 按问题找到知识所有者

- 修改 Hook 或定位回执问题：先读 [架构与实现入口](docs/architecture.md)，再查 [活动决定](.agents/notes/README.md) 中已有的约束与理由
- 修改用户操作、默认值或停用方式：维护 [安装](docs/installation.md) 或 [配置](docs/configuration.md)；README 只保留首次使用所需入口
- 排查“没有日志、没有提醒、没有回执”：使用 [Hook 核验](docs/hook-diagnostics.md) 区分宿主执行、脚本结果和模型采用，不凭单一现象推断故障
- 改变预期能力或验收方式：维护 [功能契约](docs/functional-contract.md) 与 [测试说明](docs/testing.md)；实际版本和运行结果只放 [验证记录](VERIFICATION.md)

先在所属页面维护完整说明，其他页面保留必要的局部保证和链接。决定记录解释非显然取舍，不复制字段清单或逐次测试日志。

## 实现与验证

```bash
npm run verify
```

代码使用 Node.js 内置模块，没有 npm 运行时依赖。协议变更对照 Codex 官方资料，不凭其他 Agent 的同名字段推断兼容。

提交 PR 时说明行为变化、实际验证和未验证部分。当前文档随代码同步，非显然的长期取舍才写决定记录。不得为通过检查制造文档、伪造 receipt、删除必要断言或降低标准。

按 [测试说明](docs/testing.md) 选择能证明本次变化的检查。文档质量通过直接审阅与本地检查确认；真实 Codex 会话只承担必须依赖宿主和模型的行为验证，优先使用小型任务，不以全仓库文档生成作为常规验收步骤。模拟事件、原生安装、Hook 执行和模型采用规则分别记录，不能相互替代。

新增网络访问、依赖、权限或持久化位置，需要明确理由。
