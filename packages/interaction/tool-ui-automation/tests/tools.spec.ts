import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import UiAutomationService, {
  type UiActionRequest, type UiAutomationCallContext, type UiDescribeRequest,
  type UiSnapshotRequest, type UiWaitRequest,
} from '@deepseek-ai/dsh-ui-automation'
import * as ToolUiAutomation from '@deepseek-ai/dsh-tool-ui-automation'

class Provider extends UiAutomationService {
  readonly calls: Array<{ kind: string; request: unknown; context: UiAutomationCallContext }> = []
  snapshot(request: UiSnapshotRequest, context: UiAutomationCallContext) {
    this.calls.push({ kind: 'snapshot', request, context })
    return Promise.resolve({ revision: 7, windowId: 'main.window', modalDepth: 0, focusRef: null, busy: false, nodes: [], truncated: false })
  }
  act(request: UiActionRequest, context: UiAutomationCallContext) {
    this.calls.push({ kind: 'act', request, context })
    return Promise.resolve({ requestId: request.requestId, resultKind: 'completed' as const, consumedRevision: request.revision, detailCode: 'action_delivered' })
  }
  wait(request: UiWaitRequest, context: UiAutomationCallContext) {
    this.calls.push({ kind: 'wait', request, context })
    return Promise.resolve({ requestId: request.requestId, resultKind: 'completed' as const, consumedRevision: request.afterRevision, detailCode: 'condition_met' })
  }
  describe(request: UiDescribeRequest, context: UiAutomationCallContext) {
    this.calls.push({ kind: 'describe', request, context })
    return Promise.resolve({ requestId: request.requestId, resultKind: 'completed' as const, consumedRevision: request.revision, detailCode: 'ref_described', semanticId: 'main.search', role: 'button', visible: true, enabled: true, actions: ['click'], risk: 'navigate', stateCode: null, reliabilityCode: null })
  }
}

const signal = new AbortController().signal
const agent = { id: 'agent-1' } as Agent

async function setup() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(Provider)
  const fiber = await ctx.plugin(ToolUiAutomation)
  return { ctx, fiber, provider: ctx.uiAutomation as Provider }
}

async function run(ctx: Context, name: string, args: object, subject: Agent = agent) {
  return await ctx.tools.execute({ signal, callId: ToolCallId(name), name, arguments: args, agent: subject })
}

async function runWithoutAgent(ctx: Context, name: string, args: object) {
  return await ctx.tools.execute({ signal, callId: ToolCallId(name), name, arguments: args })
}

