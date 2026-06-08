import type { AgentCapabilities, AgentMetadata, EnhancedInputCapability } from '../types/agent';

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
    mode: 'append_to_prompt',
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

const DEFAULT_AGENT_METADATA: Record<
  Exclude<BuiltinAgentId, 'claude' | 'codex' | 'gemini'>,
  { name: string; command: string; description: string }
> = {
  droid: { name: 'Droid', command: 'droid', description: 'Droid AI CLI' },
  auggie: { name: 'Auggie', command: 'auggie', description: 'Augment Code CLI' },
  cursor: { name: 'Cursor', command: 'cursor-agent', description: 'Cursor Agent CLI' },
  opencode: { name: 'OpenCode', command: 'opencode', description: 'OpenCode AI CLI' },
  pi: { name: 'Pi', command: 'pi', description: 'Pi Coding Agent CLI' },
};

export const AGENT_REGISTRY: Record<string, AgentMetadata> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    command: 'claude',
    binary: 'claude',
    description: 'Anthropic Claude Code CLI',
    icon: 'claude',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      enhancedInput: {
        ...DEFAULT_ENHANCED_INPUT,
        slashCommandCompletion: true,
      },
      completionDetection: {
        useWebSocket: true,
        outputPattern: '^[\\s\\S]*?([\\$\\?]\\s*)$',
        idleMs: 3000,
        minRunningMs: 1000,
      },
      hasCompletionSignal: true,
    },
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    command: 'codex',
    binary: 'codex',
    description: 'OpenAI Codex CLI',
    icon: 'codex',
    capabilities: {
      ...DEFAULT_CAPABILITIES,
      enhancedInput: DEFAULT_ENHANCED_INPUT,
      completionDetection: {
        outputPattern: '(?m)^(?:>\\s*$|\\u203a(?:\\s.*)?$)',
        idleMs: 2000,
        minRunningMs: 1000,
      },
      hasCompletionSignal: true,
    },
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    command: 'gemini',
    binary: 'gemini',
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
      completionDetection: {
        outputPattern: '(?m)^>\\s*$',
        idleMs: 2000,
        minRunningMs: 1000,
      },
      hasCompletionSignal: true,
    },
  },
  // Add other builtin agents with defaults
  ...Object.entries(DEFAULT_AGENT_METADATA).reduce(
    (acc, [id, metadata]) => {
      acc[id] = {
        id,
        name: metadata.name,
        command: metadata.command,
        binary: metadata.command,
        description: metadata.description,
        icon: id,
        capabilities: DEFAULT_CAPABILITIES,
      };
      return acc;
    },
    {} as Record<string, AgentMetadata>
  ),
};
