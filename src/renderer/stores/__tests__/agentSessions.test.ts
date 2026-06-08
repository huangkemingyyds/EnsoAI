import { beforeEach, describe, expect, it } from 'vitest';
import { useAgentSessionsStore } from '../agentSessions';

describe('agentSessions enhanced input state', () => {
  beforeEach(() => {
    useAgentSessionsStore.setState({ enhancedInputStates: {} });
  });

  it('defaults enhanced input draft state to closed and unsuppressed', () => {
    expect(useAgentSessionsStore.getState().getEnhancedInputState('session-1')).toEqual({
      open: false,
      content: '',
      imagePaths: [],
      autoOpenSuppressed: false,
    });
  });

  it('preserves draft while manual close suppresses completion auto-open', () => {
    const store = useAgentSessionsStore.getState();

    store.setEnhancedInputContent('session-1', 'continue this');
    store.setEnhancedInputImages('session-1', ['D:\\tmp\\image.png']);
    store.suppressEnhancedInputAutoOpen('session-1');
    store.setEnhancedInputOpen('session-1', false);

    expect(store.getEnhancedInputState('session-1')).toEqual({
      open: false,
      content: 'continue this',
      imagePaths: ['D:\\tmp\\image.png'],
      autoOpenSuppressed: true,
    });
  });

  it('clears auto-open suppression when explicitly opened or successfully cleared', () => {
    const store = useAgentSessionsStore.getState();

    store.suppressEnhancedInputAutoOpen('session-1');
    store.setEnhancedInputOpen('session-1', true);
    expect(store.getEnhancedInputState('session-1').autoOpenSuppressed).toBe(false);

    store.setEnhancedInputContent('session-1', 'sent draft');
    store.setEnhancedInputImages('session-1', ['D:\\tmp\\image.png']);
    store.suppressEnhancedInputAutoOpen('session-1');
    store.clearEnhancedInput('session-1', true);

    expect(store.getEnhancedInputState('session-1')).toEqual({
      open: true,
      content: '',
      imagePaths: [],
      autoOpenSuppressed: false,
    });
  });
});
