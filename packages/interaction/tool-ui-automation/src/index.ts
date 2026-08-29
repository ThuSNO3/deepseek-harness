/** Model-facing Consumer of the semantic UI automation capability. @module @deepseek-ai/dsh-tool-ui-automation */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type {
  UiAction, UiActionResult, UiNode, UiRef, UiRefDescription, UiRequestId, UiSnapshot,
} from '@deepseek-ai/dsh-ui-automation'

export const name = 'tool-ui-automation'
export const inject = ['tools', 'uiAutomation']

interface UiTurnState { revision: number | null; actionRequestId: string | null }

function contextOf(exec: { agent?: Agent; signal: AbortSignal }) {
  if (exec.agent === undefined) throw new Error('ui_agent_required')
  return { agent: exec.agent, signal: exec.signal }
}

function actionParameters(extra: Record<string, unknown> = {}) {
  return {
    requestId: { type: 'string', required: true } as const,
    revision: { type: 'integer', required: true } as const,
    ref: { type: 'string', required: true } as const,
    ...extra,
  }
}

function render(_args: unknown, value: unknown) {
  return [{ type: 'text' as const, text: JSON.stringify(value) }]
}

const nullableString = { oneOf: [{ type: 'string' }, { type: 'null' }] } as const
const nullableBoolean = { oneOf: [{ type: 'boolean' }, { type: 'null' }] } as const
const uiValueSchema = {
  oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }],
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
  },
} as const
const snapshotSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    revision: { type: 'integer', required: true },
    windowId: { type: 'string', required: true },
    modalDepth: { type: 'integer', required: true },
    focusRef: { ...nullableString, required: true },
    busy: { type: 'boolean', required: true },
    nodes: { type: 'array', items: nodeSchema, required: true },
    truncated: { type: 'boolean', required: true },
  },
} as const
const actionResultSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    requestId: { type: 'string', required: true },
    resultKind: { type: 'string', enum: ['completed', 'denied', 'cancelled', 'timeout'], required: true },
    consumedRevision: { type: 'integer', required: true },
    detailCode: { type: 'string', required: true },
  },
} as const
const descriptionSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    ...actionResultSchema.properties,
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

function projectNode(node: UiNode) {
  return {
    ref: node.ref, semanticId: node.semanticId, role: node.role, labelCode: node.labelCode,
    visible: node.visible, enabled: node.enabled, checked: node.checked, selected: node.selected,
    expanded: node.expanded, actions: [...node.actions], risk: node.risk, parentRef: node.parentRef,
    childRefs: [...node.childRefs], value: node.value, unit: node.unit, stateCode: node.stateCode,
    reliabilityCode: node.reliabilityCode,
  }
}

function projectSnapshot(snapshot: UiSnapshot) {
  return {
    revision: snapshot.revision, windowId: snapshot.windowId, modalDepth: snapshot.modalDepth,
    focusRef: snapshot.focusRef, busy: snapshot.busy, nodes: snapshot.nodes.map(projectNode),
    truncated: snapshot.truncated,
  }
}

function projectActionResult(result: UiActionResult) {
  return {
    requestId: result.requestId, resultKind: result.resultKind,
    consumedRevision: result.consumedRevision, detailCode: result.detailCode,
  }
}

function projectDescription(result: UiRefDescription) {
  return {
    ...projectActionResult(result), semanticId: result.semanticId, role: result.role,
    visible: result.visible, enabled: result.enabled, actions: [...result.actions], risk: result.risk,
    stateCode: result.stateCode, reliabilityCode: result.reliabilityCode,
  }
}

