export type EnhancedInputImageMode = 'append_to_prompt' | 'cli_arg' | 'prompt_with_arg';

export interface EnhancedInputCapability {
  supported: boolean;
  imageInput?: {
    supported: boolean;
    mode: EnhancedInputImageMode;
    /** Template for injecting image paths into a running session, e.g. "/image %path%" */
    injectionTemplate?: string;
  };
  multiline?: boolean;
  slashCommandCompletion?: boolean;
}

export interface AgentCapabilities {
  chat: boolean;
  codeEdit: boolean;
  terminal: boolean;
  fileRead: boolean;
  fileWrite: boolean;
  enhancedInput?: EnhancedInputCapability;
  /** Configuration for detecting when an agent has finished its task */
  completionDetection?: {
    /** Whether to use WebSocket stop hook (Claude-specific) */
    useWebSocket?: boolean;
    /** Regex pattern to match in PTY output to signal completion (e.g. prompt) */
    outputPattern?: string;
    /** Silence timeout in milliseconds before marking as idle */
    idleMs?: number;
    /** Minimum duration in milliseconds the agent must run before completion detection arms */
    minRunningMs?: number;
  };
  /** Configuration for controlling the session life-cycle */
  sessionControl?: {
    /** Whether the session can be reset (killed and restarted) */
    canReset?: boolean;
    /** Whether to automatically clean up temporary input files (.ensoai-input) on session end */
    autoCleanup?: boolean;
  };
  /** Whether the agent provides a reliable completion signal (e.g. Stop Hook or output-pattern adapter) */
  hasCompletionSignal?: boolean;
}

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  binary: string;
  command?: string;
  defaultModel?: string;
  capabilities: AgentCapabilities;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input?: unknown;
  output?: unknown;
}

export interface AgentSession {
  id: string;
  agentId: string;
  workdir: string;
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Task completion marker used in auto-execute mode */
export const TASK_COMPLETION_MARKER = '[ENSO_TASK_COMPLETE]';

/** Data sent with agent stop notification */
export interface AgentStopNotificationData {
  sessionId: string;
  cwd?: string;
  /** Task completion status from session log analysis */
  taskCompletionStatus?: 'completed' | 'unknown';
}
