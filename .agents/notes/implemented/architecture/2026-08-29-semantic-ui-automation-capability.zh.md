# Agent Note: 语义 UI 自动化能力

Status: implemented

[English](2026-08-29-semantic-ui-automation-capability.md) | 中文

## Problem

产品内 agent 可能需要通过用户可见的同一批控件操作产品界面。如果工具定义留在单一产品 runtime 内，模型 schema、action 顺序、Host 传输、目标身份、审批和隐私策略会彼此耦合。其他 Host 无法复用该能力，Harness 也无法在不加载产品代码时测试工具纪律。

## Decision

dsh-ui-automation Service Definition 拥有 ctx.uiAutomation：分页语义观察，以及有界 action、wait 与 describe 调用。每次操作显式携带确切 Agent 与 AbortSignal。产品 Provider 拥有目标身份、安全、审批、传输、实际输入投递和 wait condition 语义。

空 cursor 开始一份 Provider 自有观察租约。每页共享同一个不透明 snapshot id 与 surface revision，Provider 签发的 cursor 延续该租约。Action 会消耗观察，只返回 admission，而不声称 UI 已达到请求状态。只有 accepted action 才能进入 wait；否则 Agent 必须重新观察。

dsh-tool-ui-automation Consumer 注册十一个版本化工具，并使用按确切 Agent 索引的插件局部 WeakMap。每个 Agent 同时只允许一个待完成 Provider 操作；若 Provider 续页结果改变 snapshot identity，则调用失败；只有 action Provider 返回后才发布 accepted-action 状态。Provider 失败或调用方取消后均丢弃状态。Consumer 只把已声明字段投影到闭合工具结果 schema。Cordis effect disposal 会移除全部工具注册，并让 Agent 状态不可达。

Fill input 区分模型可见 literal text 与不透明 Host slot。Provider 决定是否允许 literal，并在不向工具参数或结果暴露值的情况下解析 slot。Literal receipt 只可返回字符数和 digest；Consumer 对 Host-slot action 强制把两个字段置 null。Checkbox 变更通过 set_checked 携带显式布尔目标；Provider 把已经满足的状态处理为 no-op，因此重试不会反转先前成功的选择。

接口显式保留 Agent 与取消，因为 UI 自动化通常跨越进程。Snapshot ref 与 cursor 是 Provider 自有不透明值；Harness 不解释 widget tree、浏览器 selector、坐标、产品身份或临床 terminal state。

## Alternatives considered

**保留产品专用工具。** 这会少两个包，但工具顺序与 Host 传输无法分离，每个 Host 都会重复状态机，也无法编写 Provider 中立测试。

**把模型工具放进 Service Definition。** 工具 schema 和保留结果属于 Consumer 行为。合并会迫使每个 Provider 发布同一个模型词汇，并让编程调用方依赖工具 runtime。

**从 ambient initiator state 推导 Agent。** Remote Provider 必须显式序列化身份；无 subject 调用必须失败，不能继承无关工作。Tool execution 已拥有确切 Agent 与 AbortSignal。

**把产品 locator、审批或临床 wait 加进通用方法。** 这些规则取决于 Host 数据与权威。产品能力在 UI automation 旁组合并返回不透明 ref 或稳定业务结果，无需让通用 service 理解患者或 workflow。

## Consequences

产品可以提供语义 UI 自动化而不导入模型工具代码；Consumer 可以执行分页和单 action 观察纪律而不导入 widget 或传输库。显式 Agent 与 AbortSignal 使并发 session 和取消能够跨 Provider 路由。

跨进程 transport 仍需自有 cancel message 与 quiescence contract；传递 AbortSignal 并不定义 wire protocol。该能力不会为 Harness 增加任意桌面、浏览器、坐标或临床 service 控制。
