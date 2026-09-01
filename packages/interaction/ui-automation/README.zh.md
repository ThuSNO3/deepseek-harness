---
description: "面向 Host 自有界面的提供方中立语义 UI 自动化服务。"
kind: "package-reference"
---

# @deepseek-ai/dsh-ui-automation

[English](README.md) | 中文

## 概述

此 Service Definition 拥有 ctx.uiAutomation。Host Provider 为确切调用 Agent 返回一份稳定语义观察租约的分页结果，并执行有界 action、wait 与 describe。服务不包含浏览器、桌面、widget、传输、审批、隐私或模型工具策略。

## 目录

- [服务约定](#service-contract)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="service-contract"></a>
## 服务约定

空 snapshot cursor 开始一份 Provider 自有观察租约；非空 cursor 消耗该租约的一次 continuation。每页共享一个不透明 snapshot id 与 surface revision。一次 action 会消耗租约且只返回 admission；accepted action 后必须 wait 或获取新 snapshot，才能执行下一次 action。Fill value 区分模型可见 literal text 与不透明 Host-held one-shot slot。

Provider 每次调用都接收确切 Agent 与 AbortSignal。Ref、cursor 有效性、input policy、Host approval、实际输入投递和取消结算均由 Provider 负责。即使 Provider 返回字符数或 digest，Consumer 也会对 Host-slot action 强制置 null。参见[子系统参考](../../../docs/subsystems/ui-automation.zh.md)。

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

- Service Definition 携带 AbortSignal 取消，但不定义跨进程 cancel message；transport 必须结算该 signal 并达到 quiescence。
- 产品 locator、approval summary、clinical terminal condition 和 Host-slot issuance 属于产品能力，而不是通用 UI 方法。
