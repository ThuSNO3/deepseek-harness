/** Wire-safe semantic UI automation vocabulary. @module @deepseek-ai/dsh-ui-automation/types */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Provider-minted target reference valid only under its snapshot revision. */
export type UiRef = Branded<'UiRef'>
/** Caller-issued identity used to pair one request with its outcome. */
export type UiRequestId = Branded<'UiRequestId'>
/** Bounded JSON scalar a provider has approved for semantic projection. */
export type UiValue = string | number | boolean | null

/** One provider-approved node in a semantic UI snapshot. */
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
  readonly actions: readonly string[]
  readonly risk: string
  readonly parentRef: UiRef | null
  readonly childRefs: readonly UiRef[]
  readonly value: UiValue
  readonly unit: string | null
  readonly stateCode: string | null
  readonly reliabilityCode: string | null
}

/** Complete bounded observation of one active host-owned UI surface. */
export interface UiSnapshot {
  readonly revision: number
  readonly windowId: string
  readonly modalDepth: number
  readonly focusRef: UiRef | null
  readonly busy: boolean
  readonly nodes: readonly UiNode[]
  readonly truncated: boolean
}

/** Request to observe the current surface for the exact calling Agent. */
export interface UiSnapshotRequest { readonly requestId: UiRequestId }
/** User-equivalent operation supported by the v1 Consumer vocabulary. */
export type UiAction = 'click' | 'select_item' | 'set_checked' | 'fill' | 'select_option' | 'set_value' | 'press'

/** One bounded action against a ref from an exact snapshot revision. */
export interface UiActionRequest {
  readonly requestId: UiRequestId
  readonly revision: number
  readonly ref: UiRef
  readonly action: UiAction
  readonly value?: string | number | boolean
  readonly key?: string
}

/** Terminal provider outcome for one action, wait, or description request. */
export interface UiActionResult {
  readonly requestId: UiRequestId
  readonly resultKind: 'completed' | 'denied' | 'cancelled' | 'timeout'
  readonly consumedRevision: number
  readonly detailCode: string
}

/** Bounded semantic wait tied to the action that consumed a snapshot. */
export interface UiWaitRequest {
  readonly requestId: UiRequestId
  readonly condition: 'revision_changed' | 'modal_visible' | 'semantic_visible'
  readonly timeoutMs: number
  readonly afterRevision: number
  readonly actionRequestId: UiRequestId
  readonly semanticId?: string
  readonly expected?: UiValue
}

/** Read-only metadata request for a target in an exact snapshot revision. */
export interface UiDescribeRequest {
  readonly requestId: UiRequestId
  readonly revision: number
  readonly ref: UiRef
}

/** Provider-approved safe metadata for one target ref. */
export interface UiRefDescription extends UiActionResult {
  readonly semanticId: string
  readonly role: string
  readonly visible: boolean
  readonly enabled: boolean
  readonly actions: readonly string[]
  readonly risk: string
  readonly stateCode: string | null
  readonly reliabilityCode: string | null
}
