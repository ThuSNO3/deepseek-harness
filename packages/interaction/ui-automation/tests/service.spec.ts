import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import UiAutomationService, {
  type UiAutomationCallContext, type UiSnapshotRequest,
  uiCursor, uiHostSlotRef, uiRef, uiRequestId, uiSnapshotId,
} from '@deepseek-ai/dsh-ui-automation'

class Provider extends UiAutomationService {
  snapshot(_request: UiSnapshotRequest, context: UiAutomationCallContext) {
    return Promise.resolve({
      snapshotId: 's-fixture' as never, surfaceRevision: 1,
      windowStack: [String(context.agent.id)], modalDepth: 0,
      focusRef: null, busy: false, nodes: [], nextCursor: null, complete: true,
    })
  }
  act(): never { throw new Error('unused') }
  wait(): never { throw new Error('unused') }
  describe(): never { throw new Error('unused') }
}

describe('UiAutomationService', () => {
  it('brands every wire identity without changing its string value', () => {
    expect([
      uiRef('ref'), uiRequestId('request'), uiSnapshotId('snapshot'),
      uiCursor('cursor'), uiHostSlotRef('slot'),
    ]).toEqual(['ref', 'request', 'snapshot', 'cursor', 'slot'])
  })

  it('registers one provider on ctx.uiAutomation', async () => {
    const ctx = new Context()
    const fiber = await ctx.plugin(Provider)
    expect(ctx.uiAutomation).toBeInstanceOf(Provider)
    await fiber.dispose()
    expect(ctx.get('uiAutomation')).toBeUndefined()
  })
})
