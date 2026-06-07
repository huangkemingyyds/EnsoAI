import { AGENT_REGISTRY } from '@shared/constants/agents';

export interface AgentLaunchTarget {
  agentId: string;
  baseAgentId: string;
  name: string;
  command: string;
  customPath?: string;
  customArgs?: string;
  environment: 'native' | 'hapi' | 'happy';
}

export interface ResolveAgentLaunchTargetOptions {
  agentId: string;
  customAgents: Array<{ id: string; name: string; command: string }>;
  agentSettings: Record<
    string,
    { enabled: boolean; isDefault: boolean; customPath?: string; customArgs?: string }
  >;
}

function splitEnvironmentAgentId(agentId: string): {
  baseAgentId: string;
  environment: AgentLaunchTarget['environment'];
} {
  if (agentId.endsWith('-hapi')) {
    return { baseAgentId: agentId.slice(0, -5), environment: 'hapi' };
  }
  if (agentId.endsWith('-happy')) {
    return { baseAgentId: agentId.slice(0, -6), environment: 'happy' };
  }
  return { baseAgentId: agentId, environment: 'native' };
}

export function resolveAgentLaunchTarget({
  agentId,
  customAgents,
  agentSettings,
}: ResolveAgentLaunchTargetOptions): AgentLaunchTarget {
  const { baseAgentId, environment } = splitEnvironmentAgentId(agentId);
  const customAgent = customAgents.find((agent) => agent.id === baseAgentId);
  const builtInAgent = AGENT_REGISTRY[baseAgentId];
  const baseName = customAgent?.name ?? builtInAgent?.name ?? baseAgentId;
  const command =
    customAgent?.command ?? builtInAgent?.command ?? builtInAgent?.binary ?? baseAgentId;
  const name =
    environment === 'hapi'
      ? `${baseName} (Hapi)`
      : environment === 'happy'
        ? `${baseName} (Happy)`
        : baseName;
  const agentConfig = agentSettings[baseAgentId];

  return {
    agentId,
    baseAgentId,
    name,
    command,
    customPath: agentConfig?.customPath,
    customArgs: agentConfig?.customArgs,
    environment,
  };
}
