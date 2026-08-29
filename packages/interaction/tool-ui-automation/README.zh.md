---
description: "基于 ctx.uiAutomation 的九个模型侧语义 UI 工具。"
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-ui-automation

[English](README.md) | 中文

## 概述

此 Consumer 在 `ctx.uiAutomation` 上注册九个 typed UI 工具。每个 Agent 先取快照，最多执行一个 action，然后 wait 或获取新快照。确切 Agent 与工具 AbortSignal 会传给 Provider。插件卸载会移除全部工具和插件局部状态。

## 目录

- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="dev-note"></a>
### 开发备注

无。

<a id="model-experience"></a>
## 模型体验

### 工具 schema

#### 模型看到的内容

模型会看到生成的[九个 UI 工具 schema](../../../docs/tool-catalog.zh.md#deepseek-aidsh-tool-ui-automation)：snapshot、click、select-item、fill、select-option、set-value、press、wait 和 describe-ref。

#### Token 影响

插件可见时，每个请求都有固定 schema 成本。

#### KV Cache 影响

定义与可见性不变时，前缀保持稳定。

### 工具历史

#### 模型看到的内容

调用和 Provider JSON 结果作为普通 `tool/call` 与 `tool/result` 事件保留。

#### Token 影响

快照内容和 action 值会增加依数据而定的保留 token。

#### KV Cache 影响

仅追加；每个调用和结果位于可复用请求前缀之后。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- Consumer 保留 v1 顺序；分页、typed literal/host-slot value 和显式 cancel 属于后续版本。
- 哪些控件存在、哪些值安全、哪些 action 需要审批由 Provider policy 决定。
