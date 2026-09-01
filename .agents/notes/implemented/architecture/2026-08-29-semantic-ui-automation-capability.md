# Agent Note: Semantic UI automation capability

Status: implemented

English | [中文](2026-08-29-semantic-ui-automation-capability.zh.md)

## Problem

A product-hosted agent may need to operate the product interface through the same visible controls as a user. Defining those tools inside one product runtime couples model schemas, action sequencing, Host transport, target identity, approval, and privacy policy. Other Hosts cannot reuse the capability, and the harness cannot test tool discipline without loading product code.

## Decision

The dsh-ui-automation Service Definition owns ctx.uiAutomation: paged semantic observations plus bounded action, wait, and description calls. Every operation carries the exact Agent and AbortSignal. Product Providers own target identity, safety, approval, transport, actual input delivery, and wait-condition semantics.

A null cursor starts a Provider-owned observation lease. Every page shares one opaque snapshot id and surface revision, while Provider-minted cursors continue the lease. An action consumes the observation and returns admission rather than claiming that the UI reached its requested state. Only an accepted action may be followed by a wait; otherwise the Agent must observe again.

The dsh-tool-ui-automation Consumer registers eleven versioned tools and keeps a plugin-local WeakMap keyed by exact Agent. It admits only one pending Provider operation per Agent, rejects a cursor whose Provider result changes snapshot identity, and publishes an accepted-action state only after the action Provider returns. Provider failure or caller cancellation discards the state. The Consumer projects only declared fields into closed tool-result schemas. Cordis effect disposal removes all tool registrations and makes the Agent-keyed state unreachable.

Fill input distinguishes model-visible literal text from an opaque Host slot. The Provider decides whether literal text is allowed and resolves a slot without exposing its value in tool arguments or results. Literal receipts may return only a character count and digest; the Consumer forces both fields to null for Host-slot actions. Checkbox changes carry an explicit boolean target through set_checked; the Provider makes an already satisfied state a no-op, so retry cannot reverse a prior successful selection.

The interface keeps Agent and cancellation explicit because UI automation often crosses a process boundary. Snapshot refs and cursors remain opaque Provider values; the harness does not interpret a widget tree, browser selector, coordinate, product identity, or clinical terminal state.

## Alternatives considered

**Keep product-specific tools.** This avoids two packages but leaves tool sequencing and Host transport inseparable, duplicates the state machine in every Host, and prevents Provider-neutral tests.

**Put model tools on the Service Definition.** Tool schemas and retained results are Consumer behavior. Combining them would force every Provider to ship one model vocabulary and make programmatic callers depend on the tool runtime.

**Derive Agent from ambient initiator state.** A remote Provider must serialize identity explicitly, and subjectless calls must fail rather than inherit unrelated work. Tool execution already owns the exact Agent and AbortSignal.

**Add product locators, approval, or clinical waits to the generic methods.** Those rules depend on Host data and authority. Product capabilities compose beside UI automation and return opaque refs or stable business outcomes without teaching the generic service about patients or workflows.

## Consequences

Products can provide semantic UI automation without importing model-tool code, while Consumers enforce pagination and one-action observation discipline without importing widget or transport libraries. Explicit Agent and AbortSignal values make concurrent sessions and cancellation routable across a Provider boundary.

Cross-process transports still need their own cancellation message and quiescence contract; passing an AbortSignal does not define a wire protocol. The capability does not add arbitrary desktop, browser, coordinate, or clinical-service control to the harness.
