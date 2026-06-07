import { describe, expect, it, vi } from 'vitest';
import { CommandRegistry, routeInput } from '../commandRegistry';

describe('CommandRegistry', () => {
  it('should register and retrieve a command', () => {
    const registry = new CommandRegistry();
    const handler = vi.fn();
    const metadata = { description: 'Test command' };

    registry.register('test', handler, metadata);

    const command = registry.getCommand('test');
    expect(command).toBeDefined();
    expect(command?.id).toBe('test');
    expect(command?.handler).toBe(handler);
    expect(command?.metadata.description).toBe('Test command');
  });

  it('should return undefined for unregistered commands', () => {
    const registry = new CommandRegistry();
    expect(registry.getCommand('unknown')).toBeUndefined();
  });
});

describe('routeInput', () => {
  const registry = new CommandRegistry();
  registry.register('reset', vi.fn(), { description: 'Reset session' });

  it('should route plain text as PROMPT', () => {
    const decision = routeInput('Hello world', {
      registry,
      agentCapabilities: { enhancedInput: { slashCommandCompletion: true } } as any,
    });
    expect(decision.type).toBe('PROMPT');
  });

  it('should route registered command as LOCAL', () => {
    const decision = routeInput('/reset', {
      registry,
      agentCapabilities: { enhancedInput: { slashCommandCompletion: true } } as any,
    });
    expect(decision.type).toBe('LOCAL');
    expect(decision.command).toBe('reset');
  });

  it('should route registered command with args as LOCAL', () => {
    const decision = routeInput('/reset now', {
      registry,
      agentCapabilities: { enhancedInput: { slashCommandCompletion: true } } as any,
    });
    expect(decision.type).toBe('LOCAL');
    expect(decision.command).toBe('reset');
    expect(decision.args).toBe('now');
  });

  it('should route unknown command as AGENT if agent supports slash commands', () => {
    const decision = routeInput('/explain', {
      registry,
      agentCapabilities: { enhancedInput: { slashCommandCompletion: true } } as any,
    });
    expect(decision.type).toBe('AGENT');
    expect(decision.command).toBe('explain');
  });

  it('should route unknown command as PROMPT if agent DOES NOT support slash commands', () => {
    const decision = routeInput('/unknown', {
      registry,
      agentCapabilities: { enhancedInput: { slashCommandCompletion: false } } as any,
    });
    expect(decision.type).toBe('PROMPT');
  });
});
