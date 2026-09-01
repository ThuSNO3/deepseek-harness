/**
 * Service Definition for semantic UI automation on `ctx.uiAutomation`. Providers observe one
 * Host-owned UI and deliver bounded user-equivalent actions; model-facing schemas and
 * sequencing belong to Consumer packages.
 * @module @deepseek-ai/dsh-ui-automation
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { brandString } from '@deepseek-ai/dsh-brand'
import type {
  UiActionReceipt, UiActionRequest, UiDescribeRequest, UiRefDescription,
  UiSnapshotPage, UiSnapshotRequest, UiWaitRequest, UiWaitResult,
} from './types.ts'

/**
 * Brand a Provider-admitted target reference.
 * @param value - Target reference admitted by the Provider.
 * @returns The same string as a UI target reference.
 */
export const uiRef = (value: string): import('./types.ts').UiRef =>
  brandString<import('./types.ts').UiRef>(value)
/**
 * Brand a caller-issued request identity.
 * @param value - Request identity issued by the caller.
 * @returns The same string as a UI request identity.
 */
export const uiRequestId = (value: string): import('./types.ts').UiRequestId =>
  brandString<import('./types.ts').UiRequestId>(value)
/**
 * Brand a Provider-issued observation identity.
 * @param value - Observation identity issued by the Provider.
 * @returns The same string as a UI observation identity.
 */
export const uiSnapshotId = (value: string): import('./types.ts').UiSnapshotId =>
  brandString<import('./types.ts').UiSnapshotId>(value)
/**
 * Brand a Provider-issued pagination cursor.
 * @param value - Continuation cursor issued by the Provider.
 * @returns The same string as a UI pagination cursor.
 */
export const uiCursor = (value: string): import('./types.ts').UiCursor =>
  brandString<import('./types.ts').UiCursor>(value)
/**
 * Brand a Host-issued opaque input slot reference.
 * @param value - Opaque input reference issued by the Host.
 * @returns The same string as a Host input slot reference.
 */
export const uiHostSlotRef = (value: string): import('./types.ts').UiHostSlotRef =>
  brandString<import('./types.ts').UiHostSlotRef>(value)

declare module '@deepseek-ai/cordis' { interface Context { uiAutomation: UiAutomationService } }

export type {
  UiAction, UiActionReceipt, UiActionRequest, UiCursor, UiDescribeRequest,
  UiHostSlotInput, UiHostSlotRef, UiInputValue, UiKey, UiLiteralInput, UiNode,
  UiRef, UiRefDescription, UiRequestId, UiSnapshotId, UiSnapshotPage,
  UiSnapshotRequest, UiValue, UiWaitRequest, UiWaitResult,
} from './types.ts'

/** Trusted execution identity supplied by a model-facing or programmatic Consumer. */
export interface UiAutomationCallContext { readonly agent: Agent; readonly signal: AbortSignal }

/** Provider-neutral semantic UI automation service. */
export abstract class UiAutomationService extends Service {
  constructor(ctx: Context) { super(ctx, 'uiAutomation') }

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
}

export default UiAutomationService
