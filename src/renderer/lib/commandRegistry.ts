import type { ResolvedAgentCapabilities } from './agentCapabilities';
import { type CommandResult, SystemMessageFormatter } from './SystemMessageFormatter';

export interface CommandContext {
  args: string;
  sessionId: string;
  writeVirtual: (data: string) => void;
}

export type CommandHandler = (
  context: CommandContext
) => CommandResult | string | undefined | Promise<CommandResult | string | undefined>;

export interface CommandMetadata {
  description: string;
  usage?: string;
  aliases?: string[];
  examples?: string[];
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
  private aliasMap = new Map<string, string>();

  register(id: string, handler: CommandHandler, metadata: CommandMetadata): void {
    this.commands.set(id, { id, handler, metadata });
    if (metadata.aliases) {
      for (const alias of metadata.aliases) {
        this.aliasMap.set(alias, id);
      }
    }
  }

  getCommand(id: string): RegisteredCommand | undefined {
    const actualId = this.aliasMap.get(id) || id;
    return this.commands.get(actualId);
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
    // This is a special command handled by CommandProcessor/UI
    return {
      type: 'info',
      message: 'Resetting session...',
    };
  },
  {
    description: 'Reset the current agent session',
    usage: '/reset',
  }
);

commandRegistry.register(
  'help',
  ({ args }) => {
    const allCommands = commandRegistry.getAllCommands();

    if (args) {
      const cmd = commandRegistry.getCommand(args.trim());
      if (cmd) {
        return {
          type: 'info',
          title: `Help: /${cmd.id}`,
          message: cmd.metadata.description,
          sections: [
            { title: 'Usage', lines: [cmd.metadata.usage || `/${cmd.id}`] },
            ...(cmd.metadata.aliases
              ? [{ title: 'Aliases', lines: cmd.metadata.aliases.map((a) => `/${a}`) }]
              : []),
            ...(cmd.metadata.examples ? [{ title: 'Examples', lines: cmd.metadata.examples }] : []),
          ],
        };
      }
    }

    return {
      type: 'info',
      title: 'EnsoAI',
      message: 'Available local commands:',
      sections: [
        {
          lines: allCommands.map((cmd) => `/${cmd.id.padEnd(10)} - ${cmd.metadata.description}`),
        },
      ],
    };
  },
  {
    description: 'Show available local commands',
    usage: '/help [command]',
    aliases: ['?'],
  }
);

commandRegistry.register(
  'mcp',
  async () => {
    try {
      const mcpConfigs = await window.electronAPI.claudeConfig.mcp.read();
      const servers = Object.entries(mcpConfigs);

      if (servers.length === 0) {
        return {
          type: 'info',
          title: 'MCP Servers',
          message: 'No MCP servers configured.',
        };
      }

      return {
        type: 'info',
        title: 'MCP Servers',
        message: 'Configured MCP servers:',
        sections: [
          {
            lines: servers.map(([name, config]) => {
              const type = 'command' in config ? 'stdio' : 'http/sse';
              return `• ${name.padEnd(15)} [${type}]`;
            }),
          },
        ],
      };
    } catch (error) {
      return {
        type: 'error',
        title: 'MCP Error',
        message: 'Failed to load MCP configurations.',
      };
    }
  },
  {
    description: 'List configured MCP servers',
    usage: '/mcp',
  }
);

commandRegistry.register(
  'skills',
  async ({ args }) => {
    try {
      const snapshot = await window.electronAPI.claudeCompletions.get();
      const skills = snapshot.items.filter((item: any) => item.kind === 'skill');

      const trimmedArgs = args.trim();
      const parts = trimmedArgs.split(/\s+/);
      const subCommand = parts[0];
      const skillName = parts[1];

      // Case 1: /skills show <name>
      if (subCommand === 'show' && skillName) {
        const nameWithSlash = skillName.startsWith('/') ? skillName : `/${skillName}`;
        const skill = skills.find((s) => s.label === nameWithSlash);

        if (!skill) {
          return {
            type: 'error',
            title: 'Skill Not Found',
            message: `Could not find skill "${skillName}".`,
          };
        }

        return {
          type: 'info',
          title: `Skill: ${skill.label}`,
          message: skill.description || 'No description available.',
          sections: [
            {
              title: 'Details',
              lines: [`Source: ${skill.source}`],
            },
          ],
        };
      }

      // Case 2: /skills list (or default)
      if (skills.length === 0) {
        return {
          type: 'info',
          title: 'Skills',
          message: 'No skills found.',
        };
      }

      return {
        type: 'info',
        title: 'Skills',
        message: 'Available skills:',
        sections: [
          {
            lines: skills.map(
              (s) => `${s.label.padEnd(15)} - ${s.description || '(No description)'}`
            ),
          },
        ],
      };
    } catch (error) {
      return {
        type: 'error',
        title: 'Skills Error',
        message: 'Failed to load skills.',
      };
    }
  },
  {
    description: 'List or show skill details',
    usage: '/skills [list|show <name>]',
    aliases: ['skill'],
    examples: ['/skills list', '/skills show save-context'],
  }
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
