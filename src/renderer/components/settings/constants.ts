import { AGENT_REGISTRY, BUILTIN_AGENT_IDS, type BuiltinAgentId } from '@shared/constants/agents';
import type { FontWeight } from '@/stores/settings';

export type SettingsCategory =
  | 'general'
  | 'appearance'
  | 'editor'
  | 'keybindings'
  | 'agent'
  | 'ai'
  | 'integration'
  | 'hapi'
  | 'webInspector';

export const fontWeightOptions: { value: FontWeight; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: '100', label: '100 (Thin)' },
  { value: '200', label: '200 (Extra Light)' },
  { value: '300', label: '300 (Light)' },
  { value: '400', label: '400 (Regular)' },
  { value: '500', label: '500 (Medium)' },
  { value: '600', label: '600 (Semi Bold)' },
  { value: '700', label: '700 (Bold)' },
  { value: '800', label: '800 (Extra Bold)' },
  { value: '900', label: '900 (Black)' },
  { value: 'bold', label: 'Bold' },
];

// Auto save delay default (in milliseconds)
export const AUTO_SAVE_DELAY_DEFAULT = 1000;

export const BUILTIN_AGENT_INFO: Record<BuiltinAgentId, { name: string; description: string }> =
  Object.fromEntries(
    BUILTIN_AGENT_IDS.map((agentId) => [
      agentId,
      {
        name: AGENT_REGISTRY[agentId].name,
        description: AGENT_REGISTRY[agentId].description,
      },
    ])
  ) as Record<BuiltinAgentId, { name: string; description: string }>;

export const BUILTIN_AGENTS: BuiltinAgentId[] = [...BUILTIN_AGENT_IDS];
