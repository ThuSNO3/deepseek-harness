---
description: "Eleven model-facing semantic UI tools over ctx.uiAutomation."
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-ui-automation

English | [中文](README.zh.md)

## Summary

This Consumer registers eleven typed UI tools over ctx.uiAutomation. Each Agent acquires a paged observation, performs at most one action, then waits or observes again. The exact Agent and tool AbortSignal reach the Provider. Plugin disposal removes every tool and makes its Agent-keyed state unreachable.

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

The model sees the generated [eleven UI tool schemas](../../../docs/tool-catalog.md#deepseek-aidsh-tool-ui-automation): snapshot, click, select-item, set-checked, fill, select-option, set-value, press, activate-tab, wait, and describe-ref. Snapshot accepts Provider-minted pagination cursors. Fill accepts either literal text or an opaque Host slot. set-checked requires an explicit boolean state, so replaying the request cannot reverse an already satisfied checkbox.

#### Token effect

Fixed schema cost on every request where the plugin is visible.

#### KV Cache effect

Prefix-stable while the definitions and visibility do not change.

### Tool history

#### What the model sees

Calls and projected Provider results are retained as ordinary tool/call and tool/result events. A Host slot exposes only its opaque reference; the Host-held value does not enter tool arguments or results.

#### Token effect

Snapshot pages, literal action values, and results add data-dependent retained tokens.

#### KV Cache effect

Append-only; each call and result follows the reusable request prefix.

## Known Limitations and Deferred Work

- Wait conditions and error codes are Provider-owned strings because products observe different authoritative states.
- Provider policy decides which controls exist, which literal values are safe, which Host slots may be consumed, and which actions require approval.
