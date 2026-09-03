# Agent Note: 收窄 Python SDK 的 JSON-RPC 方向

Status: proposed

[English](2026-09-03-narrow-python-sdk-jsonrpc-direction.md) | 中文

## Problem

Python `HarnessClient` 是随附 SDK server 的客户端：它发送 request，接收 response 或 notification。但它仍通过 `notify()`、`next_request()`、`respond()`、`respond_error()`、公共 `IncomingRequest` 类型、入站 request 队列及该队列的关闭 sentinel 暴露反向 peer 能力。精确生产搜索找不到调用方；只有 `python/sdk/tests/test_client.py` 构造伪 server request 并调用 response helper。类型化 SDK request 与 notification map 中没有任何成员需要由客户端发 notification，或由 server 发 request。

较早的[让 JSON-RPC 完成与 transport 具备方向性](../../rejected/simplification/2026-07-19-make-jsonrpc-directional.zh.md)提案已无法按原文实施。随附 server 现在立即返回 `{ messageId }` 并发布覆盖区间的 `session.status`；它不发提案所述的 `session.finished`，[自有 run 决策](../../implemented/architecture/2026-07-30-followup-enqueue-and-owned-runs.zh.md)还明确避免把全 agent 的一次 idle 结果归因给某条 prompt。共享 TypeScript peer 也已有真实双向消费方：Codex app-server 适配器会发送 request 与 notification，并处理子进程发来的两者。后续约定使宽泛 transport 与结算改动失效，但 Python 独有的无用反向能力仍可删除。

## Proposal

把 `python/sdk/src/deepseek_harness/client.py` 专门化为公共 SDK server 实际使用的方向。删除 `HarnessClient.notify()`、`next_request()`、`respond()` 与 `respond_error()`；从 `models.py`、包导出、测试和文档删除 `IncomingRequest`；删除 `_requests` 及其 teardown 发布。Reader 继续按 response id 投递 request waiter，并把 notification 投递给现有 subscriber。

同时带有 `id` 与 `method` 的入站 JSON-RPC object 视为不受支持的 server request。它禁止进入 response waiter，也不得阻塞 teardown。实施时在两种明确行为中选择一种：携带受限诊断后忽略，或用 `SdkProtocolError` 使 transport 失败；使用伪 runtime 锁定该行为。不要为了类型化操作永远不会产生的 frame 保留公共队列。畸形 frame 延续现有分类。

保留 `session_prompt()` 返回已入队 message id；保留 `Session.run()` 通过 `session.status` 管理区间与结算；共享 TypeScript transport 和 Codex protocol 方向保持不变。如果未来 SDK 功能需要 server 发起交互，先为该类型化操作定义归属、取消、并发与结算语义，再恢复所需的反向能力。

## Alternatives considered

**实施较早的宽泛方向化提案。** 不采用。它会删除 Codex 子进程正在使用的 TypeScript 双向能力，还会替换后续架构明确拥有的 prompt 入队／区间语义。过时提案不能授权删除当前生产行为。

**为自定义 runtime 保留通用对称 Python peer。** 不采用。Python SDK 启动或连接的是 DeepSeek Harness SDK protocol，不是任意 JSON-RPC 应用。通用反向方法在没有类型化 server 操作或仓库消费方的情况下扩张公共 API 与 teardown 状态。自定义 runtime 可自行实现 peer；未来产品需求则添加其确切需要的方向。

**把反向方法改为私有测试 helper。** 不采用。伪 server 可以直接写 frame 并检查客户端输出。为了测试不受支持的行为而保留同一队列与关闭分支，仍是纯测试驱动的生产机制。

## Acceptance criteria

- Python 公共包不再导出 `IncomingRequest`、notification sender、入站 request waiter 或 response helper。
- `HarnessClient` 不再保留入站 request 队列或关闭 sentinel；意外 request frame 有明确且不阻塞的行为。
- 出站 request 关联、入站 notification、订阅过滤、session tree 发现、runtime 诊断与完全停稳的关闭行为保持不变。
- `session_prompt()` 继续返回 `messageId`，`Session.run()` 继续通过下一次根 agent idle 区间与持久化 `turn/end` 证据管理结算。
- TypeScript SDK transport 与 Codex app-server transport 保持当前方向。
- Python 单元测试、打包 runtime smoke、两份 SDK projection、文档与仓库检查通过。

## Risks

把 `HarnessClient` 当作通用 JSON-RPC server peer 使用的预发布调用方必须替换这些调用。意外 request 触发 transport 失败比静默忽略更严格；忽略则可能掩盖版本不匹配。两者都比无限排队一个受支持调用方无法回答的 request 更安全，但实施必须记录并测试所选失败模式。
