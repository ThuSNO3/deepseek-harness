---
description: "Provider-neutral semantic UI automation service for Host-owned interfaces."
kind: "package-reference"
---

# @deepseek-ai/dsh-ui-automation

English | [中文](README.zh.md)

## Summary

This Service Definition owns ctx.uiAutomation. A Host Provider returns pages from one stable semantic observation lease and delivers bounded actions, waits, and descriptions for the exact calling Agent. The service contains no browser, desktop, widget, transport, approval, privacy, or model-tool policy.

## Table of Contents

- [Service contract](#service-contract)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

## Service contract

A null snapshot cursor starts a Provider-owned observation lease; a non-null cursor consumes one continuation from that lease. Every page shares one opaque snapshot id and surface revision. One action consumes the lease and returns only admission; an accepted action must be followed by a wait or a new snapshot before another action. Fill values distinguish model-visible literal text from opaque Host-held one-shot slots.

Providers receive the exact Agent and AbortSignal for every call. Refs, cursor validity, input policy, Host approval, actual input delivery, and cancellation settlement remain Provider responsibilities. The Consumer forces character counts and digests to null for Host-slot actions even if a Provider returns them. See the [subsystem reference](../../../docs/subsystems/ui-automation.md).

<a id="dev-note"></a>
### Dev Note

None.

## Model Experience

Indirectly, through Consumer packages that own tool schemas and render Provider results.

#### KV Cache effect

No direct invalidation; each Consumer owns the model-visible schema and retained results.

## Known Limitations and Deferred Work

- The Service Definition carries AbortSignal cancellation but defines no cross-process cancel message; transports must settle that signal and reach quiescence.
- Product locators, approval summaries, clinical terminal conditions, and Host-slot issuance remain product capabilities rather than generic UI methods.
