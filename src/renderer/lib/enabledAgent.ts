import { resolveAgentLaunchTarget } from './agentLaunchTarget';

export interface ResolvedAgent {
  agentId: string;
  name: string;
  command: string;
  isDefault: boolean;
  environment: 'native' | 'hapi' | 'happy';
  customPath?: string;
  customArgs?: string;
}

/** Resolve an agentId into display name, command, environment, and custom settings. */
export function resolveEnabledAgent(
  agentId: string,
  agentSettings: Record<
    string,
    { enabled?: boolean; isDefault?: boolean; customPath?: string; customArgs?: string }
  >,
  customAgents: { id: string; name: string; command: string }[]
): ResolvedAgent {
  const target = resolveAgentLaunchTarget({
    agentId,
    customAgents,
    agentSettings: Object.fromEntries(
      Object.entries(agentSettings).map(([id, config]) => [
        id,
        {
          enabled: !!config.enabled,
          isDefault: !!config.isDefault,
          customPath: config.customPath,
          customArgs: config.customArgs,
        },
      ])
    ),
  });

  return {
    agentId: target.agentId,
    name: target.name,
    command: target.command,
    isDefault: !!agentSettings[agentId]?.isDefault,
    environment: target.environment,
    customPath: target.customPath,
    customArgs: target.customArgs,
  };
}
