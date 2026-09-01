import UiAutomationService, { uiSnapshotId } from '@deepseek-ai/dsh-ui-automation'

export default class FixtureUiAutomation extends UiAutomationService {
  snapshot(_request: unknown, context: { agent: { id: unknown }; signal: AbortSignal }) {
    if (context.signal.aborted) throw new Error('unexpected abort')
    return Promise.resolve({
      snapshotId: uiSnapshotId('s-loader'), surfaceRevision: 1,
      windowStack: [String(context.agent.id)], modalDepth: 0,
      focusRef: null, busy: false, nodes: [], nextCursor: null, complete: true,
    })
  }
  act(): never { throw new Error('schema-only fixture') }
  wait(): never { throw new Error('schema-only fixture') }
  describe(): never { throw new Error('schema-only fixture') }
}
