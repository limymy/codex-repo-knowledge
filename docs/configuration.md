# 项目配置

默认无需配置。需要调整行为时，在 Git 项目根目录创建或修改 `.repo-knowledge.json`；配置只影响该项目。

## 配置项

以下是默认值：

```json
{
  "version": 1,
  "enabled": true,
  "docsRoot": "docs",
  "notesRoot": ".agents/notes",
  "stopReminder": "once",
  "diagnostics": false
}
```

| 配置项 | 含义 |
| --- | --- |
| version | 配置格式版本，目前为 1 |
| enabled | 是否启用该项目的自动行为 |
| docsRoot | 没有既有文档所有者时的后备目录 |
| notesRoot | 没有既有决定记录所有者时的后备目录，也是笔记检查的目标位置 |
| stopReminder | once 启用有界收尾跟踪；off 关闭跟踪 |
| diagnostics | 是否记录有界 Hook 诊断，默认关闭 |

目录配置不会取代 Agent 查找已有内容所有者的职责。docsRoot 和 notesRoot 应是仓库内不同的相对目录；绝对路径、父目录跳转、.git、反斜杠、控制字符及已有符号链接路径会被拒绝。未知配置项或无效值会报错，Hook 会提示问题，不会悄悄换成默认值。

## 关闭提醒或自动行为

`stopReminder: "off"` 关闭起始快照、回执和 Stop 跟踪，仍保留 SessionStart 的维护职责。`enabled: false` 关闭该项目全部自动行为。

显式调用技能仍是一项用户请求，不能把 enabled 当成授权边界。安装或配置插件本身不授权修改业务代码、提交、推送、部署或额外模型调用。

## 正常收尾状态

完成有相关变化的授权任务后，Agent 在最终答复的最后一行分别报告文档和笔记状态：

```text
知识维护：文档=已更新；笔记=无需更新
```

每项独立选择“已更新”“无需更新”或“暂缓”。英文格式也有效：

```text
Knowledge maintenance: docs=updated; notes=not-needed
```

英文值为 updated、not-needed 或 deferred。需要暂缓时，在状态行之前解释原因。状态行必须是普通独立文本，不能放在引用、列表、缩进或代码块内，其后不能再有其它内容。

这是 Agent 正常答复的一部分，用户无需运行回执命令。宿主 Stop Hook 只读取当前最后答复并登记状态；回执是自报判断，不证明实际维护正确。只读且无变化的任务无需状态。宿主未提供所需字段时会放行，不读取会话文件来补取内容。

旧 `review` CLI 仅保留给显式诊断和兼容用途，需要对插件数据目录有写权限。正常流程不要求模型运行它，也不要求额外开放沙箱目录。

## 检查配置、笔记与 Hook

```bash
node /path/to/plugin/scripts/rk.mjs doctor --cwd /path/to/project
node /path/to/plugin/scripts/rk.mjs check-notes --cwd /path/to/project
```

`doctor` 检查有效配置、Git 可见性和快照是否完整，不验证原生插件加载。`check-notes` 只检查采用插件标记的决定记录及本地链接，忽略未标记 ADR，并跳过所有名为 archived 的子树；它不判断内容是否真实、是否遗漏应写的笔记，也不读取 Hook 日志。

要观察实际事件，启用 diagnostics 并按 [本地 Hook 核验](hook-diagnostics.md) 操作。诊断默认关闭；开启后只记录固定类别的有界数据，不保存提示、文件内容或原始错误。安装与信任管理见 [安装指南](installation.md)。

## 运行数据与清理

运行状态位于宿主提供的 `<PLUGIN_DATA>/repo-knowledge-state-v1`，不写入项目目录。状态包括仓库标识、时间戳、聚合摘要、计数、提醒是否已使用，以及可选的简短维护理由；不要在理由中放秘密。宿主没有提供数据目录、目录位于项目内或路径含符号链接时，提醒会停用并提示。

记录在七天后不再用于运行判断，但文件不会自动删除。需要重置时，先结束有关会话，再仅删除已确认属于本插件的状态目录。不要修改活动回合文件或删除其他插件数据；遇到遗留锁时，插件会放行，不擅自移除可能仍在使用的锁。
