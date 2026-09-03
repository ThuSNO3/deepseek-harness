# Agent Note: Narrow the Python SDK JSON-RPC direction

Status: proposed

English | [中文](2026-09-03-narrow-python-sdk-jsonrpc-direction.zh.md)

## Problem

The Python `HarnessClient` is a client of the shipped SDK server: it sends requests and receives responses or notifications. It nevertheless exposes the reverse peer direction through `notify()`, `next_request()`, `respond()`, `respond_error()`, the public `IncomingRequest` type, an inbound-request queue, and a close-time sentinel for that queue. Exact production searches find no caller; only `python/sdk/tests/test_client.py` constructs a fake server request and exercises the response helpers. No member of the typed SDK request or notification maps requires a client-originated notification or server-originated request.

The broader [Make JSON-RPC completion and transport directional](../../rejected/simplification/2026-07-19-make-jsonrpc-directional.md) proposal is not implementable as written. The shipped server now returns `{ messageId }` immediately and publishes interval-wide `session.status`; it does not emit the proposal's `session.finished`, and the [owned-run decision](../../implemented/architecture/2026-07-30-followup-enqueue-and-owned-runs.md) deliberately avoids attributing one whole-agent idle outcome to one prompt. The shared TypeScript peer also has a real bidirectional consumer in the Codex app-server adapter, which sends requests and notifications and handles both from the child. These later contracts invalidate the broad transport and settlement changes while leaving the Python-only dead direction intact.

## Proposal

Specialize `python/sdk/src/deepseek_harness/client.py` to the direction the public SDK server uses. Remove `HarnessClient.notify()`, `next_request()`, `respond()`, and `respond_error()`; remove `IncomingRequest` from `models.py`, package exports, tests, and documentation; remove `_requests` and its teardown publication. The reader keeps routing response ids to request waiters and notifications to the existing subscriber machinery.

Treat an inbound JSON-RPC object carrying both `id` and `method` as an unsupported server request. It must not enter a response waiter or block teardown. Choose one explicit behavior during implementation—ignore it with a bounded diagnostic, or fail the transport with `SdkProtocolError`—and pin that behavior through the fake runtime; do not retain a public queue for a frame no typed operation can produce. Malformed frames keep their existing classification.

Keep `session_prompt()` returning the queued message id, keep interval ownership and `session.status` settlement in `Session.run()`, and keep the shared TypeScript transport and Codex protocol direction unchanged. If a future SDK feature needs server-originated interaction, add a typed operation with ownership, cancellation, concurrency, and settlement semantics before adding the reverse direction back.

## Alternatives considered

**Implement the older broad directional proposal.** Rejected because it would delete bidirectional TypeScript capability used by the Codex child and replace prompt enqueue/interval semantics that later architecture explicitly owns. A stale proposal is not authority for removing current production behavior.

**Keep a generic symmetric Python peer for custom runtimes.** The Python SDK launches or connects to the DeepSeek Harness SDK protocol, not an arbitrary JSON-RPC application. Generic reverse methods expand the public API and teardown state without a typed server operation or repository consumer. A custom runtime can implement its own peer, and a future product request can add the exact direction it needs.

**Make the reverse methods private test helpers.** Rejected because the fake server can write frames directly and inspect client output. Private production machinery would retain the same queue and shutdown branch solely for a test of unsupported behavior.

## Acceptance criteria

- The public Python package exports no `IncomingRequest`, notification sender, inbound-request waiter, or response helper.
- `HarnessClient` retains no inbound-request queue or close-time sentinel; unexpected request frames have an explicit non-blocking behavior.
- Outbound request correlation, inbound notifications, subscription filtering, session-tree discovery, runtime diagnostics, and close-to-quiescence retain their behavior.
- `session_prompt()` still returns `messageId`, and `Session.run()` still owns settlement through the next root-agent idle interval and durable `turn/end` evidence.
- The TypeScript SDK transport and Codex app-server transport retain their current directions.
- Python unit tests, packaged-runtime smoke, both SDK projections, documentation, and repository checks pass.

## Risks

Pre-release callers using `HarnessClient` as a generic JSON-RPC server peer must replace those calls. Choosing fail-transport for an unexpected request is stricter than silently ignoring it; choosing ignore may hide a version mismatch. Either behavior is safer than indefinitely queuing a request no supported caller can answer, but implementation must document and test the selected failure mode.
