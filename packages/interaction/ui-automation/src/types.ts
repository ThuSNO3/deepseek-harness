/** Wire-safe semantic UI automation types. @module @deepseek-ai/dsh-ui-automation/types */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Provider-minted target reference valid only under its observation lease. */
export type UiRef = Branded<'UiRef'>
/** Caller-issued identity used to pair one request with its outcome. */
export type UiRequestId = Branded<'UiRequestId'>
/** Provider-minted identity shared by every page in one observation lease. */
export type UiSnapshotId = Branded<'UiSnapshotId'>
/** Provider-minted continuation token consumed by the next snapshot-page request. */
export type UiCursor = Branded<'UiCursor'>
/** Opaque Host-minted reference to one input value the Provider may consume once. */
export type UiHostSlotRef = Branded<'UiHostSlotRef'>
/** Bounded JSON scalar a Provider has approved for semantic projection. */
export type UiValue = string | number | boolean | null

/** Model-supplied text whose admissibility remains a Provider policy decision. */
export interface UiLiteralInput { readonly kind: 'literal'; readonly text: string }
/** Opaque reference to a Host-held input value that does not enter model context. */
export interface UiHostSlotInput { readonly kind: 'host_slot'; readonly slotRef: UiHostSlotRef }
/** Text input is either model-visible literal text or a Host-held opaque slot. */
export type UiInputValue = UiLiteralInput | UiHostSlotInput

/** User-equivalent operations supported by the semantic UI Consumer. */
export type UiAction =
  | 'click' | 'select_item' | 'set_checked' | 'fill' | 'select_option'
  | 'set_value' | 'press' | 'activate_tab'
/** Bounded navigation key accepted by the semantic key operation. */
export type UiKey = 'enter' | 'escape' | 'tab' | 'up' | 'down' | 'left' | 'right'

/** One Provider-approved node in a semantic UI observation. */
export interface UiNode {
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

/** Request for one page of the exact calling Agent's current Host UI. */
export interface UiSnapshotRequest {
  readonly requestId: UiRequestId
  readonly cursor: UiCursor | null
  readonly pageSize: number
}

/** One page from a stable Provider-owned semantic observation lease. */
export interface UiSnapshotPage {
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

/** One bounded action against a ref from an exact observation lease. */
export interface UiActionRequest {
  readonly actionRequestId: UiRequestId
  readonly snapshotId: UiSnapshotId
  readonly surfaceRevision: number
  readonly ref: UiRef
  readonly action: UiAction
  readonly value?: UiInputValue | number | boolean
  readonly key?: UiKey
}

/** Provider admission result; accepted actions must be observed separately. */
export interface UiActionReceipt {
  readonly actionRequestId: UiRequestId
  readonly resultKind: 'accepted' | 'denied' | 'rejected' | 'cancelled'
  readonly consumedRevision: number
  readonly detailCode: string
  /** Character count for an admitted literal, or null for Host slots and actions without text. */
  readonly valueCharacterCount: number | null
  /** Digest for an admitted literal, or null for Host slots and actions without text. */
  readonly valueDigest: string | null
}

/** Bounded semantic wait tied to the action that consumed an observation. */
export interface UiWaitRequest {
  readonly requestId: UiRequestId
  readonly actionRequestId: UiRequestId
  readonly afterRevision: number
  readonly condition: string
  readonly timeoutMs: number
  readonly semanticId: string | null
  readonly expected: UiValue
}

/** Terminal result of one semantic wait. */
export interface UiWaitResult {
  readonly requestId: UiRequestId
  readonly resultKind: 'completed' | 'rejected' | 'cancelled' | 'timeout'
  readonly consumedRevision: number
  readonly detailCode: string
}

/** Read-only metadata request for one ref in an exact observation lease. */
export interface UiDescribeRequest {
  readonly actionRequestId: UiRequestId
  readonly snapshotId: UiSnapshotId
  readonly surfaceRevision: number
  readonly ref: UiRef
}

/** Provider-approved safe metadata for one target ref. */
export interface UiRefDescription {
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
