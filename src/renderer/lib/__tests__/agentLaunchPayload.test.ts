import { describe, expect, it } from 'vitest';
import { resolveAgentCapabilities } from '../agentCapabilities';
import { planAgentLaunchPayload, shouldPlanAgentLaunchPayload } from '../agentLaunchPayload';

describe('planAgentLaunchPayload', () => {
  it('plans cli_arg image arguments with the declared template for session launch', () => {
    const capabilities = resolveAgentCapabilities('codex');

    const plan = planAgentLaunchPayload({
      capabilities: {
        enhancedInput: {
          ...capabilities.enhancedInput,
          imageInput: {
            supported: true,
            mode: 'cli_arg',
            injectionTemplate: '--file %path%',
          },
        },
      },
      prompt: 'Describe this image',
      imagePaths: ['C:\\screenshots\\main view.png'],
      platform: 'win32',
    });

    expect(plan).toEqual({
      ok: true,
      promptArg: '"Describe this image"',
      imageArgs: ['--file "C:\\\\screenshots\\\\main view.png"'],
    });
  });

  it('plans a Windows launch prompt argument with multiline content collapsed', () => {
    const capabilities = resolveAgentCapabilities('codex');

    const plan = planAgentLaunchPayload({
      capabilities,
      prompt: 'Review this\nscreen',
      imagePaths: [],
      platform: 'win32',
    });

    expect(plan).toEqual({
      ok: true,
      promptArg: '"Review this screen"',
      imageArgs: [],
    });
  });

  it('plans launch payloads when the user starts a session with images only', () => {
    expect(shouldPlanAgentLaunchPayload({ prompt: '', imagePaths: ['screen.png'] })).toBe(true);
    expect(shouldPlanAgentLaunchPayload({ prompt: undefined, imagePaths: ['screen.png'] })).toBe(
      true
    );
    expect(shouldPlanAgentLaunchPayload({ prompt: '', imagePaths: [] })).toBe(false);
  });
});
