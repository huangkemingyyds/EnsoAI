import { AGENT_REGISTRY, BUILTIN_AGENT_IDS } from '@shared/constants/agents';
import { describe, expect, it } from 'vitest';
import { BUILTIN_AGENT_INFO, BUILTIN_AGENTS } from '../constants';

describe('settings Agent constants', () => {
  it('derive built-in Agent display metadata from the shared registry', () => {
    expect(BUILTIN_AGENTS).toEqual([...BUILTIN_AGENT_IDS]);

    for (const agentId of BUILTIN_AGENT_IDS) {
      expect(BUILTIN_AGENT_INFO[agentId]).toEqual({
        name: AGENT_REGISTRY[agentId].name,
        description: AGENT_REGISTRY[agentId].description,
      });
    }
  });
});
