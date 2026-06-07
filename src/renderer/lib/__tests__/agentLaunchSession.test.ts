import { describe, expect, it } from 'vitest';
import {
  createAgentLaunchSession,
  createInitializedSessionUpdates,
  hasPendingLaunchPayload,
} from '../agentLaunchSession';

describe('createAgentLaunchSession', () => {
  it('creates a new Agent Session carrying a first prompt and launch image payload', () => {
    const session = createAgentLaunchSession({
      id: 'session-1',
      repoPath: 'F:\\workspace\\EnsoAI',
      cwd: 'F:\\workspace\\EnsoAI',
      agentId: 'codex',
      agentCommand: 'codex',
      name: 'Codex',
      prompt: 'Describe this screen',
      imagePaths: ['F:\\workspace\\EnsoAI\\.ensoai-input\\screen.png'],
    });

    expect(session).toMatchObject({
      id: 'session-1',
      sessionId: 'session-1',
      name: 'Codex',
      agentId: 'codex',
      agentCommand: 'codex',
      initialized: false,
      repoPath: 'F:\\workspace\\EnsoAI',
      cwd: 'F:\\workspace\\EnsoAI',
      pendingCommand: 'Describe this screen',
      pendingImagePaths: ['F:\\workspace\\EnsoAI\\.ensoai-input\\screen.png'],
    });
  });

  it('clears launch payload fields after the Agent Session initializes', () => {
    expect(createInitializedSessionUpdates()).toEqual({
      initialized: true,
      pendingCommand: undefined,
      pendingImagePaths: undefined,
    });
  });

  it('detects image-only launch payloads as pending work', () => {
    expect(hasPendingLaunchPayload({ pendingCommand: '', pendingImagePaths: ['screen.png'] })).toBe(
      true
    );
    expect(
      hasPendingLaunchPayload({ pendingCommand: 'Describe this', pendingImagePaths: [] })
    ).toBe(true);
    expect(hasPendingLaunchPayload({ pendingCommand: '', pendingImagePaths: [] })).toBe(false);
  });
});
