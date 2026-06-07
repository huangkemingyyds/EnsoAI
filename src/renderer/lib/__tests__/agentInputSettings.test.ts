import { describe, expect, it } from 'vitest';
import {
  canSelectAgentInputAutoPopupMode,
  shouldShowStopHookDependencyDialog,
} from '../agentInputSettings';

describe('agent input settings policy', () => {
  it('allows hideWhileRunning even when Claude Stop Hook is disabled', () => {
    expect(
      canSelectAgentInputAutoPopupMode({
        mode: 'hideWhileRunning',
        claudeStopHookEnabled: false,
      })
    ).toBe(true);
  });

  it('does not force Agent Input out of hideWhileRunning when disabling Claude Stop Hook', () => {
    expect(
      shouldShowStopHookDependencyDialog({
        nextStopHookEnabled: false,
        agentInputAutoPopupMode: 'hideWhileRunning',
      })
    ).toBe(false);
  });
});
