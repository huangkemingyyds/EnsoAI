import type { AgentCapabilities, EnhancedInputCapability } from '@shared/types';

export interface ResolveAgentCapabilitiesOptions {
  customAgents?: Array<{ id: string; name: string; command: string }>;
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
    useWebSocket: false,
    idleMs: 3000,
    minRunningMs: 1000,
  },
  sessionControl: {
    canReset: true,
    autoCleanup: true,
  },
  hasCompletionSignal: false,
};

const BUILTIN_CAPABILITY_OVERRIDES: Record<string, Partial<ResolvedAgentCapabilities>> = {
  claude: {
    enhancedInput: {
      ...DEFAULT_ENHANCED_INPUT,
      slashCommandCompletion: true,
    },
    completionDetection: {
      useWebSocket: true,
    },
    sessionControl: {
      canReset: true,
      autoCleanup: true,
    },
    hasCompletionSignal: true,
  },
  codex: {
    enhancedInput: DEFAULT_ENHANCED_INPUT,
    completionDetection: {
      outputPattern: '(?m)^>\\s*$', // Standard Codex prompt
      idleMs: 2000,
    },
    sessionControl: {
      canReset: true,
      autoCleanup: true,
    },
  },
  gemini: {
    enhancedInput: {
      ...DEFAULT_ENHANCED_INPUT,
      imageInput: {
        supported: true,
        mode: 'prompt_with_arg',
      },
    },
    completionDetection: {
      outputPattern: '(?m)^>\\s*$', // Standard Gemini prompt
      idleMs: 2000,
    },
    sessionControl: {
      canReset: true,
      autoCleanup: true,
    },
  },
};

export function getBaseAgentId(agentId: string): string {
  if (!agentId) return 'claude';
  return agentId.replace(/-(hapi|happy)$/, '');
}

export function resolveAgentCapabilities(
  agentId: string,
  _options: ResolveAgentCapabilitiesOptions = {}
): ResolvedAgentCapabilities {
  if (!agentId) return DEFAULT_CAPABILITIES;
  const baseAgentId = getBaseAgentId(agentId);
  const override = BUILTIN_CAPABILITY_OVERRIDES[baseAgentId] ?? {};

  return {
    ...DEFAULT_CAPABILITIES,
    ...override,
    enhancedInput: {
      ...DEFAULT_CAPABILITIES.enhancedInput,
      ...override.enhancedInput,
      imageInput: {
        ...DEFAULT_CAPABILITIES.enhancedInput.imageInput,
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
  open,
}: {
  globalEnabled: boolean;
  capabilities: Pick<ResolvedAgentCapabilities, 'enhancedInput'>;
  open: boolean;
}): boolean {
  return open && shouldHandleEnhancedInputShortcut({ globalEnabled, capabilities });
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
