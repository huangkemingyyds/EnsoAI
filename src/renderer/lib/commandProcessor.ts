import type { ResolvedAgentCapabilities } from './agentCapabilities';
import { commandRegistry, routeInput } from './commandRegistry';

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
        if (decision.command === 'reset') {
          return {
            type: 'LOCAL',
            content,
            imagePaths,
            executeLocal: () => options.onResetSession?.(),
          };
        }

        const output = await command.handler({
          args: decision.args || '',
          sessionId: options.sessionId,
          writeVirtual: options.writeVirtual,
        });

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
      executeLocal: () => {
        if (decision.command === 'reset') {
          options.onResetSession?.();
        } else {
          const command = commandRegistry.getCommand(decision.command!);
          return command?.handler({
            args: decision.args || '',
            sessionId: options.sessionId,
            writeVirtual: options.writeVirtual,
          });
        }
      },
    };
  }

  // 3. Handle @mcp: tags injection
  let finalContent = content;
  const mcpMatches = Array.from(content.matchAll(/@mcp:([\w-]+)/g));
  if (mcpMatches.length > 0) {
    for (const match of mcpMatches) {
      const serverName = match[1];
      // Placeholder for actual MCP data fetching
      const mcpData = `[Sample data from MCP server ${serverName}]`;
      finalContent = finalContent.replace(match[0], mcpData);
    }
  }

  return {
    type: decision.type, // AGENT or PROMPT
    content: finalContent,
    imagePaths,
  };
}