describe('semantic UI tools', () => {
  it('registers exactly the nine v1 tools and removes them on disposal', async () => {
    const { ctx, fiber } = await setup()
    expect(ctx.tools.schemas().map(tool => tool.name).sort()).toEqual([
      'ui.click.v1', 'ui.describe_ref.v1', 'ui.fill.v1', 'ui.press.v1',
      'ui.select_item.v1', 'ui.select_option.v1', 'ui.set_value.v1',
      'ui.snapshot.v1', 'ui.wait.v1',
    ])
    await fiber.dispose()
    expect(ctx.tools.schemas()).toEqual([])
  })

  it('forwards agent and AbortSignal and enforces snapshot-action-wait order', async () => {
    const { ctx, provider } = await setup()
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a0', revision: 7, ref: 'u7-a' })).isError).toBe(true)
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' })
    await run(ctx, 'ui.click.v1', { requestId: 'a1', revision: 7, ref: 'u7-a' })
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a2', revision: 7, ref: 'u7-b' })).isError).toBe(true)
    await run(ctx, 'ui.wait.v1', { requestId: 'w1', condition: 'revision_changed', timeoutMs: 10, afterRevision: 7, actionRequestId: 'a1' })
    expect(provider.calls.map(call => call.kind)).toEqual(['snapshot', 'act', 'wait'])
    expect(provider.calls.every(call => call.context.agent === agent && call.context.signal === signal)).toBe(true)
  })

  it('rejects subjectless calls and mismatched action revisions', async () => {
    const { ctx } = await setup()
    expect((await runWithoutAgent(ctx, 'ui.snapshot.v1', { requestId: 's0' })).isError).toBe(true)
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' })
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a1', revision: 8, ref: 'u7-a' })).isError).toBe(true)
  })

  it('projects fill and press arguments to the provider', async () => {
    const { ctx, provider } = await setup()
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' })
    await run(ctx, 'ui.fill.v1', { requestId: 'fill1', revision: 7, ref: 'u7-field', value: 'safe' })
    await run(ctx, 'ui.snapshot.v1', { requestId: 's2' })
    await run(ctx, 'ui.press.v1', { requestId: 'press1', revision: 7, ref: 'u7-field', key: 'enter' })
    expect(provider.calls.filter(call => call.kind === 'act').map(call => call.request)).toMatchObject([
      { action: 'fill', value: 'safe' },
      { action: 'press', key: 'enter' },
    ])
  })

  it('keeps observation state isolated by exact Agent object', async () => {
    const { ctx } = await setup()
    const other = { id: 'agent-2' } as Agent
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' }, agent)
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a1', revision: 7, ref: 'u7-a' }, other)).isError).toBe(true)
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a1', revision: 7, ref: 'u7-a' }, agent)).isError).toBe(false)
  })

  it('consumes describe state and resets state after wait failure', async () => {
    const { ctx, provider } = await setup()
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' })
    expect((await run(ctx, 'ui.describe_ref.v1', { requestId: 'd1', revision: 7, ref: 'u7-a' })).isError).toBe(false)
    expect((await run(ctx, 'ui.describe_ref.v1', { requestId: 'd2', revision: 7, ref: 'u7-a' })).isError).toBe(true)
    await run(ctx, 'ui.snapshot.v1', { requestId: 's2' })
    await run(ctx, 'ui.click.v1', { requestId: 'a2', revision: 7, ref: 'u7-a' })
    provider.wait = () => Promise.reject(new Error('provider_failed'))
    expect((await run(ctx, 'ui.wait.v1', { requestId: 'w2', condition: 'revision_changed', timeoutMs: 10, afterRevision: 7, actionRequestId: 'a2' })).isError).toBe(true)
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a3', revision: 7, ref: 'u7-a' })).isError).toBe(true)
  })

  it('validates wait bindings and forwards optional predicates', async () => {
    const { ctx, provider } = await setup()
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' })
    expect((await run(ctx, 'ui.wait.v1', {
      requestId: 'w0', condition: 'revision_changed', timeoutMs: 10,
      afterRevision: 7, actionRequestId: 'none',
    })).isError).toBe(true)
    await run(ctx, 'ui.click.v1', { requestId: 'a1', revision: 7, ref: 'u7-a' })
    expect((await run(ctx, 'ui.wait.v1', {
      requestId: 'w1', condition: 'revision_changed', timeoutMs: 10,
      afterRevision: 8, actionRequestId: 'a1',
    })).isError).toBe(true)
    expect((await run(ctx, 'ui.wait.v1', {
      requestId: 'w2', condition: 'revision_changed', timeoutMs: 10,
      afterRevision: 7, actionRequestId: 'wrong',
    })).isError).toBe(true)
    await run(ctx, 'ui.wait.v1', {
      requestId: 'w3', condition: 'semantic_visible', timeoutMs: 10,
      afterRevision: 7, actionRequestId: 'a1', semanticId: 'dialog.safe', expected: true,
    })
    expect(provider.calls.at(-1)?.request).toMatchObject({ semanticId: 'dialog.safe', expected: true })
  })

  it('rejects pending and mismatched describe requests', async () => {
    const { ctx } = await setup()
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' })
    expect((await run(ctx, 'ui.describe_ref.v1', { requestId: 'd1', revision: 8, ref: 'u7-a' })).isError).toBe(true)
    await run(ctx, 'ui.click.v1', { requestId: 'a1', revision: 7, ref: 'u7-a' })
    expect((await run(ctx, 'ui.describe_ref.v1', { requestId: 'd2', revision: 7, ref: 'u7-a' })).isError).toBe(true)
  })

  it('consumes a snapshot before a provider action can fail ambiguously', async () => {
    const { ctx, provider } = await setup()
    await run(ctx, 'ui.snapshot.v1', { requestId: 's1' })
    provider.act = () => Promise.reject(new Error('delivery_unknown'))
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a1', revision: 7, ref: 'u7-a' })).isError).toBe(true)
    expect((await run(ctx, 'ui.click.v1', { requestId: 'a2', revision: 7, ref: 'u7-a' })).isError).toBe(true)
  })
})
