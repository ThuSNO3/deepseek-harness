# UI 自动化

[English](ui-automation.md) | 中文

[dsh-ui-automation 包](../../packages/interaction/ui-automation/README.zh.md)定义语义化 Host UI 观察与有界动作。产品 Provider 负责目标身份、安全、审批、传输、输入投递和条件语义。[工具 Consumer](../../packages/interaction/tool-ui-automation/README.zh.md)负责模型 schema 与调用顺序。

来源：[packages/interaction/ui-automation/src/index.ts](../../packages/interaction/ui-automation/src/index.ts)

## 语义 UI 数据

空 cursor 开始一份观察租约；Provider 签发的 cursor 延续该租约。每页共享同一个 snapshot id 与 surface revision。Ref 保持不透明，且只在该租约内有效。动作回执只报告 admission，wait 才报告随后观察到的条件。填入值区分模型可见的 literal text 与不透明 Host slot。

来源：[types.ts](../../packages/interaction/ui-automation/src/types.ts)

~~~ts type-equiv
/** Provider-minted target reference valid only under its observation lease. */
type UiRef = Branded<'UiRef'>
~~~

~~~ts type-equiv
/** Caller-issued identity used to pair one request with its outcome. */
type UiRequestId = Branded<'UiRequestId'>
~~~

~~~ts type-equiv
/** Provider-minted identity shared by every page in one observation lease. */
type UiSnapshotId = Branded<'UiSnapshotId'>
~~~

~~~ts type-equiv
/** Provider-minted continuation token consumed by the next snapshot-page request. */
type UiCursor = Branded<'UiCursor'>
~~~

~~~ts type-equiv
/** Opaque Host-minted reference to one input value the Provider may consume once. */
type UiHostSlotRef = Branded<'UiHostSlotRef'>
~~~

~~~ts type-equiv
/** Bounded JSON scalar a Provider has approved for semantic projection. */
type UiValue = string | number | boolean | null
~~~

~~~ts type-equiv
/** Model-supplied text whose admissibility remains a Provider policy decision. */
interface UiLiteralInput { readonly kind: 'literal'; readonly text: string }
~~~

~~~ts type-equiv
/** Opaque reference to a Host-held input value that does not enter model context. */
interface UiHostSlotInput { readonly kind: 'host_slot'; readonly slotRef: UiHostSlotRef }
~~~

~~~ts type-equiv
/** Text input is either model-visible literal text or a Host-held opaque slot. */
type UiInputValue = UiLiteralInput | UiHostSlotInput
~~~

~~~ts type-equiv
/** User-equivalent operations supported by the semantic UI Consumer. */
type UiAction =
  | 'click' | 'select_item' | 'set_checked' | 'fill' | 'select_option'
  | 'set_value' | 'press' | 'activate_tab'
~~~

~~~ts type-equiv
/** Bounded navigation key accepted by the semantic key operation. */
type UiKey = 'enter' | 'escape' | 'tab' | 'up' | 'down' | 'left' | 'right'
~~~

~~~ts type-equiv
/** One Provider-approved node in a semantic UI observation. */
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
  readonly actions: readonly UiAction[]
  readonly risk: string
  readonly parentRef: UiRef | null
  readonly childRefs: readonly UiRef[]
  readonly value: UiValue
  readonly unit: string | null
  readonly stateCode: string | null
  readonly reliabilityCode: string | null
  readonly valueKind: string
  readonly literalAllowed: boolean
  readonly maxLength: number
}
~~~

~~~ts type-equiv
/** Request for one page of the exact calling Agent's current Host UI. */
interface UiSnapshotRequest {
  readonly requestId: UiRequestId
  readonly cursor: UiCursor | null
  readonly pageSize: number
}
~~~

~~~ts type-equiv
/** One page from a stable Provider-owned semantic observation lease. */
interface UiSnapshotPage {
  readonly snapshotId: UiSnapshotId
  readonly surfaceRevision: number
  readonly windowStack: readonly string[]
  readonly focusRef: UiRef | null
  readonly busy: boolean
  readonly modalDepth: number
  readonly nodes: readonly UiNode[]
  readonly nextCursor: UiCursor | null
  readonly complete: boolean
}
~~~

