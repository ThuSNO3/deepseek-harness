# Agent Note: Semantic UI automation capability

Status: implemented

English | [中文](2026-08-29-semantic-ui-automation-capability.zh.md)

## Problem

A product-hosted agent may need to operate the product interface through the same visible controls as a user. Defining those tools inside one product runtime couples model schemas, action sequencing, host transport, widget identity, approval, and privacy policy. Other hosts cannot reuse the capability, and the harness cannot test the tool discipline without loading product code.

## Decision

The `dsh-ui-automation` Service Definition owns `ctx.uiAutomation`: semantic snapshots plus bounded action, wait, and description calls. Every operation carries the exact Agent and AbortSignal. Product Providers own target identity, safety, approval, transport, and actual input delivery.

The separate `dsh-tool-ui-automation` Consumer registers the v1 tool vocabulary and keeps a plugin-local WeakMap keyed by exact Agent. One Agent observes a snapshot, performs at most one action, then waits or observes again. The Consumer projects only declared DTO fields into closed tool-result schemas and contributes no UI implementation or permission decision. Cordis effect disposal removes all tool registrations; the plugin-local state becomes unreachable with the disposed plugin.

Checkbox changes carry an explicit boolean target through `set_checked`. The Provider makes an already satisfied state a no-op, so retries do not inherit toggle semantics and cannot reverse a prior successful selection.

The interface keeps Agent and cancellation explicit. UI automation crosses a product and often a process boundary, so ambient initiator state cannot carry either value to a Provider. Snapshot refs remain opaque provider-owned values; the harness does not interpret a widget tree, browser selector, coordinate, or product identity.

## Alternatives considered

**Keep product-specific tools.** This avoids two packages but leaves tool scheduling and host transport inseparable, duplicates the same state machine in every host, and prevents provider-neutral contract tests.

**Put model tools on the Service Definition.** Tool schemas and retained results are Consumer behavior. Combining them would force every provider to ship one model vocabulary and make non-model callers depend on the tool runtime.

**Derive Agent from ambient initiator state.** A remote or callback Provider must serialize identity explicitly, and subjectless tool calls must fail rather than inherit unrelated ambient work. The tool execution already owns the exact Agent and AbortSignal.

**Include approvals and privacy policy in the seam.** Those rules depend on the host target and data. The Provider enforces them where the actual action is delivered; the generic interface cannot safely classify an unknown product control.

## Consequences

Products can supply semantic UI automation without importing model-tool code, and Consumers can enforce one-action observation discipline without importing widget or transport libraries. The explicit Agent and AbortSignal make concurrent sessions and cancellation routable across a Provider boundary.

The v1 DTO mirrors the current bounded snapshot vocabulary and does not provide pagination, typed host slots, or an explicit cross-transport cancel request. Those additions require a versioned contract rather than hidden behavior in one Provider. The capability does not make arbitrary desktop, browser, coordinate, or clinical-service control part of the harness.
