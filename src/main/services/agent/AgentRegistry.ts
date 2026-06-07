import { AGENT_REGISTRY } from '@shared/constants/agents';
import type { AgentMetadata } from '@shared/types';

export const BUILTIN_AGENTS: AgentMetadata[] = Object.values(AGENT_REGISTRY);

export class AgentRegistry {
  private agents: Map<string, AgentMetadata>;

  constructor(builtinAgents: AgentMetadata[] = BUILTIN_AGENTS) {
    this.agents = new Map(builtinAgents.map((a) => [a.id, a]));
  }

  list(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  get(id: string): AgentMetadata | undefined {
    return this.agents.get(id);
  }

  register(agent: AgentMetadata): void {
    this.agents.set(agent.id, agent);
  }

  unregister(id: string): void {
    this.agents.delete(id);
  }
}
