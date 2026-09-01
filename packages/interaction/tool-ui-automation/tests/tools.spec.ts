import { Context } from '@deepseek-ai/cordis'
import { Loader } from '@deepseek-ai/cordis-plugin-loader'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import UiAutomationService from '@deepseek-ai/dsh-ui-automation'
import type {
  UiActionReceipt, UiActionRequest, UiAutomationCallContext, UiDescribeRequest,
  UiSnapshotRequest, UiWaitRequest,
} from '@deepseek-ai/dsh-ui-automation'
import * as ToolUiAutomation from '@deepseek-ai/dsh-tool-ui-automation'
import { describe, expect, it } from 'vitest'

const tools = [
  'ui.activate_tab.v2', 'ui.click.v2', 'ui.describe_ref.v2', 'ui.fill.v2',
  'ui.press.v2', 'ui.select_item.v2', 'ui.select_option.v2', 'ui.set_checked.v3',
  'ui.set_value.v2', 'ui.snapshot.v2', 'ui.wait.v2',
]
const node = {
  ref: 'u7-node' as never, semanticId: 'main.node', role: 'button', labelCode: 'safe',
  visible: true, enabled: true, checked: null, selected: false, expanded: null,
  actions: ['click'] as const, risk: 'none', parentRef: null, childRefs: [], value: null,
  unit: null, stateCode: null, reliabilityCode: null, valueKind: 'none',
  literalAllowed: false, maxLength: 0,
}

class Provider extends UiAutomationService {
  extraResults = false
  failAct = false
  readonly calls: Array<{
    kind: 'snapshot' | 'act' | 'wait' | 'describe'
    request: unknown
    context: UiAutomationCallContext
  }> = []

  snapshot(request: UiSnapshotRequest, context: UiAutomationCallContext) {
    this.calls.push({ kind: 'snapshot', request, context })
    const second = request.cursor !== null
    return Promise.resolve({
      snapshotId: 's-one' as never, surfaceRevision: 7, windowStack: ['main.window'],
      focusRef: null, busy: false, modalDepth: 0,
      nodes: second ? [] : [this.extraResults ? { ...node, extraNode: 'hidden' } : node],
      nextCursor: second ? null : 'c-next' as never, complete: second,
      ...(this.extraResults ? { extraSnapshot: 'hidden' } : {}),
    })
  }

  act(request: UiActionRequest, context: UiAutomationCallContext): Promise<UiActionReceipt> {
    this.calls.push({ kind: 'act', request, context })
    if (this.failAct) return Promise.reject(new Error('delivery_unknown'))
    return Promise.resolve({
      actionRequestId: request.actionRequestId, resultKind: 'accepted' as const,
      consumedRevision: request.surfaceRevision, detailCode: 'action_delivered',
      valueCharacterCount: request.action === 'fill' ? 3 : null, valueDigest: null,
      ...(this.extraResults ? { extraResult: 'hidden' } : {}),
    })
  }

  wait(request: UiWaitRequest, context: UiAutomationCallContext) {
    this.calls.push({ kind: 'wait', request, context })
    return Promise.resolve({
      requestId: request.requestId, resultKind: 'completed' as const,
      consumedRevision: request.afterRevision, detailCode: 'condition_met',
      ...(this.extraResults ? { extraResult: 'hidden' } : {}),
    })
  }

  describe(request: UiDescribeRequest, context: UiAutomationCallContext) {
    this.calls.push({ kind: 'describe', request, context })
    return Promise.resolve({
      actionRequestId: request.actionRequestId, resultKind: 'completed' as const,
      consumedRevision: request.surfaceRevision, detailCode: 'ref_described',
      semanticId: 'main.search', role: 'button', visible: true, enabled: true,
      actions: ['click'] as const, risk: 'navigate', stateCode: null, reliabilityCode: null,
      ...(this.extraResults ? { extraDescription: 'hidden' } : {}),
    })
  }
}

const agent = { id: 'agent-1' } as Agent
const snapshot = { requestId: 's1', cursor: null, pageSize: 64 }
const action = { actionRequestId: 'a1', snapshotId: 's-one', surfaceRevision: 7, ref: 'u7-node' }
const wait = {
  requestId: 'w1', actionRequestId: 'a1', afterRevision: 7,
  condition: 'revision_changed', timeoutMs: 10, semanticId: null, expected: null,
}

async function setup() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(Provider)
  const fiber = await ctx.plugin(ToolUiAutomation)
  return { ctx, fiber, provider: ctx.uiAutomation as Provider }
}

