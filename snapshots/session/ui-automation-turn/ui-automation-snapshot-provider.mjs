/** Deterministic semantic UI provider for the recorded-session scenario. */

import UiAutomationService from '@deepseek-ai/dsh-ui-automation'

export default class SnapshotUiAutomation extends UiAutomationService {
  snapshot() {
    return Promise.resolve({
      revision: 1,
      windowId: 'main.window',
      modalDepth: 0,
      focusRef: null,
      busy: false,
      nodes: [{
        ref: 'u1-name',
        semanticId: 'main.name',
        role: 'textbox',
        labelCode: 'name',
        visible: true,
        enabled: true,
        checked: null,
        selected: false,
        expanded: null,
        actions: ['fill'],
        risk: 'edit',
        parentRef: null,
        childRefs: [],
        value: '',
        unit: null,
        stateCode: null,
        reliabilityCode: null,
      }],
      truncated: false,
    })
  }

  act(request) {
    return Promise.resolve({
      requestId: request.requestId,
      resultKind: 'completed',
      consumedRevision: request.revision,
      detailCode: 'action_delivered',
    })
  }

  wait(request) {
    return Promise.resolve({
      requestId: request.requestId,
      resultKind: 'completed',
      consumedRevision: request.afterRevision,
      detailCode: 'condition_met',
    })
  }

  describe() {
    throw new Error('unused in this scenario')
  }
}
