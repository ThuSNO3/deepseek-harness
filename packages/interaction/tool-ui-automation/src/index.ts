/** Model-facing Consumer of semantic UI automation. @module @deepseek-ai/dsh-tool-ui-automation */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ParameterSchemaSpec } from '@deepseek-ai/dsh-tools'
import type {
  UiAction, UiActionReceipt, UiActionRequest, UiAutomationCallContext, UiCursor,
  UiDescribeRequest, UiInputValue, UiKey, UiNode, UiRef, UiRefDescription,
  UiRequestId, UiSnapshotId, UiSnapshotPage, UiWaitResult,
} from '@deepseek-ai/dsh-ui-automation'

export const name = 'tool-ui-automation'
export const inject = ['tools', 'uiAutomation']

interface UiPendingState { readonly kind: 'pending' }
interface UiObservedState {
  readonly kind: 'observed'
  snapshotId: UiSnapshotId
  surfaceRevision: number
}
interface UiAcceptedState {
  readonly kind: 'accepted'
  surfaceRevision: number
  actionRequestId: UiRequestId
}
type UiTurnState = UiPendingState | UiObservedState | UiAcceptedState

const render = (_args: unknown, value: unknown) => [{ type: 'text' as const, text: JSON.stringify(value) }]
const nullableString = { oneOf: [{ type: 'string' }, { type: 'null' }] } as const
const nullableBoolean = { oneOf: [{ type: 'boolean' }, { type: 'null' }] } as const
const uiValueSchema = {
  oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }],
} as const
const uiInputSchema = {
  oneOf: [
    {
      type: 'object', additionalProperties: false,
      properties: {
        kind: { type: 'string', const: 'literal', required: true },
        text: { type: 'string', required: true },
      },
    },
    {
      type: 'object', additionalProperties: false,
      properties: {
        kind: { type: 'string', const: 'host_slot', required: true },
        slotRef: { type: 'string', required: true },
      },
    },
  ],
} as const
const actionBase = {
  actionRequestId: { type: 'string', required: true },
  snapshotId: { type: 'string', required: true },
  surfaceRevision: { type: 'integer', required: true },
  ref: { type: 'string', required: true },
} as const
const nodeSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    ref: { type: 'string', required: true },
    semanticId: { type: 'string', required: true },
    role: { type: 'string', required: true },
    labelCode: { type: 'string', required: true },
    visible: { type: 'boolean', required: true },
    enabled: { type: 'boolean', required: true },
    checked: { ...nullableBoolean, required: true },
    selected: { type: 'boolean', required: true },
    expanded: { ...nullableBoolean, required: true },
    actions: { type: 'array', items: { type: 'string' }, required: true },
    risk: { type: 'string', required: true },
    parentRef: { ...nullableString, required: true },
    childRefs: { type: 'array', items: { type: 'string' }, required: true },
    value: { ...uiValueSchema, required: true },
    unit: { ...nullableString, required: true },
    stateCode: { ...nullableString, required: true },
    reliabilityCode: { ...nullableString, required: true },
    valueKind: { type: 'string', required: true },
    literalAllowed: { type: 'boolean', required: true },
    maxLength: { type: 'integer', required: true },
  },
} as const
const snapshotSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    snapshotId: { type: 'string', required: true },
    surfaceRevision: { type: 'integer', required: true },
    windowStack: { type: 'array', items: { type: 'string' }, required: true },
    focusRef: { ...nullableString, required: true },
    busy: { type: 'boolean', required: true },
    modalDepth: { type: 'integer', required: true },
    nodes: { type: 'array', items: nodeSchema, required: true },
    nextCursor: { ...nullableString, required: true },
    complete: { type: 'boolean', required: true },
  },
} as const
const receiptSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    actionRequestId: { type: 'string', required: true },
    resultKind: {
      type: 'string', enum: ['accepted', 'denied', 'rejected', 'cancelled'], required: true,
    },
    consumedRevision: { type: 'integer', required: true },
    detailCode: { type: 'string', required: true },
    valueCharacterCount: { oneOf: [{ type: 'integer' }, { type: 'null' }], required: true },
    valueDigest: { ...nullableString, required: true },
  },
} as const
const waitResultSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    requestId: { type: 'string', required: true },
    resultKind: {
      type: 'string', enum: ['completed', 'rejected', 'cancelled', 'timeout'], required: true,
    },
    consumedRevision: { type: 'integer', required: true },
    detailCode: { type: 'string', required: true },
  },
} as const
const descriptionSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    actionRequestId: { type: 'string', required: true },
    resultKind: { type: 'string', enum: ['completed', 'rejected', 'cancelled'], required: true },
    consumedRevision: { type: 'integer', required: true },
    detailCode: { type: 'string', required: true },
    semanticId: { type: 'string', required: true },
    role: { type: 'string', required: true },
    visible: { type: 'boolean', required: true },
    enabled: { type: 'boolean', required: true },
    actions: { type: 'array', items: { type: 'string' }, required: true },
    risk: { type: 'string', required: true },
    stateCode: { ...nullableString, required: true },
    reliabilityCode: { ...nullableString, required: true },
  },
} as const