function run(
  ctx: Context, name: string, args: object, subject: Agent | null = agent,
  signal: AbortSignal = new AbortController().signal,
) {
  return ctx.tools.execute({
    signal, callId: ToolCallId(name), name, arguments: args,
    ...(subject === null ? {} : { agent: subject }),
  })
}

describe('semantic UI tools', () => {
  it('keeps the function-plugin namespace through Loader unwrapExports', () => {
    const loader = Object.create(Loader.prototype) as Loader
    expect('default' in ToolUiAutomation).toBe(false)
    expect(loader.unwrapExports(ToolUiAutomation)).toBe(ToolUiAutomation)
    expect(ToolUiAutomation.name).toBe('tool-ui-automation')
    expect(ToolUiAutomation.inject).toEqual(['tools', 'uiAutomation'])
    expect(typeof ToolUiAutomation.apply).toBe('function')
  })

  it('registers only the versioned tools and removes them on disposal', async () => {
    const { ctx, fiber } = await setup()
    expect(ctx.tools.schemas().map(tool => tool.name).sort()).toEqual(tools)
    await fiber.dispose()
    expect(ctx.tools.schemas()).toEqual([])
  })

  it('forwards the exact Agent and AbortSignal', async () => {
    const { ctx, provider } = await setup()
    const controller = new AbortController()
    await run(ctx, 'ui.snapshot.v2', snapshot, agent, controller.signal)
    await run(ctx, 'ui.click.v2', action, agent, controller.signal)
    await run(ctx, 'ui.wait.v2', wait, agent, controller.signal)
    expect(provider.calls.map(call => call.kind)).toEqual(['snapshot', 'act', 'wait'])
    expect(provider.calls.every(call => (
      call.context.agent === agent && call.context.signal === controller.signal
    ))).toBe(true)
  })

  it('isolates pagination and action state by exact Agent object', async () => {
    const { ctx, provider } = await setup()
    const other = { id: 'agent-2' } as Agent
    await run(ctx, 'ui.snapshot.v2', snapshot)
    expect((await run(ctx, 'ui.snapshot.v2', {
      requestId: 's2', cursor: 'c-next', pageSize: 64,
    }, other)).isError).toBe(true)
    expect((await run(ctx, 'ui.click.v2', action, other)).isError).toBe(true)
    expect((await run(ctx, 'ui.snapshot.v2', {
      requestId: 's2', cursor: 'c-next', pageSize: 64,
    })).isError).toBe(false)
    expect(provider.calls.filter(call => call.kind === 'snapshot')).toHaveLength(2)
  })

  it('rejects subjectless calls and a Provider-mismatched continuation', async () => {
    const { ctx, provider } = await setup()
    expect((await run(ctx, 'ui.snapshot.v2', snapshot, null)).isError).toBe(true)
    await run(ctx, 'ui.snapshot.v2', snapshot)
    provider.snapshot = () => Promise.resolve({
      snapshotId: 's-other' as never, surfaceRevision: 7, windowStack: ['main.window'],
      focusRef: null, busy: false, modalDepth: 0, nodes: [], nextCursor: null, complete: true,
    })
    expect((await run(ctx, 'ui.snapshot.v2', {
      requestId: 's2', cursor: 'c-next', pageSize: 64,
    })).isError).toBe(true)
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(true)
  })

  it('requires one accepted action before wait and consumes it', async () => {
    const { ctx } = await setup()
    expect((await run(ctx, 'ui.wait.v2', wait)).isError).toBe(true)
    await run(ctx, 'ui.snapshot.v2', snapshot)
    await run(ctx, 'ui.click.v2', action)
    expect((await run(ctx, 'ui.click.v2', { ...action, actionRequestId: 'a2' })).isError).toBe(true)
    expect((await run(ctx, 'ui.wait.v2', { ...wait, actionRequestId: 'wrong' })).isError).toBe(true)
    expect((await run(ctx, 'ui.wait.v2', wait)).isError).toBe(false)
    expect((await run(ctx, 'ui.wait.v2', wait)).isError).toBe(true)
  })

  it('forwards every typed action value', async () => {
    const { ctx, provider } = await setup()
    const cases = [
      ['ui.fill.v2', { value: { kind: 'literal', text: 'Ada' } }],
      ['ui.fill.v2', { value: { kind: 'host_slot', slotRef: 'h-secret' } }],
      ['ui.set_checked.v3', { value: true }], ['ui.set_value.v2', { value: 5 }],
      ['ui.press.v2', { key: 'enter' }], ['ui.activate_tab.v2', {}],
    ] as const
    for (const [index, [name, extra]] of cases.entries()) {
      await run(ctx, 'ui.snapshot.v2', { ...snapshot, requestId: 's' + String(index) })
      await run(ctx, name, { ...action, actionRequestId: 'a' + String(index), ...extra })
      await run(ctx, 'ui.wait.v2', {
        ...wait, actionRequestId: 'a' + String(index), requestId: 'w' + String(index),
      })
    }
    expect(provider.calls.filter(call => call.kind === 'act').map(call => call.request)).toMatchObject([
      { action: 'fill', value: { kind: 'literal', text: 'Ada' } },
      { action: 'fill', value: { kind: 'host_slot', slotRef: 'h-secret' } },
      { action: 'set_checked', value: true }, { action: 'set_value', value: 5 },
      { action: 'press', key: 'enter' }, { action: 'activate_tab' },
    ])
    const results = provider.calls.filter(call => call.kind === 'act')
    expect(results).toHaveLength(6)
  })

  it('removes Host-slot value metadata from canonical and model-visible results', async () => {
    const { ctx, provider } = await setup()
    provider.act = request => Promise.resolve({
      actionRequestId: request.actionRequestId, resultKind: 'accepted', consumedRevision: 7,
      detailCode: 'action_delivered', valueCharacterCount: 9, valueDigest: 'guessable-secret-digest',
    })
    await run(ctx, 'ui.snapshot.v2', snapshot)
    const result = await run(ctx, 'ui.fill.v2', {
      ...action, value: { kind: 'host_slot', slotRef: 'h-secret' },
    })
    expect(result.isError).toBe(false)
    expect(result.isError ? undefined : result.value).toMatchObject({
      valueCharacterCount: null, valueDigest: null,
    })
    expect(JSON.stringify(result.content)).not.toContain('guessable-secret-digest')
    expect(JSON.stringify(result.content)).not.toContain('9')
  })

  it('rejects malformed inputs before Provider dispatch', async () => {
    const { ctx, provider } = await setup()
    await run(ctx, 'ui.snapshot.v2', snapshot)
    expect((await run(ctx, 'ui.fill.v2', {
      ...action, value: { kind: 'host_slot', text: 'secret' },
    })).isError).toBe(true)
    expect((await run(ctx, 'ui.set_checked.v3', { ...action, value: 'true' })).isError).toBe(true)
    expect(provider.calls.map(call => call.kind)).toEqual(['snapshot'])
  })

  it('releases state after Provider action failure or rejection', async () => {
    const { ctx, provider } = await setup()
    await run(ctx, 'ui.snapshot.v2', snapshot)
    provider.failAct = true
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(true)
    provider.failAct = false
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(true)
    await run(ctx, 'ui.snapshot.v2', snapshot)
    provider.act = request => Promise.resolve({
      actionRequestId: request.actionRequestId, resultKind: 'rejected', consumedRevision: 7,
      detailCode: 'policy', valueCharacterCount: null, valueDigest: null,
    })
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(false)
    expect((await run(ctx, 'ui.wait.v2', wait)).isError).toBe(true)
  })

  it('discards an aborted snapshot that settles late', async () => {
    const { ctx, provider } = await setup()
    let release: (() => void) | undefined
    let markEntered: (() => void) | undefined
    const entered = new Promise<void>((resolve) => { markEntered = resolve })
    provider.snapshot = async (_request, _context) => {
      markEntered?.()
      await new Promise<void>((resolve) => { release = resolve })
      return {
        snapshotId: 's-one' as never, surfaceRevision: 7, windowStack: ['main.window'],
        focusRef: null, busy: false, modalDepth: 0, nodes: [node],
        nextCursor: null, complete: true,
      }
    }
    const controller = new AbortController()
    const pending = run(ctx, 'ui.snapshot.v2', snapshot, agent, controller.signal)
    await entered
    controller.abort()
    release?.()
    expect((await pending).isError).toBe(true)
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(true)
  })

  it('discards action and description state after mid-call abort', async () => {
    const { ctx, provider } = await setup()
    let releaseAction: (() => void) | undefined
    let markActionEntered: (() => void) | undefined
    const actionEntered = new Promise<void>((resolve) => { markActionEntered = resolve })
    provider.act = async (request) => {
      markActionEntered?.()
      await new Promise<void>((resolve) => { releaseAction = resolve })
      return {
        actionRequestId: request.actionRequestId, resultKind: 'accepted', consumedRevision: 7,
        detailCode: 'action_delivered', valueCharacterCount: null, valueDigest: null,
      }
    }
    await run(ctx, 'ui.snapshot.v2', snapshot)
    const actionController = new AbortController()
    const actionCall = run(ctx, 'ui.click.v2', action, agent, actionController.signal)
    await actionEntered
    expect((await run(ctx, 'ui.wait.v2', wait)).isError).toBe(true)
    expect((await run(ctx, 'ui.snapshot.v2', { ...snapshot, requestId: 'during-action' })).isError).toBe(true)
    actionController.abort()
    releaseAction?.()
    expect((await actionCall).isError).toBe(true)
    expect((await run(ctx, 'ui.wait.v2', wait)).isError).toBe(true)

    let releaseDescription: (() => void) | undefined
    let markDescriptionEntered: (() => void) | undefined
    const descriptionEntered = new Promise<void>((resolve) => { markDescriptionEntered = resolve })
    provider.describe = async (request) => {
      markDescriptionEntered?.()
      await new Promise<void>((resolve) => { releaseDescription = resolve })
      return {
        actionRequestId: request.actionRequestId, resultKind: 'completed', consumedRevision: 7,
        detailCode: 'ref_described', semanticId: 'main.node', role: 'button', visible: true,
        enabled: true, actions: ['click'], risk: 'none', stateCode: null, reliabilityCode: null,
      }
    }
    await run(ctx, 'ui.snapshot.v2', snapshot)
    const describeController = new AbortController()
    const describeCall = run(ctx, 'ui.describe_ref.v2', action, agent, describeController.signal)
    await descriptionEntered
    expect((await run(ctx, 'ui.snapshot.v2', { ...snapshot, requestId: 'during-describe' })).isError).toBe(true)
    describeController.abort()
    releaseDescription?.()
    expect((await describeCall).isError).toBe(true)
    expect((await run(ctx, 'ui.describe_ref.v2', action)).isError).toBe(true)
  })

  it('admits only one same-Agent snapshot while the Provider is pending', async () => {
    const { ctx, provider } = await setup()
    let release: (() => void) | undefined
    provider.snapshot = async () => {
      await new Promise<void>((resolve) => { release = resolve })
      return {
        snapshotId: 's-one' as never, surfaceRevision: 7, windowStack: ['main.window'],
        focusRef: null, busy: false, modalDepth: 0, nodes: [node],
        nextCursor: null, complete: true,
      }
    }
    const first = run(ctx, 'ui.snapshot.v2', snapshot)
    expect((await run(ctx, 'ui.snapshot.v2', { ...snapshot, requestId: 's2' })).isError).toBe(true)
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(true)
    release?.()
    expect((await first).isError).toBe(false)
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(false)
  })

  it('does not carry observation state across Consumer remount', async () => {
    const { ctx, fiber } = await setup()
    await run(ctx, 'ui.snapshot.v2', snapshot)
    await fiber.dispose()
    await ctx.plugin(ToolUiAutomation)
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(true)
    await run(ctx, 'ui.snapshot.v2', snapshot)
    expect((await run(ctx, 'ui.click.v2', action)).isError).toBe(false)
  })

  it('projects only declared Provider result fields', async () => {
    const { ctx, provider } = await setup()
    provider.extraResults = true
    expect(JSON.stringify(await run(ctx, 'ui.snapshot.v2', snapshot))).not.toContain('extra')
    expect(JSON.stringify(await run(ctx, 'ui.click.v2', action))).not.toContain('extra')
    expect(JSON.stringify(await run(ctx, 'ui.wait.v2', wait))).not.toContain('extra')
    await run(ctx, 'ui.snapshot.v2', snapshot)
    expect(JSON.stringify(await run(ctx, 'ui.describe_ref.v2', action))).not.toContain('extra')
  })

  it('consumes describe state and rejects a mismatched lease', async () => {
    const { ctx } = await setup()
    await run(ctx, 'ui.snapshot.v2', snapshot)
    expect((await run(ctx, 'ui.describe_ref.v2', { ...action, snapshotId: 'wrong' })).isError).toBe(true)
    expect((await run(ctx, 'ui.describe_ref.v2', action)).isError).toBe(false)
    expect((await run(ctx, 'ui.describe_ref.v2', action)).isError).toBe(true)
  })

  it('rejects an action lease mismatch before Provider dispatch', async () => {
    const { ctx, provider } = await setup()
    await run(ctx, 'ui.snapshot.v2', snapshot)
    expect((await run(ctx, 'ui.click.v2', { ...action, surfaceRevision: 8 })).isError).toBe(true)
    expect(provider.calls.map(call => call.kind)).toEqual(['snapshot'])
  })
})
