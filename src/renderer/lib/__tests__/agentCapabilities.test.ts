import { describe, expect, it } from 'vitest';
import {
  getEnhancedInputShortcutAction,
  resolveAgentCapabilities,
  shouldAutoOpenEnhancedInput,
  shouldHandleEnhancedInputShortcut,
  shouldRenderEnhancedInput,
  shouldUseSlashCommandCompletion,
} from '../agentCapabilities';

describe('resolveAgentCapabilities', () => {
  it('resolves Codex as supporting Enhanced Input', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(capabilities.enhancedInput.supported).toBe(true);
  });

  it('resolves Claude as supporting Enhanced Input with slash command completion and completion signal', () => {
    const capabilities = resolveAgentCapabilities('claude');

    expect(capabilities.enhancedInput.supported).toBe(true);
    expect(capabilities.enhancedInput.slashCommandCompletion).toBe(true);
    expect(capabilities.hasCompletionSignal).toBe(true);
  });

  it('resolves Codex as supporting Enhanced Input but without completion signal', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(capabilities.enhancedInput.supported).toBe(true);
    expect(capabilities.hasCompletionSignal).toBe(false);
  });

  it('resolves Gemini with prompt-with-arg image input mode', () => {
    const capabilities = resolveAgentCapabilities('gemini');

    expect(capabilities.enhancedInput.supported).toBe(true);
    expect(capabilities.enhancedInput.imageInput.mode).toBe('prompt_with_arg');
  });

  it('resolves environment Agent variants through their base Agent', () => {
    const capabilities = resolveAgentCapabilities('claude-hapi');

    expect(capabilities.enhancedInput.supported).toBe(true);
    expect(capabilities.enhancedInput.slashCommandCompletion).toBe(true);
  });

  it('resolves Custom and unknown Agents with default Enhanced Input support', () => {
    const custom = resolveAgentCapabilities('my-agent', {
      customAgents: [{ id: 'my-agent', name: 'My Agent', command: 'my-agent' }],
    });
    const unknown = resolveAgentCapabilities('new-agent');

    expect(custom.enhancedInput.supported).toBe(true);
    expect(custom.enhancedInput.imageInput.mode).toBe('append_to_prompt');
    expect(custom.enhancedInput.slashCommandCompletion).toBe(false);
    expect(unknown.enhancedInput.supported).toBe(true);
    expect(unknown.enhancedInput.imageInput.mode).toBe('append_to_prompt');
    expect(unknown.enhancedInput.slashCommandCompletion).toBe(false);
  });

  it('does not handle the Enhanced Input shortcut when the global setting is disabled', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(
      shouldHandleEnhancedInputShortcut({
        globalEnabled: false,
        capabilities,
      })
    ).toBe(false);
  });

  it('handles the Enhanced Input shortcut for supported Codex sessions when globally enabled', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(
      shouldHandleEnhancedInputShortcut({
        globalEnabled: true,
        capabilities,
      })
    ).toBe(true);
  });

  it('renders Enhanced Input for supported Codex sessions when globally enabled and open', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(
      shouldRenderEnhancedInput({
        globalEnabled: true,
        capabilities,
        open: true,
      })
    ).toBe(true);
  });

  it('does not render Enhanced Input when the global setting is disabled', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(
      shouldRenderEnhancedInput({
        globalEnabled: false,
        capabilities,
        open: true,
      })
    ).toBe(false);
  });

  it('uses slash command completion only for Agents that declare it', () => {
    expect(shouldUseSlashCommandCompletion(resolveAgentCapabilities('claude'))).toBe(true);
    expect(shouldUseSlashCommandCompletion(resolveAgentCapabilities('codex'))).toBe(false);
  });

  it('auto-opens Enhanced Input only when an Agent Completion Signal is available', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(
      shouldAutoOpenEnhancedInput({
        globalEnabled: true,
        capabilities,
        autoPopupMode: 'hideWhileRunning',
        hasCompletionSignal: false,
      })
    ).toBe(false);
    expect(
      shouldAutoOpenEnhancedInput({
        globalEnabled: true,
        capabilities,
        autoPopupMode: 'hideWhileRunning',
        hasCompletionSignal: true,
      })
    ).toBe(true);
  });

  it('asks the UI to notify when an Agent explicitly does not support Enhanced Input', () => {
    const capabilities = resolveAgentCapabilities('codex');

    expect(
      getEnhancedInputShortcutAction({
        globalEnabled: true,
        capabilities: {
          enhancedInput: {
            ...capabilities.enhancedInput,
            supported: false,
          },
        },
      })
    ).toBe('notify_unsupported');
  });
});
