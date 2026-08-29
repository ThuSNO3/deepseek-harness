# UI 自动化

[English](ui-automation.md) | 中文

[dsh-ui-automation 包](../../packages/interaction/ui-automation/README.zh.md)定义提供方中立的语义 Host UI 观察与有界 action 服务。产品 Provider 拥有目标身份、安全、审批、传输和实际输入投递；[工具 Consumer](../../packages/interaction/tool-ui-automation/README.zh.md)拥有模型 schema 与顺序约束。

源码：[packages/interaction/ui-automation/src/index.ts](../../packages/interaction/ui-automation/src/index.ts)

## 语义 UI 数据

快照只公开 Provider 签发的 ref、语义状态和 Provider 批准的标量值。每个 action、wait 和 describe 请求都带调用方签发的身份；action 结果报告一个终态。Ref 仅在所属快照 revision 下有效。

源码：[`packages/interaction/ui-automation/src/types.ts`](../../packages/interaction/ui-automation/src/types.ts)

```ts type-equiv
/** Provider-minted target reference valid only under its snapshot revision. */
type UiRef = Branded<'UiRef'>
```

```ts type-equiv
/** Caller-issued identity used to pair one request with its outcome. */
type UiRequestId = Branded<'UiRequestId'>
```

```ts type-equiv
/** Bounded JSON scalar a provider has approved for semantic projection. */
type UiValue = string | number | boolean | null
```

```ts type-equiv
/** One provider-approved node in a semantic UI snapshot. */
interface UiNode {
  readonly ref: UiRef
  readonly semanticId: string
  readonly role: string
  readonly labelCode: string
  readonly visible: boolean
  readonly enabled: boolean
  readonly checked: boolean | null
  readonly selected: boolean
  readonly expanded: boolean | null
  readonly actions: readonly string[]
  readonly risk: string
  readonly parentRef: UiRef | null
  readonly childRefs: readonly UiRef[]
  readonly value: UiValue
  readonly unit: string | null
  readonly stateCode: string | null
  readonly reliabilityCode: string | null
}
```

```ts type-equiv
/** Complete bounded observation of one active host-owned UI surface. */
interface UiSnapshot {
  readonly revision: number
  readonly windowId: string
  readonly modalDepth: number
  readonly focusRef: UiRef | null
  readonly busy: boolean
  readonly nodes: readonly UiNode[]
  readonly truncated: boolean
}
```

```ts type-equiv
/** Request to observe the current surface for the exact calling Agent. */
interface UiSnapshotRequest { readonly requestId: UiRequestId }
```

```ts type-equiv
/** User-equivalent operation supported by the v1 Consumer vocabulary. */
type UiAction = 'click' | 'select_item' | 'set_checked' | 'fill' | 'select_option' | 'set_value' | 'press'
```

```ts type-equiv
/** One bounded action against a ref from an exact snapshot revision. */
interface UiActionRequest {
  readonly requestId: UiRequestId
  readonly revision: number
  readonly ref: UiRef
  readonly action: UiAction
  readonly value?: string | number | boolean
  readonly key?: string
}
```

```ts type-equiv
/** Terminal provider outcome for one action, wait, or description request. */
interface UiActionResult {
  readonly requestId: UiRequestId
  readonly resultKind: 'completed' | 'denied' | 'cancelled' | 'timeout'
  readonly consumedRevision: number
  readonly detailCode: string
}
```

```ts type-equiv
/** Bounded semantic wait tied to the action that consumed a snapshot. */
interface UiWaitRequest {
  readonly requestId: UiRequestId
  readonly condition: 'revision_changed' | 'modal_visible' | 'semantic_visible'
  readonly timeoutMs: number
  readonly afterRevision: number
  readonly actionRequestId: UiRequestId
  readonly semanticId?: string
  readonly expected?: UiValue
}
```

```ts type-equiv
/** Read-only metadata request for a target in an exact snapshot revision. */
interface UiDescribeRequest {
  readonly requestId: UiRequestId
  readonly revision: number
  readonly ref: UiRef
}
```

```ts type-equiv
/** Provider-approved safe metadata for one target ref. */
interface UiRefDescription extends UiActionResult {
  readonly semanticId: string
  readonly role: string
  readonly visible: boolean
  readonly enabled: boolean
  readonly actions: readonly string[]
  readonly risk: string
  readonly stateCode: string | null
  readonly reliabilityCode: string | null
}
```

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