function contextOf(exec: { agent?: Agent; signal: AbortSignal }): UiAutomationCallContext {
  if (exec.agent === undefined) throw new Error('ui_agent_required')
  return { agent: exec.agent, signal: exec.signal }
}

function projectNode(node: UiNode) {
  return {
    ref: node.ref, semanticId: node.semanticId, role: node.role, labelCode: node.labelCode,
    visible: node.visible, enabled: node.enabled, checked: node.checked, selected: node.selected,
    expanded: node.expanded, actions: [...node.actions], risk: node.risk, parentRef: node.parentRef,
    childRefs: [...node.childRefs], value: node.value, unit: node.unit, stateCode: node.stateCode,
    reliabilityCode: node.reliabilityCode, valueKind: node.valueKind,
    literalAllowed: node.literalAllowed, maxLength: node.maxLength,
  }
}

function projectSnapshot(page: UiSnapshotPage) {
  return {
    snapshotId: page.snapshotId,
    surfaceRevision: page.surfaceRevision,
    windowStack: [...page.windowStack],
    focusRef: page.focusRef,
    busy: page.busy,
    modalDepth: page.modalDepth,
    nodes: page.nodes.map(projectNode),
    nextCursor: page.nextCursor,
    complete: page.complete,
  }
}

function projectReceipt(result: UiActionReceipt, hideInputMetadata = false) {
  return {
    actionRequestId: result.actionRequestId,
    resultKind: result.resultKind,
    consumedRevision: result.consumedRevision,
    detailCode: result.detailCode,
    valueCharacterCount: hideInputMetadata ? null : result.valueCharacterCount,
    valueDigest: hideInputMetadata ? null : result.valueDigest,
  }
}

function projectWait(result: UiWaitResult) {
  return {
    requestId: result.requestId,
    resultKind: result.resultKind,
    consumedRevision: result.consumedRevision,
    detailCode: result.detailCode,
  }
}

function projectDescription(result: UiRefDescription) {
  return {
    actionRequestId: result.actionRequestId,
    resultKind: result.resultKind,
    consumedRevision: result.consumedRevision,
    detailCode: result.detailCode,
    semanticId: result.semanticId,
    role: result.role,
    visible: result.visible,
    enabled: result.enabled,
    actions: [...result.actions],
    risk: result.risk,
    stateCode: result.stateCode,
    reliabilityCode: result.reliabilityCode,
  }
}

