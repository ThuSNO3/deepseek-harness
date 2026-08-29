# UI 自动化

[English](ui-automation.md) | 中文

[dsh-ui-automation 包](../../packages/interaction/ui-automation/README.zh.md)定义提供方中立的语义 Host UI 观察与有界 action 服务。产品 Provider 拥有目标身份、安全、审批、传输和实际输入投递；[工具 Consumer](../../packages/interaction/tool-ui-automation/README.zh.md)拥有模型 schema 与顺序约束。

源码：[packages/interaction/ui-automation/src/index.ts](../../packages/interaction/ui-automation/src/index.ts)

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxuiautomation--uiautomationservice-abstract-seam"></a>

### `ctx.uiAutomation` — `UiAutomationService` (abstract seam)

Provider-neutral semantic UI automation service. Implementations own ref validity, host policy, delivery, and cancellation settlement.

```ts cordis-catalog
/**
 * Observe the calling Agent's current host UI surface.
 * @param request - Caller-issued request identity.
 * @param context - Exact Agent subject and cooperative cancellation signal.
 * @returns A bounded semantic snapshot whose refs are provider-owned.
 */
abstract snapshot(request: UiSnapshotRequest, context: UiAutomationCallContext): Promise<UiSnapshot>

/**
 * Deliver one bounded action against a ref from a prior snapshot.
 * @param request - Action, target ref, and snapshot revision.
 * @param context - Exact Agent subject and cooperative cancellation signal.
 * @returns The provider's terminal dispatch outcome; callers observe UI effects separately.
 */
abstract act(request: UiActionRequest, context: UiAutomationCallContext): Promise<UiActionResult>

/**
 * Wait for one semantic condition after an action.
 * @param request - Condition, action identity, prior revision, and timeout.
 * @param context - Exact Agent subject and cooperative cancellation signal.
 * @returns A completed, timed-out, denied, or cancelled outcome.
 */
abstract wait(request: UiWaitRequest, context: UiAutomationCallContext): Promise<UiActionResult>

/**
 * Read safe metadata for one ref without delivering input.
 * @param request - Target ref and snapshot revision.
 * @param context - Exact Agent subject and cooperative cancellation signal.
 * @returns Provider-approved semantic metadata for the target.
 */
abstract describe(request: UiDescribeRequest, context: UiAutomationCallContext): Promise<UiRefDescription>
```

Source: [`packages/interaction/ui-automation/src/index.ts`](../../packages/interaction/ui-automation/src/index.ts)
<!-- END GENERATED cordis-surface -->
