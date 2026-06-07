import { AGENT_REGISTRY } from '@shared/constants/agents';
import type { AgentCapabilities, EnhancedInputCapability } from '@shared/types';

export interface ResolveAgentCapabilitiesOptions {
  customAgents?: Array<{
    id: string;
    name: string;
    command: string;
    capabilities?: Partial<AgentCapabilities>;
  }>;
  agentSettings?: Record<string, unknown>;
}

export interface ResolvedAgentCapabilities extends Omit<AgentCapabilities, 'enhancedInput'> {
  enhancedInput: Required<EnhancedInputCapability> & {
    imageInput: NonNullable<EnhancedInputCapability['imageInput']>;
  };
  completionDetection: NonNullable<AgentCapabilities['completionDetection']>;
  sessionControl: NonNullable<AgentCapabilities['sessionControl']>;
  hasCompletionSignal: boolean;
}

const DEFAULT_ENHANCED_INPUT: ResolvedAgentCapabilities['enhancedInput'] = {
  supported: true,
  multiline: true,
  imageInput: {
    supported: true,
    mode: 'append_to_prompt',
  },
  slashCommandCompletion: false,
};

const DEFAULT_CAPABILITIES: ResolvedAgentCapabilities = {
  chat: true,
  codeEdit: true,
  terminal: true,
  fileRead: true,
  fileWrite: true,
  enhancedInput: DEFAULT_ENHANCED_INPUT,
  completionDetection: {
    outputPattern: '^[\\s\\S]*?([\\$\\?\\>]\\s*)$',
    idleMs: 3000,
    minRunningMs: 1000,
  },
  sessionControl: {
    canReset: true,
    autoCleanup: true,
  },
  hasCompletionSignal: true,
};

const CONSERVATIVE_ENHANCED_INPUT: ResolvedAgentCapabilities['enhancedInput'] = {
  ...DEFAULT_ENHANCED_INPUT,
  imageInput: {
    supported: false,
    mode: 'append_to_prompt',
  },
};

const CONSERVATIVE_CAPABILITIES: ResolvedAgentCapabilities = {
  ...DEFAULT_CAPABILITIES,
  enhancedInput: CONSERVATIVE_ENHANCED_INPUT,
};

export function getBaseAgentId(agentId: string): string {
  if (!agentId) return 'claude';
  return agentId.replace(/-(hapi|happy)$/, '');
}

export function resolveAgentCapabilities(
  agentId: string,
  options: ResolveAgentCapabilitiesOptions = {}
): ResolvedAgentCapabilities {
  if (!agentId) return DEFAULT_CAPABILITIES;
  const baseAgentId = getBaseAgentId(agentId);
  const builtInCapabilities = AGENT_REGISTRY[baseAgentId]?.capabilities;
  const customCapabilities = options.customAgents?.find(
    (agent) => agent.id === baseAgentId
  )?.capabilities;
  const baseCapabilities = builtInCapabilities ? DEFAULT_CAPABILITIES : CONSERVATIVE_CAPABILITIES;
  const override = builtInCapabilities ?? customCapabilities ?? {};

  return {
    ...baseCapabilities,
    ...override,
    enhancedInput: {
      ...baseCapabilities.enhancedInput,
      ...override.enhancedInput,
      imageInput: {
        ...baseCapabilities.enhancedInput.imageInput,
        ...override.enhancedInput?.imageInput,
      },
    },
  };
}

export function shouldHandleEnhancedInputShortcut({
  globalEnabled,
  capabilities,
}: {
  globalEnabled: boolean;
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
}): boolean {
  return getEnhancedInputShortcutAction({ globalEnabled, capabilities }) === 'toggle';
}

export function getEnhancedInputShortcutAction({
  globalEnabled,
  capabilities,
}: {
  globalEnabled: boolean;
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
}): 'toggle' | 'notify_unsupported' | 'pass_through' {
  if (!globalEnabled) return 'pass_through';
  return capabilities.enhancedInput.supported ? 'toggle' : 'notify_unsupported';
}

export function shouldRenderEnhancedInput({
  globalEnabled,
  capabilities,
}: {
  globalEnabled: boolean;
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
}): boolean {
  return shouldHandleEnhancedInputShortcut({ globalEnabled, capabilities });
}

export function shouldUseSlashCommandCompletion({
  enhancedInput,
}: Pick<ResolvedAgentCapabilities, 'enhancedInput'>): boolean {
  return enhancedInput.supported && enhancedInput.slashCommandCompletion;
}

export function shouldAutoOpenEnhancedInput({
  globalEnabled,
  capabilities,
  autoPopupMode,
  hasCompletionSignal,
}: {
  globalEnabled: boolean;
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
  autoPopupMode: 'always' | 'hideWhileRunning' | 'manual';
  hasCompletionSignal: boolean;
}): boolean {
  if (!shouldHandleEnhancedInputShortcut({ globalEnabled, capabilities })) return false;
  if (autoPopupMode === 'manual') return false;
  if (autoPopupMode === 'always') return true;
  return hasCompletionSignal;
}
