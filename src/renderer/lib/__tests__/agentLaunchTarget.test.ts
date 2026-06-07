import { describe, expect, it } from 'vitest';
import { resolveAgentLaunchTarget } from '../agentLaunchTarget';

describe('resolveAgentLaunchTarget', () => {
  it('resolves an environment Agent variant to its launch target', () => {
    const target = resolveAgentLaunchTarget({
      agentId: 'codex-hapi',
      customAgents: [],
      agentSettings: {
        codex: {
          enabled: true,
          isDefault: false,
          customPath: 'C:\\tools\\codex.cmd',
          customArgs: '--profile visual',
        },
      },
    });

    expect(target).toEqual({
      agentId: 'codex-hapi',
      baseAgentId: 'codex',
      name: 'Codex (Hapi)',
      command: 'codex',
      customPath: 'C:\\tools\\codex.cmd',
      customArgs: '--profile visual',
      environment: 'hapi',
    });
  });

  it('uses shared registry display metadata for built-in Agent names', () => {
    const target = resolveAgentLaunchTarget({
      agentId: 'opencode',
      customAgents: [],
      agentSettings: {},
    });

    expect(target).toMatchObject({
      agentId: 'opencode',
      baseAgentId: 'opencode',
      name: 'OpenCode',
      command: 'opencode',
      environment: 'native',
    });
  });
});
