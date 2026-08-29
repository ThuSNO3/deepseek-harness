---
description: "Provider-neutral semantic UI automation service for host-owned surfaces."
kind: "package-reference"
---

# @deepseek-ai/dsh-ui-automation

English | [中文](README.zh.md)

## Summary

This Service Definition owns `ctx.uiAutomation`. A host provider returns semantic snapshots and delivers bounded actions, waits, and descriptions for the exact calling Agent. The service contains no browser, desktop, widget, transport, approval, privacy, or model-tool policy.

## Table of Contents

- [Service contract](#service-contract)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

## Service contract

Providers receive the exact Agent and AbortSignal for every call. Snapshot refs and revisions are provider-owned opaque values. Consumers must observe the next state through wait or another snapshot. See the [subsystem reference](../../../docs/subsystems/ui-automation.md).

<a id="dev-note"></a>
### Dev Note

None.

## Model Experience

Indirectly, through Consumer packages that own tool schemas and render provider results.

#### KV Cache effect

No direct invalidation; each Consumer owns the model-visible schema and retained results.

## Known Limitations and Deferred Work

- The v1 vocabulary has one bounded snapshot and no pagination or explicit cross-transport cancel operation.
