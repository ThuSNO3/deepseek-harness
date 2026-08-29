import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import UiAutomationService, { type UiAutomationCallContext, type UiSnapshotRequest } from '@deepseek-ai/dsh-ui-automation'

class Provider extends UiAutomationService {
  snapshot(_request: UiSnapshotRequest, context: UiAutomationCallContext) {
    return Promise.resolve({
      revision: 1, windowId: String(context.agent.id), modalDepth: 0,
      focusRef: null, busy: false, nodes: [], truncated: false,
    })
  }
  act(): never { throw new Error('unused') }
  wait(): never { throw new Error('unused') }
  describe(): never { throw new Error('unused') }
}

describe('UiAutomationService', () => {
  it('registers one provider on ctx.uiAutomation', async () => {
    const ctx = new Context()
    await ctx.plugin(Provider)
    expect(ctx.uiAutomation).toBeInstanceOf(Provider)
  })
})
