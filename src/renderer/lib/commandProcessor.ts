import type { ResolvedAgentCapabilities } from './agentCapabilities';
import { commandRegistry, routeInput } from './commandRegistry';
import { type CommandResult, SystemMessageFormatter } from './SystemMessageFormatter';

export interface ProcessedInput {
  type: 'LOCAL' | 'AGENT' | 'PROMPT';
  content: string;
  imagePaths: string[];
  executeLocal?: () => Promise<void> | void;
}

export interface ProcessorOptions {
  sessionId: string;
  agentCapabilities: ResolvedAgentCapabilities;
  writeVirtual: (data: string) => void;
  onResetSession?: () => void;
}

export async function processOmniInput(
  content: string,
  imagePaths: string[],
  options: ProcessorOptions
): Promise<ProcessedInput> {
  const trimmed = content.trim();

  // 1. Handle Pipeline: /cmd | prompt
  const pipeIndex = trimmed.indexOf('|');
  if (pipeIndex !== -1 && trimmed.startsWith('/')) {
    const leftPart = trimmed.slice(0, pipeIndex).trim();
    const rightPart = trimmed.slice(pipeIndex + 1).trim();

    const decision = routeInput(leftPart, {
      registry: commandRegistry,
      agentCapabilities: options.agentCapabilities,
    });

    if (decision.type === 'LOCAL') {
      const command = commandRegistry.getCommand(decision.command!);
      if (command) {
        // Special case for reset in pipeline (if we want to allow it)
        if (decision.command === 'reset') {
          return {
            type: 'LOCAL',
            content,
            imagePaths,
            executeLocal: () => options.onResetSession?.(),
          };
        }

        const rawOutput = await command.handler({
          args: decision.args || '',
          sessionId: options.sessionId,
          writeVirtual: options.writeVirtual,
        });

        const output =
          typeof rawOutput === 'string'
            ? rawOutput
            : rawOutput
              ? SystemMessageFormatter.format(rawOutput)
              : undefined;

        // Continue as AGENT prompt with injected context
        const injectedContent = output
          ? `${rightPart}\n\n[Context from ${leftPart}]\n${output}`
          : rightPart;

        return {
          type: 'AGENT',
          content: injectedContent,
          imagePaths,
        };
      }
    }
  }

  // 2. Handle standard LOCAL commands
  const decision = routeInput(content, {
    registry: commandRegistry,
    agentCapabilities: options.agentCapabilities,
  });

  if (decision.type === 'LOCAL') {
    return {
      type: 'LOCAL',
      content,
      imagePaths,
      executeLocal: async () => {
        const command = commandRegistry.getCommand(decision.command!);
        if (!command) return;

        const result = await command.handler({
          args: decision.args || '',
          sessionId: options.sessionId,
          writeVirtual: options.writeVirtual,
        });

        // UI-bound actions
        if (decision.command === 'reset') {
          options.onResetSession?.();
        }

        if (result) {
          const formatted =
            typeof result === 'string' ? result : SystemMessageFormatter.format(result);
          options.writeVirtual(formatted);
        }
      },
    };
  }

  // 3. Handle @mcp: tags injection
  let finalContent = content;
  const mcpMatches = Array.from(content.matchAll(/@mcp:([\w-]+)/g));
  if (mcpMatches.length > 0) {
    try {
      const mcpConfigs = await window.electronAPI.claudeConfig.mcp.read();
      for (const match of mcpMatches) {
        const serverName = match[1];
        const config = mcpConfigs[serverName];
        if (config) {
          const mcpData = `[Context from MCP server ${serverName}: ${JSON.stringify(config)}]`;
          finalContent = finalContent.replace(match[0], mcpData);
        } else {
          options.writeVirtual(
            `\r\n\x1b[33mWarning: MCP server "${serverName}" not found.\x1b[0m\r\n`
          );
        }
      }
    } catch (error) {
      console.error('[commandProcessor] Failed to read MCP configs:', error);
      options.writeVirtual('\r\n\x1b[31mError: Failed to read MCP configurations.\x1b[0m\r\n');
    }
  }

  return {
    type: decision.type, // AGENT or PROMPT
    content: finalContent,
    imagePaths,
  };
}
