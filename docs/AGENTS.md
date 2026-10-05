# 文档维护规则

本目录维护插件的当前说明，每个事实只有一个完整维护位置。先按读者问题找到所有者，再把改动融入其原有叙述；其他页面保留必要的局部保证和链接，不复制整段契约。

## 内容与目录归属

- 根 [README](../README.md) 面向初次使用者，提供用途、最短安装路径、正常使用与重要边界
- [architecture.md](architecture.md) 是高层组件地图，不承载协议字段清单、操作步骤或历史运行结果
- `subsystems/` 放机制参考；当前 [hook-protocol.md](subsystems/hook-protocol.md) 维护事件、回合状态、时序和失败语义，子系统页保持平铺
- `user/` 放使用指南；[installation.md](user/installation.md)、[configuration.md](user/configuration.md)、[hook-diagnostics.md](user/hook-diagnostics.md) 分别拥有安装、设置和排查操作
- [functional-contract.md](functional-contract.md) 定义目标、非目标、行为验收标准及 DSH 适配差异；[testing.md](testing.md) 维护可重复执行的验证步骤；带日期、版本和限制的结果放在 [VERIFICATION.md](../VERIFICATION.md)
- [sources.md](sources.md) 维护引用基线与适配依据；长期设计理由放在 [决定记录](../.agents/notes/README.md)，安全边界与报告约定放在 [SECURITY.md](../SECURITY.md)

## 命名与维护

本目录沿用 DSH 的职责分层、`user/` 指南和 `subsystems/` 参考入口，按本项目规模保留跨主题页面在根层；不复制其完整教学、讨论、暂存或双语目录。只有真实内容需要独立所有者时才新增层次，不预建空分类。具体对照与固定来源见 [sources.md](sources.md)。

主题文件使用小写英文 `kebab-case.md`，当前说明不在文件名中加日期；`AGENTS.md`、`README.md` 等工具或仓库约定名称保留大写。决定记录的日期和生命周期路径遵循其自己的 README，不能把历史结果塞进当前指南。

本仓库说明与开发决定使用中文；代码标识、命令、协议字段和校验器依赖的标题、状态、标记保留原样。这不要求下游项目改用中文，也不要求成对翻译。精简时保留条件、例外、时序、义务与否定保证。

计划、已实现行为与已观察证据必须分开。模拟 Hook 测试不能写成原生集成通过；安装命令与权限操作须核对宿主契约并注明实际验证范围。移动或拆分页面时，同步修复入站链接和导航、更新包清单并回读受影响的完整章节；不把测试日志和开发过程堆进 README。
