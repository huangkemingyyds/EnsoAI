import type {
  AgentCapabilities,
  EnhancedInputCapability,
  EnhancedInputImageMode,
} from '../types/agent';

export interface AgentMetadata {
  id: string;
  name: string;
  command: string;
  description: string;
  icon: string;
  capabilities: AgentCapabilities;
  /** Regex pattern to detect agent prompt completion in terminal output */
  completionPattern?: string;
}

export const BUILTIN_AGENT_IDS = [
  'claude',
  'codex',
  'gemini',
  'droid',
  'auggie',
  'cursor',
  'opencode',
  'pi',
] as const;
export type BuiltinAgentId = (typeof BUILTIN_AGENT_IDS)[number];

const DEFAULT_ENHANCED_INPUT: Required<EnhancedInputCapability> = {
  supported: true,
  multiline: true,
  imageInput: {
    supported: true,
    mode: 'append_to_prompt' as EnhancedInputImageMode,
    injectionTemplate: undefined,
  },
  slashCommandCompletion: false,
};

const DEFAULT_CAPABILITIES: AgentCapabilities = {
  chat: true,
  codeEdit: true,
  terminal: true,
  fileRead: true,
  fileWrite: true,
  enhancedInput: DEFAULT_ENHANCED_INPUT,
  hasCompletionSignal: false,
};

export const AGENT_REGISTRY: Record<string, AgentMetadata> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    command: 'claude',
    description: 'Anthropic Claude Code CLI',
    icon: 'claude',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      enhancedInput: {
        ...DEFAULT_ENHANCED_INPUT,
        slashCommandCompletion: true,
      },
      hasCompletionSignal: true,
    },
    // Claude uses Stop Hook (WebSocket), but we can have a fallback pattern
    completionPattern: '^[\\s\\S]*?([\\$\\?]\\s*)$',
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    description: 'EnsoAI Codex CLI',
    icon: 'codex',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      enhancedInput: DEFAULT_ENHANCED_INPUT,
    },
    completionPattern: '^[\\s\\S]*?([\\$\\?]\\s*)$',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    command: 'gemini',
    description: 'Google Gemini CLI',
    icon: 'gemini',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      enhancedInput: {
        ...DEFAULT_ENHANCED_INPUT,
        imageInput: {
          supported: true,
          mode: 'prompt_with_arg',
          injectionTemplate: undefined,
        },
      },
    },
    completionPattern: '^[\\s\\S]*?([\\>\\?]\\s*)$',
  },
  // Add other builtin agents with defaults
  ...BUILTIN_AGENT_IDS.filter((id) => !['claude', 'codex', 'gemini'].includes(id)).reduce(
    (acc, id) => {
      acc[id] = {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        command: id === 'cursor' ? 'cursor-agent' : id,
        description: `${id.charAt(0).toUpperCase() + id.slice(1)} Agent`,
        icon: id,
        capabilities: DEFAULT_CAPABILITIES,
        completionPattern: '^[\\s\\S]*?([\\$\\?\\>]\\s*)$',
      };
      return acc;
    },
    {} as Record<string, AgentMetadata>
  ),
};
