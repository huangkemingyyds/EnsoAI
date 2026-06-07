import { describe, expect, it } from 'vitest';
import { resolveEnabledAgent } from '../enabledAgent';

describe('resolveEnabledAgent', () => {
  it('resolves built-in Agent metadata through the shared launch target resolver', () => {
    const agent = resolveEnabledAgent(
      'opencode-happy',
      {
        opencode: {
          enabled: true,
          isDefault: true,
          customPath: 'C:\\tools\\opencode.cmd',
          customArgs: '--workspace visual',
        },
      },
      []
    );

    expect(agent).toEqual({
      agentId: 'opencode-happy',
      name: 'OpenCode (Happy)',
      command: 'opencode',
      isDefault: false,
      environment: 'happy',
      customPath: 'C:\\tools\\opencode.cmd',
      customArgs: '--workspace visual',
    });
  });
});