/** Register the versioned semantic UI tool set. */
export function apply(ctx: Context): void {
  const states = new WeakMap<Agent, UiTurnState>()
  ctx.tools.register(defineTool({
    name: 'ui.snapshot.v2',
    description: 'Read one page from a Host-owned semantic UI observation lease.',
    parameters: {
      requestId: { type: 'string', required: true },
      cursor: { ...nullableString, required: true },
      pageSize: { type: 'integer', required: true },
    },
    output: { schema: snapshotSchema, render },
    async execute(args, exec) {
      const context = contextOf(exec)
      const current = states.get(context.agent)
      if (current?.kind === 'pending') throw new Error('ui_operation_in_progress')
      const prior = current?.kind === 'observed' ? current : undefined
      if (args.cursor !== null && prior === undefined) {
        throw new Error('ui_cursor_without_observation')
      }
      const pending: UiPendingState = { kind: 'pending' }
      states.set(context.agent, pending)
      try {
        const result = await ctx.uiAutomation.snapshot({
          requestId: args.requestId as UiRequestId,
          cursor: args.cursor as UiCursor | null,
          pageSize: args.pageSize,
        }, context)
        if (args.cursor !== null && prior?.snapshotId !== result.snapshotId) {
          throw new Error('ui_cursor_snapshot_mismatch')
        }
        if (context.signal.aborted) {
          states.delete(context.agent)
          return projectSnapshot(result)
        }
        states.set(context.agent, {
          kind: 'observed',
          snapshotId: result.snapshotId,
          surfaceRevision: result.surfaceRevision,
        })
        return projectSnapshot(result)
      } catch (error) {
        states.delete(context.agent)
        throw error
      }
    },
  }))

  const registerAction = (
    toolName: string,
    action: UiAction,
    extra: ParameterSchemaSpec = {},
  ) => {
    ctx.tools.register(defineTool({
      name: toolName,
      description: 'Deliver one user-equivalent action against the latest semantic UI observation.',
      parameters: { ...actionBase, ...extra },
      output: { schema: receiptSchema, render },
      async execute(args, exec) {
        const context = contextOf(exec)
        const state = states.get(context.agent)
        if (state?.kind !== 'observed') {
          throw new Error('ui_observation_required')
        }
        if (state.snapshotId !== args.snapshotId || state.surfaceRevision !== args.surfaceRevision) {
          throw new Error('ui_lease_mismatch')
        }
        const actionRequestId = args.actionRequestId as UiRequestId
        states.set(context.agent, { kind: 'pending' })
        try {
          const request: UiActionRequest = {
            actionRequestId,
            snapshotId: args.snapshotId as UiSnapshotId,
            surfaceRevision: args.surfaceRevision,
            ref: args.ref as UiRef,
            action,
            ...'value' in args ? { value: args.value as UiInputValue | number | boolean } : {},
            ...'key' in args ? { key: args.key as UiKey } : {},
          }
          const result = await ctx.uiAutomation.act(request, context)
          const input = 'value' in args ? args.value : undefined
          const hideInputMetadata = typeof input === 'object' && input !== null
            && 'kind' in input && input.kind === 'host_slot'
          if (context.signal.aborted || result.resultKind !== 'accepted') states.delete(context.agent)
          else states.set(context.agent, {
            kind: 'accepted', actionRequestId, surfaceRevision: result.consumedRevision,
          })
          return projectReceipt(result, hideInputMetadata)
        } catch (error) {
          states.delete(context.agent)
          throw error
        }
      },
    }))
  }

  registerAction('ui.click.v2', 'click')
  registerAction('ui.select_item.v2', 'select_item')
  registerAction('ui.select_option.v2', 'select_option')
  registerAction('ui.fill.v2', 'fill', { value: { ...uiInputSchema, required: true } })
  registerAction('ui.set_value.v2', 'set_value', { value: { type: 'number', required: true } })
  registerAction('ui.press.v2', 'press', {
    key: {
      type: 'string', enum: ['enter', 'escape', 'tab', 'up', 'down', 'left', 'right'], required: true,
    },
  })
  registerAction('ui.activate_tab.v2', 'activate_tab')
  registerAction('ui.set_checked.v3', 'set_checked', {
    value: { type: 'boolean', required: true },
  })

  ctx.tools.register(defineTool({
    name: 'ui.wait.v2',
    description: 'Wait for one semantic condition bound to the latest accepted UI action.',
    parameters: {
      requestId: { type: 'string', required: true },
      actionRequestId: { type: 'string', required: true },
      afterRevision: { type: 'integer', required: true },
      condition: { type: 'string', required: true },
      timeoutMs: { type: 'integer', required: true },
      semanticId: { ...nullableString, required: true },
      expected: { ...uiValueSchema, required: true },
    },
    output: { schema: waitResultSchema, render },
    async execute(args, exec) {
      const context = contextOf(exec)
      const state = states.get(context.agent)
      if (state?.kind !== 'accepted' || state.actionRequestId !== args.actionRequestId
        || state.surfaceRevision !== args.afterRevision) {
        throw new Error('ui_action_request_mismatch')
      }
      states.set(context.agent, { kind: 'pending' })
      try {
        return projectWait(await ctx.uiAutomation.wait({
          requestId: args.requestId as UiRequestId,
          actionRequestId: args.actionRequestId as UiRequestId,
          afterRevision: args.afterRevision,
          condition: args.condition,
          timeoutMs: args.timeoutMs,
          semanticId: args.semanticId,
          expected: args.expected,
        }, context))
      } finally {
        states.delete(context.agent)
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ui.describe_ref.v2',
    description: 'Consume the latest semantic observation and return safe target metadata.',
    parameters: actionBase,
    output: { schema: descriptionSchema, render },
    async execute(args, exec) {
      const context = contextOf(exec)
      const state = states.get(context.agent)
      if (state?.kind !== 'observed') {
        throw new Error('ui_observation_required')
      }
      if (state.snapshotId !== args.snapshotId || state.surfaceRevision !== args.surfaceRevision) {
        throw new Error('ui_lease_mismatch')
      }
      states.set(context.agent, { kind: 'pending' })
      try {
        return projectDescription(await ctx.uiAutomation.describe({
          actionRequestId: args.actionRequestId as UiRequestId,
          snapshotId: args.snapshotId as UiSnapshotId,
          surfaceRevision: args.surfaceRevision,
          ref: args.ref as UiRef,
        } satisfies UiDescribeRequest, context))
      } finally {
        states.delete(context.agent)
      }
    },
  }))
}
