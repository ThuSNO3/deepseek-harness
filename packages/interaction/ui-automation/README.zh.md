---
description: "面向 Host 自有界面的提供方中立语义 UI 自动化服务。"
kind: "package-reference"
---

# @deepseek-ai/dsh-ui-automation

[English](README.md) | 中文

## 概述

此 Service Definition 拥有 `ctx.uiAutomation`。Host Provider 为确切调用 Agent 返回语义快照，并执行有界 action、wait 与 describe。服务不包含浏览器、桌面、widget、传输、审批、隐私或模型工具策略。

## 目录

- [服务约定](#service-contract)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="service-contract"></a>
## 服务约定

Provider 每次调用都接收确切 Agent 与 AbortSignal。快照 ref 和 revision 是 Provider 自有的不透明值。Consumer 必须通过 wait 或新快照观察后续状态。参见[子系统参考](../../../docs/subsystems/ui-automation.zh.md)。

<a id="dev-note"></a>
### 开发备注

无。

<a id="model-experience"></a>
## 模型体验

间接影响，由拥有工具 schema 并渲染 Provider 结果的 Consumer 包产生。

#### KV Cache 影响

没有直接失效；模型可见 schema 与保留结果由各 Consumer 拥有。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- v1 只提供一个有界快照，不含分页或显式跨传输 cancel。
