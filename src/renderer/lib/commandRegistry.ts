import type { ResolvedAgentCapabilities } from './agentCapabilities';

export interface CommandContext {
  args: string;
  sessionId: string;
  writeVirtual: (data: string) => void;
}

export type CommandHandler = (
  context: CommandContext
) => string | undefined | Promise<string | undefined>;

export interface CommandMetadata {
  description: string;
}

export interface RegisteredCommand {
  id: string;
  handler: CommandHandler;
  metadata: CommandMetadata;
}

export type RoutingType = 'LOCAL' | 'AGENT' | 'PROMPT';

export interface RoutingDecision {
  type: RoutingType;
  command?: string;
  args?: string;
}

export class CommandRegistry {
  private commands = new Map<string, RegisteredCommand>();

  register(id: string, handler: CommandHandler, metadata: CommandMetadata): void {
    this.commands.set(id, { id, handler, metadata });
  }

  getCommand(id: string): RegisteredCommand | undefined {
    return this.commands.get(id);
  }

  getAllCommands(): RegisteredCommand[] {
    return Array.from(this.commands.values());
  }
}

export const commandRegistry = new CommandRegistry();

// Register built-in commands
commandRegistry.register(
  'reset',
  () => {
    // This is a placeholder. Actual execution happens in the UI components
    // that have access to session lifecycle methods (AgentPanel/AgentTerminal).
  },
  { description: 'Reset the current agent session' }
);

commandRegistry.register(
  'help',
  ({ writeVirtual }) => {
    writeVirtual('\r\n\x1b[38;5;33m[EnsoAI]\x1b[0m Available local commands:\r\n');
    commandRegistry.getAllCommands().forEach((cmd) => {
      writeVirtual(`  \x1b[1m/${cmd.id}\x1b[0m - ${cmd.metadata.description}\r\n`);
    });
    writeVirtual('\r\n');
  },
  { description: 'Show available local commands' }
);

export function routeInput(
  input: string,
  options: {
    registry: CommandRegistry;
    agentCapabilities: ResolvedAgentCapabilities;
  }
): RoutingDecision {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { type: 'PROMPT' };
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const commandId = parts[0];
  const args = parts.slice(1).join(' ');

  if (options.registry.getCommand(commandId)) {
    return { type: 'LOCAL', command: commandId, args };
  }

  if (options.agentCapabilities.enhancedInput?.slashCommandCompletion) {
    return { type: 'AGENT', command: commandId, args };
  }

  return { type: 'PROMPT' };
}
