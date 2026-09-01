/** Deterministic semantic UI Provider for the recorded-session scenario. */

import UiAutomationService, { uiRef, uiSnapshotId } from '@deepseek-ai/dsh-ui-automation'

export default class SnapshotUiAutomation extends UiAutomationService {
  snapshot() {
    return Promise.resolve({
      snapshotId: uiSnapshotId('s-ui-turn'),
      surfaceRevision: 1,
      windowStack: ['main.window'],
      focusRef: null,
      busy: false,
      modalDepth: 0,
      nodes: [{
        ref: uiRef('u1-name'), semanticId: 'main.name', role: 'textbox', labelCode: 'name',
        visible: true, enabled: true, checked: null, selected: false, expanded: null,
        actions: ['fill'], risk: 'edit', parentRef: null, childRefs: [], value: '',
        unit: null, stateCode: null, reliabilityCode: null, valueKind: 'safe_text',
        literalAllowed: true, maxLength: 64,
      }],
      nextCursor: null,
      complete: true,
    })
  }

  act(request) {
    return Promise.resolve({
      actionRequestId: request.actionRequestId, resultKind: 'accepted',
      consumedRevision: request.surfaceRevision, detailCode: 'action_delivered',
      valueCharacterCount: 3, valueDigest: null,
    })
  }

  wait(request) {
    return Promise.resolve({
      requestId: request.requestId, resultKind: 'completed',
      consumedRevision: request.afterRevision, detailCode: 'condition_met',
    })
  }

  describe() { throw new Error('unused in this scenario') }
}
