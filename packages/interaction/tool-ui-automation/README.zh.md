---
description: "基于 ctx.uiAutomation 的十一个模型侧语义 UI 工具。"
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-ui-automation

[English](README.md) | 中文

## 概述

此 Consumer 在 ctx.uiAutomation 上注册十一个 typed UI 工具。每个 Agent 获取分页观察后最多执行一个 action，然后 wait 或重新观察。确切 Agent 与工具 AbortSignal 会传给 Provider。插件卸载会移除全部工具，并使按 Agent 索引的状态不可达。

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

模型会看到生成的[十一个 UI 工具 schema](../../../docs/tool-catalog.zh.md#deepseek-aidsh-tool-ui-automation)：snapshot、click、select-item、set-checked、fill、select-option、set-value、press、activate-tab、wait 和 describe-ref。Snapshot 接受 Provider 签发的分页 cursor。Fill 接受 literal text 或不透明 Host slot。set-checked 要求显式布尔状态，因此重放请求不会反转已经满足的 checkbox。

#### Token 影响

插件可见时，每个请求都有固定 schema 成本。

#### KV Cache 影响

定义与可见性不变时，前缀保持稳定。

### 工具历史

#### 模型看到的内容

调用和经过投影的 Provider 结果作为普通 tool/call 与 tool/result 事件保留。Host slot 只暴露不透明引用；Host 持有的值不会进入工具参数或结果。

#### Token 影响

Snapshot page、literal action value 和结果会增加依数据而定的保留 token。

#### KV Cache 影响

仅追加；每个调用和结果位于可复用请求前缀之后。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- Wait condition 与 error code 是 Provider 自有字符串，因为不同产品观察不同权威状态。
- 哪些控件存在、哪些 literal value 安全、哪些 Host slot 可被消耗、哪些 action 需要审批，均由 Provider policy 决定。
