/**
 * Service Definition for semantic UI automation on ctx.uiAutomation. Providers observe one
 * host-owned UI surface and deliver bounded user-equivalent actions; model-facing schemas and
 * scheduling belong to Consumer packages.
 * @module @deepseek-ai/dsh-ui-automation
 */

import { Context, Service } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {
  UiActionRequest, UiActionResult, UiDescribeRequest, UiRefDescription,
  UiSnapshot, UiSnapshotRequest, UiWaitRequest,
} from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context { uiAutomation: UiAutomationService }
}

export type {
  UiAction, UiActionRequest, UiActionResult, UiDescribeRequest, UiNode, UiRef,
  UiRefDescription, UiRequestId, UiSnapshot, UiSnapshotRequest, UiValue, UiWaitRequest,
} from './types.ts'

/** Trusted execution context supplied by the model-facing or programmatic Consumer. */
export interface UiAutomationCallContext {
  readonly agent: Agent
  readonly signal: AbortSignal
}

/**
 * Provider-neutral semantic UI automation service. Implementations own ref
 * validity, host policy, delivery, and cancellation settlement.
 */
export abstract class UiAutomationService extends Service {
  constructor(ctx: Context) { super(ctx, 'uiAutomation') }

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
}

export default UiAutomationService
