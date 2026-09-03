# Agent Note: 裁剪剩余的无用公共 API 与结果字段

Status: proposed

[English](2026-07-04-prune-dead-core-spine-api.md) | 中文

## Problem

若干公共方法、结果字段、生命周期 hook 与包根导出没有固定生产消费方。测试和生成的 Cordis reflection 让它们继续可见，扩大预发布 API，并迫使实现保留无人使用的状态。本清单把包与应用源码、运行时脚本及随附 Cordis 配置视为生产语料；测试、README、生成目录和 Agent Note 能证明发布事实，但不是固定调用方。

`cordis_inspect` 与 `cordis_mount` 让服务方法及返回字段成为真实的动态产品面，因此删除目录化成员是有意的预发布收缩，即使仓库源码没有调用。包根实现 helper 不同：Loader namespace import 只需要挂载插件约定，测试可以直接导入拥有它们的源码模块，无需把每个 helper 发布到包根。

当前精确符号清单如下：

| API 元素 | 消费方证据 | 精简方式 |
| --- | --- | --- |
| `AgentSetupCommit` 与 `AgentSetup` 的返回分支 | Agent-loop 是唯一调用 `commit()` 的代码；ACP、Webhook、API Session Controller、Headless 与 preset 组合中的所有生产 setup callback 都只返回 `void` 或 `Promise<void>`。只有 loop 测试会产生 finalizer。 | 让 setup 只返回 `void`／`Promise<void>`，删除发布 finalizer 分支、相应 rollback 用例，以及宣传可变 provisioning 重校验的目录／文档。 |
| `PlanModeController.get()`／`set()` | `get()` 没有固定生产调用方；类内部的 `/plan` handler 是 `set()` 唯一固定调用方。包外只剩测试、文档和生成 reflection。 | 删除 `get()`，把 selection 改为 `/plan` 使用的内部操作；保留 command、exit tool、prompt section、持久化 projection、pending-intent 时序与模型可见行为。 |
| `CompactionResult.startSeq`、`endSeq` 与 `summary` | 生产消费方读取被 shadow 的 range／seq／token 统计，`command-compact` 还读取 `summarySeq` 来生成 `CommandResult.sourceEventSeq`；没有生产消费方读取所列三项回显。其值归持久化事件拥有。 | 只删除三个无用字段并简化结果构造。保留已承担真实职责的 `summarySeq`，以及 compaction 生命周期与 transcript renderer。 |
| `tool-fs-search` 包根实现导出 | 精确生产搜索找不到包外具名消费方使用 re-export 的 glob／grep builder、parser、formatter、presenter、常量、错误类或运行 helper。插件自身从本地 owner 导入，Loader 消费方只需要 `name`、`inject`、`Config` 与 `apply`。 | 停止从包根 re-export 实现模块；同包测试直接导入源码 owner。保留插件／配置约定，以及实施时被真实外部消费方证明必要的值。 |
| `tool-web` 包根实现导出 | 精确生产搜索找不到包外具名消费方使用 search／fetch apply helper、formatter、presenter、metadata converter／type 或默认常量。运行时组合挂载 namespace 插件。 | 保留 `name`、`inject`、`Config` 与 `apply`；把 search／fetch 实现 helper 改为源码私有，并把测试移到拥有它们的模块。 |
| `SubagentDepthError` 根导出 | 生产代码在包内抛出它，但没有生产包导入这个具体类；固定调用方处理服务的公共 error／result 约定。 | 保留深度强制与诊断，但把具体强制错误改为包私有，并通过 start 边界测试。 |

较早清单中未出现在本表的条目不属于本提案。当前代码已经让 `BlockAssembler.push()` 返回 `void`，不再从包根导出 `ReactLoopAgent` 与 worker protocol，省略了重复的 `ToolExecutionResult.callId`、`ToolNotFoundError.toolName` 与 `SystemPrompt.config` 字段，并在生产路径中使用 `CodeRuntime.language`／`isolation` 以及 `LlmError.status`。实施者必须遵循上表，不能把旧符号清单当作权威。

## Proposal

把每个表项作为一次公共面清理进行删除或降级，并按 owning package 拆成可审阅 commit。同步更新包 README、JSDoc、子系统页面、生成的 Cordis reflection、类型等价记录与测试。测试直接导入私有源码模块或验证公共行为，不再为了 helper 而保留导出。

改动每个表项前，在实施分支上重复精确生产搜索；若某成员已获得真实调用方则予以保留。不得折叠 capability seam、删除 dialect／provider twin、削弱发布 rollback 或完全停稳的关闭行为，也不得删除 `CompactionResult.summarySeq`。

## Alternatives considered

**把测试便利与自包含结果回显继续设为公共 API。** 不采用。公共 helper 能简化白盒 import，返回每个生命周期事件值看起来也很方便，但测试可以导入源码 owner，持久化事件仍是 compaction 细节的权威来源。真实消费方可以在归属与失败语义明确时添加最小 API。

**为未来可变 provisioning 保留 `AgentSetupCommit`。** 不采用。Finalizer 是合理的提交点设计，但当前没有生产方使用。异步 setup 完成前，Agent 仍保持未发布且可 rollback。未来若 provisioning source 可能在准备与发布之间变化，可根据确切需求引入带重校验的 transaction，无需让每个 setup 永久携带无用联合分支。

**为动态 Cordis mount 保留 `PlanModeController.set()`。** 不采用。模型编写的 mount 与仓库外 Host 插件现在确实可调用它，但受支持的产品控制是 `/plan` 与 `exit_plan_mode`，它们拥有用户输入、narration、review 与持久化时序。通用 setter 绕过这些产品交互，却没有当前 owner。

**把每个包根 helper 保留为非正式库。** 不采用。Function plugin 根是 Loader 约定，不是便利 barrel。发布实现函数会在没有独立受支持库用途的情况下制造兼容面。

## Acceptance criteria

- 每个表项按规定消失或降级，且新的精确符号搜索确认没有新增生产消费方。
- Agent create／resume 在移除无用 finalizer 后仍保留未发布 setup、取消、rollback、scoped contribution 顺序、persistence suffix 处理、发布与 dispose 行为。
- Plan mode 保留 command／tool UX、持久化状态、projection、prompt guidance、pending selection、narration 与 review settlement。
- Compaction 保留 `summarySeq`、生命周期事件、自动／手工操作、取消、shadow 统计与 transcript 行为。
- 文件搜索与 Web 工具保留相同 schema、配置、模型可见输出、展示、超时、spill 与 provider 行为，同时包根只暴露受支持插件 API。
- 聚焦行为测试、可能影响输出时的 snapshot、typecheck、coverage、生成目录、build、hygiene 与文档检查通过。

## Risks

服务方法与结果字段改动会让动态 mount 和预发布 embedder 发生编译可见的产品收缩。删除 `AgentSetupCommit` 会放弃无人使用的发布时重校验 hook；私有化 plan selection 会放弃受支持交互之外的直接编程开关。包根降级可能破坏仓库没有演练的 import。预发布立场允许这些破坏，但实施每个表项前都必须立即重新取证。
