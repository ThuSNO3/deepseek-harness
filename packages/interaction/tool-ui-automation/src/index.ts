/** Model-facing Consumer of the semantic UI automation capability. @module @deepseek-ai/dsh-tool-ui-automation */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { JsonValue } from '@deepseek-ai/dsh-session'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { UiAction, UiRef, UiRequestId, UiValue } from '@deepseek-ai/dsh-ui-automation'

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
    output: { schema: { type: 'json' }, render },
    async execute(args, exec) {
      const callContext = contextOf(exec)
      states.delete(callContext.agent)
      const result = await ctx.uiAutomation.snapshot({ requestId: args.requestId as UiRequestId }, callContext)
      states.set(callContext.agent, { revision: result.revision, actionRequestId: null })
      return result as unknown as JsonValue
    },
  }))

  const registerAction = (toolName: string, action: UiAction, parameters: ReturnType<typeof actionParameters>) => {
    ctx.tools.register(defineTool({
      name: toolName,
      description: 'Perform one bounded action on a ref from the latest semantic UI snapshot.',
      parameters,
      output: { schema: { type: 'json' }, render },
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
          ...'value' in args ? { value: args.value as string | number } : {},
          ...'key' in args ? { key: args.key as string } : {},
        }
        const result = await ctx.uiAutomation.act(request, callContext)
        return result as unknown as JsonValue
      },
    }))
  }

  registerAction('ui.click.v1', 'click', actionParameters())
  registerAction('ui.select_item.v1', 'select_item', actionParameters())
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
      expected: { type: 'json' },
    },
    output: { schema: { type: 'json' }, render },
    async execute(args, exec) {
      const callContext = contextOf(exec)
      const state = stateFor(callContext.agent)
      if (state.revision === null || state.actionRequestId === null) throw new Error('ui_observation_required')
      if (args.afterRevision !== state.revision) throw new Error('ui_revision_mismatch')
      if (args.actionRequestId !== state.actionRequestId) throw new Error('ui_action_request_mismatch')
      try {
        return await ctx.uiAutomation.wait({
          requestId: args.requestId as UiRequestId,
          condition: args.condition,
          timeoutMs: args.timeoutMs,
          afterRevision: args.afterRevision,
          actionRequestId: args.actionRequestId as UiRequestId,
          ...args.semanticId !== undefined ? { semanticId: args.semanticId } : {},
          ...args.expected !== undefined ? { expected: args.expected as UiValue } : {},
        }, callContext) as unknown as JsonValue
      } finally {
        states.delete(callContext.agent)
      }
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ui.describe_ref.v1',
    description: 'Describe safe metadata for one ref from the latest semantic UI snapshot.',
    parameters: actionParameters(),
    output: { schema: { type: 'json' }, render },
    async execute(args, exec) {
      const callContext = contextOf(exec)
      const state = stateFor(callContext.agent)
      if (state.revision === null) throw new Error('ui_observation_required')
      if (state.actionRequestId !== null) throw new Error('ui_action_pending_observation')
      if (args.revision !== state.revision) throw new Error('ui_revision_mismatch')
      states.delete(callContext.agent)
      return await ctx.uiAutomation.describe({
        requestId: args.requestId as UiRequestId,
        revision: args.revision,
        ref: args.ref as UiRef,
      }, callContext) as unknown as JsonValue
    },
  }))
}