~~~ts type-equiv
/** One bounded action against a ref from an exact observation lease. */
interface UiActionRequest {
  readonly actionRequestId: UiRequestId
  readonly snapshotId: UiSnapshotId
  readonly surfaceRevision: number
  readonly ref: UiRef
  readonly action: UiAction
  readonly value?: UiInputValue | number | boolean
  readonly key?: UiKey
}
~~~

~~~ts type-equiv
/** Provider admission result; accepted actions must be observed separately. */
interface UiActionReceipt {
  readonly actionRequestId: UiRequestId
  readonly resultKind: 'accepted' | 'denied' | 'rejected' | 'cancelled'
  readonly consumedRevision: number
  readonly detailCode: string
  /** Character count for an admitted literal, or null for Host slots and actions without text. */
  readonly valueCharacterCount: number | null
  /** Digest for an admitted literal, or null for Host slots and actions without text. */
  readonly valueDigest: string | null
}
~~~

~~~ts type-equiv
/** Bounded semantic wait tied to the action that consumed an observation. */
interface UiWaitRequest {
  readonly requestId: UiRequestId
  readonly actionRequestId: UiRequestId
  readonly afterRevision: number
  readonly condition: string
  readonly timeoutMs: number
  readonly semanticId: string | null
  readonly expected: UiValue
}
~~~

~~~ts type-equiv
/** Terminal result of one semantic wait. */
interface UiWaitResult {
  readonly requestId: UiRequestId
  readonly resultKind: 'completed' | 'rejected' | 'cancelled' | 'timeout'
  readonly consumedRevision: number
  readonly detailCode: string
}
~~~

~~~ts type-equiv
/** Read-only metadata request for one ref in an exact observation lease. */
interface UiDescribeRequest {
  readonly actionRequestId: UiRequestId
  readonly snapshotId: UiSnapshotId
  readonly surfaceRevision: number
  readonly ref: UiRef
}
~~~

~~~ts type-equiv
/** Provider-approved safe metadata for one target ref. */
interface UiRefDescription {
  readonly actionRequestId: UiRequestId
  readonly resultKind: 'completed' | 'rejected' | 'cancelled'
  readonly consumedRevision: number
  readonly detailCode: string
  readonly semanticId: string
  readonly role: string
  readonly visible: boolean
  readonly enabled: boolean
  readonly actions: readonly UiAction[]
  readonly risk: string
  readonly stateCode: string | null
  readonly reliabilityCode: string | null
}
~~~

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxuiautomation--uiautomationservice-abstract-seam"></a>

### `ctx.uiAutomation` — `UiAutomationService` (abstract seam)

Provider-neutral semantic UI automation service.

```ts cordis-catalog
/**
 * Observe one page of the calling Agent's current Host UI. A null cursor starts
 * a new lease; a non-null cursor consumes one Provider-minted continuation.
 * @param request - Request identity, continuation, and page bound.
 * @param context - Exact Agent and cooperative cancellation signal.
 * @returns One stable page with opaque refs and an optional next cursor.
 */
abstract snapshot(request: UiSnapshotRequest, context: UiAutomationCallContext): Promise<UiSnapshotPage>

/**
 * Admit one user-equivalent action against an exact observation lease.
 * @param request - Action identity, lease, target ref, and bounded input.
 * @param context - Exact Agent and cooperative cancellation signal.
 * @returns Admission only; Consumers observe effects through wait or a new snapshot.
 */
abstract act(request: UiActionRequest, context: UiAutomationCallContext): Promise<UiActionReceipt>

/**
 * Wait for one semantic condition after an accepted action.
 * @param request - Condition, accepted-action identity, revision, and time bound.
 * @param context - Exact Agent and cooperative cancellation signal.
 * @returns The Provider's completed, rejected, cancelled, or timed-out result.
 */
abstract wait(request: UiWaitRequest, context: UiAutomationCallContext): Promise<UiWaitResult>

/**
 * Consume an observation lease to read safe metadata without delivering input.
 * @param request - Target ref and exact observation lease.
 * @param context - Exact Agent and cooperative cancellation signal.
 * @returns Provider-approved target metadata.
 */
abstract describe(request: UiDescribeRequest, context: UiAutomationCallContext): Promise<UiRefDescription>
```

Source: [`packages/interaction/ui-automation/src/index.ts`](../../packages/interaction/ui-automation/src/index.ts)
<!-- END GENERATED cordis-surface -->
