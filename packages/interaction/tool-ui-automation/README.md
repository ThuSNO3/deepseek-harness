---
description: "Ten model-facing semantic UI tools over ctx.uiAutomation."
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-ui-automation

English | [中文](README.zh.md)

## Summary

This Consumer registers ten typed UI tools over `ctx.uiAutomation`. Each Agent takes a snapshot, performs at most one action, then waits or takes a new snapshot. The exact Agent and tool AbortSignal reach the provider. Plugin disposal removes every tool and its plugin-local state.

## Table of Contents

- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

<a id="dev-note"></a>
### Dev Note

None.

## Model Experience

### Tool schema

#### What the model sees

The model sees the generated [ten UI tool schemas](../../../docs/tool-catalog.md#deepseek-aidsh-tool-ui-automation) for snapshot, click, select-item, set-checked, fill, select-option, set-value, press, wait, and describe-ref. `set-checked` requires an explicit boolean target state, so replaying the same request cannot reverse an already satisfied checkbox.

#### Token effect

Fixed schema cost on every request where the plugin is visible.

#### KV Cache effect

Prefix-stable while the definitions and visibility do not change.

### Tool history

#### What the model sees

Calls and provider JSON results are retained as ordinary `tool/call` and `tool/result` events.

#### Token effect

Snapshot contents and action values add data-dependent retained tokens.

#### KV Cache effect

Append-only; each call and result follows the reusable request prefix.

## Known Limitations and Deferred Work

- The Consumer preserves v1 sequencing; pagination, typed literal/host-slot values, and explicit cancel belong to a later version.
- Provider policy decides which controls exist, which values are safe, and which actions need approval.
