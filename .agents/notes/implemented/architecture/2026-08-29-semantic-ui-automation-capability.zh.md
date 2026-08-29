# Agent Note: Semantic UI automation capability

Status: implemented

[English](2026-08-29-semantic-ui-automation-capability.md) | 中文

## Problem

产品内的 agent 可能需要通过用户可见的同一批控件操作产品界面。如果工具定义留在单一产品 runtime 内，模型 schema、action 顺序、Host 传输、widget 身份、审批和隐私策略会彼此耦合。其他 Host 无法复用该能力，Harness 也无法在不加载产品代码时测试工具顺序约束。

## Decision

`dsh-ui-automation` Service Definition 拥有 `ctx.uiAutomation`：语义快照，以及有界 action、wait 与 describe 调用。每次操作显式携带确切 Agent 与 AbortSignal。产品 Provider 拥有目标身份、安全、审批、传输和实际输入投递。

独立的 `dsh-tool-ui-automation` Consumer 注册 v1 工具词汇，并使用按确切 Agent 索引的插件局部 WeakMap。一个 Agent 观察快照后最多执行一个 action，随后必须 wait 或重新观察。Consumer 把 Provider DTO 作为工具 JSON 转发，不实现 UI 或权限决定。Cordis effect disposal 会移除全部工具注册；插件卸载后其局部状态不可达。

接口显式保留 Agent 与取消。UI 自动化跨越产品，通常还跨越进程，因此 ambient initiator state 不能把任一值带给 Provider。snapshot ref 是 Provider 自有的不透明值；Harness 不解释 widget tree、浏览器 selector、坐标或产品身份。

## Alternatives considered

**保留产品专用工具。** 这会少两个包，但工具调度与 Host 传输无法分离，每个 Host 都会重复同一状态机，也无法编写 Provider 中立的 contract test。

**把模型工具放进 Service Definition。** 工具 schema 和保留结果属于 Consumer 行为。合并会迫使每个 Provider 发布同一个模型词汇，并让非模型调用方依赖工具 runtime。

**从 ambient initiator state 推导 Agent。** remote 或 callback Provider 必须显式序列化身份；无 subject 的工具调用必须失败，不能继承无关工作。tool execution 已拥有确切 Agent 与 AbortSignal。

**在 seam 中加入审批和隐私策略。** 这些规则取决于 Host target 与数据。Provider 在实际投递 action 的位置执行；通用接口无法安全分类未知产品控件。

## Consequences

产品可以提供语义 UI 自动化而不导入模型工具代码；Consumer 可以执行单 action 观察纪律而不导入 widget 或传输库。显式 Agent 与 AbortSignal 使并发 session 和取消能够跨 Provider boundary 路由。

v1 DTO 对应当前有界快照词汇，不提供分页、typed host slot 或显式跨传输 cancel request。这些能力需要版本化 contract，不能成为单一 Provider 的隐藏行为。该能力不会让任意桌面、浏览器、坐标或临床 service 控制成为 Harness 能力。
