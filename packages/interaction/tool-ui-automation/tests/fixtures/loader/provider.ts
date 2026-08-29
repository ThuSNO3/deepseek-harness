import UiAutomationService from '@deepseek-ai/dsh-ui-automation'

export default class FixtureUiAutomation extends UiAutomationService {
  snapshot(_request: unknown, context: { agent: { id: unknown }; signal: AbortSignal }) {
    if (context.signal.aborted) throw new Error('unexpected abort')
    return Promise.resolve({
      revision: 1, windowId: String(context.agent.id), modalDepth: 0,
      focusRef: null, busy: false, nodes: [], truncated: false,
    })
  }
  act(): never { throw new Error('schema-only fixture') }
  wait(): never { throw new Error('schema-only fixture') }
  describe(): never { throw new Error('schema-only fixture') }
}