export function apply(ctx: Context): void {
  const states = new WeakMap<Agent, UiTurnState>()
  const stateFor = (agent: Agent): UiTurnState => {
    const current = states.get(agent)
    if (current !== undefined) return current
    const created = { revision: null, actionRequestId: null }
    states.set(agent, created)
    return created
  }
  ctx.tools.register(defineTool({
    name: 'ui.snapshot.v1',
    description: 'Read the current host-owned semantic UI surface before taking one action.',
    parameters: { requestId: { type: 'string', required: true } },
    output: { schema: snapshotSchema, render },
    async execute(args, exec) {
      const callContext = contextOf(exec)
      states.delete(callContext.agent)
      const result = await ctx.uiAutomation.snapshot({ requestId: args.requestId as UiRequestId }, callContext)
      states.set(callContext.agent, { revision: result.revision, actionRequestId: null })
      return projectSnapshot(result)
    },
  }))

  const registerAction = (toolName: string, action: UiAction, parameters: ReturnType<typeof actionParameters>) => {
    ctx.tools.register(defineTool({
      name: toolName,
      description: 'Perform one bounded action on a ref from the latest semantic UI snapshot.',
      parameters,
      output: { schema: actionResultSchema, render },
      async execute(args, exec) {
        const callContext = contextOf(exec)
        const state = stateFor(callContext.agent)
        if (state.revision === null) throw new Error('ui_observation_required')
        if (state.actionRequestId !== null) throw new Error('ui_action_pending_observation')
        if (args.revision !== state.revision) throw new Error('ui_revision_mismatch')
        state.actionRequestId = args.requestId
        const request = {
          requestId: args.requestId as UiRequestId,
          revision: args.revision,
          ref: args.ref as UiRef,
          action,
          ...'value' in args ? { value: args.value as string | number | boolean } : {},
          ...'key' in args ? { key: args.key as string } : {},
        }
        const result = await ctx.uiAutomation.act(request, callContext)
        return projectActionResult(result)
      },
    }))
  }

  registerAction('ui.click.v1', 'click', actionParameters())
  registerAction('ui.select_item.v1', 'select_item', actionParameters())
  registerAction('ui.set_checked.v1', 'set_checked', actionParameters({ value: { type: 'boolean', required: true } }))
  registerAction('ui.fill.v1', 'fill', actionParameters({ value: { type: 'string', required: true } }))
  registerAction('ui.select_option.v1', 'select_option', actionParameters())
  registerAction('ui.set_value.v1', 'set_value', actionParameters({ value: { type: 'number', required: true } }))
  registerAction('ui.press.v1', 'press', actionParameters({
    key: { type: 'string', required: true, enum: ['enter', 'escape', 'tab', 'up', 'down', 'left', 'right'] },
  }))

  ctx.tools.register(defineTool({
    name: 'ui.wait.v1',
    description: 'Wait for a bounded semantic condition after the latest UI action.',
    parameters: {
      requestId: { type: 'string', required: true },
      condition: { type: 'string', required: true, enum: ['revision_changed', 'modal_visible', 'semantic_visible'] },
      timeoutMs: { type: 'integer', required: true },
      afterRevision: { type: 'integer', required: true },
      actionRequestId: { type: 'string', required: true },
      semanticId: { type: 'string' },
      expected: uiValueSchema,
    },
    output: { schema: actionResultSchema, render },
    async execute(args, exec) {
      const callContext = contextOf(exec)
      const state = stateFor(callContext.agent)
      if (state.revision === null || state.actionRequestId === null) throw new Error('ui_observation_required')
      if (args.afterRevision !== state.revision) throw new Error('ui_revision_mismatch')
      if (args.actionRequestId !== state.actionRequestId) throw new Error('ui_action_request_mismatch')
      try {
        const result = await ctx.uiAutomation.wait({
          requestId: args.requestId as UiRequestId,
          condition: args.condition,
          timeoutMs: args.timeoutMs,
          afterRevision: args.afterRevision,
          actionRequestId: args.actionRequestId as UiRequestId,
          ...args.semanticId !== undefined ? { semanticId: args.semanticId } : {},
          ...args.expected !== undefined ? { expected: args.expected } : {},
        }, callContext)
        return projectActionResult(result)
      } finally {
        states.delete(callContext.agent)
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ui.describe_ref.v1',
    description: 'Describe safe metadata for one ref from the latest semantic UI snapshot.',
    parameters: actionParameters(),
    output: { schema: descriptionSchema, render },
    async execute(args, exec) {
      const callContext = contextOf(exec)
      const state = stateFor(callContext.agent)
      if (state.revision === null) throw new Error('ui_observation_required')
      if (state.actionRequestId !== null) throw new Error('ui_action_pending_observation')
      if (args.revision !== state.revision) throw new Error('ui_revision_mismatch')
      states.delete(callContext.agent)
      const result = await ctx.uiAutomation.describe({
        requestId: args.requestId as UiRequestId,
        revision: args.revision,
        ref: args.ref as UiRef,
      }, callContext)
      return projectDescription(result)
    },
  }))
}
