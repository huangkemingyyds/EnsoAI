export type AgentInputAutoPopupMode = 'always' | 'hideWhileRunning' | 'manual';

export function canSelectAgentInputAutoPopupMode({
  mode: _mode,
  claudeStopHookEnabled: _claudeStopHookEnabled,
}: {
  mode: AgentInputAutoPopupMode;
  claudeStopHookEnabled: boolean;
}): boolean {
  return true;
}

export function shouldShowStopHookDependencyDialog({
  nextStopHookEnabled: _nextStopHookEnabled,
  agentInputAutoPopupMode: _agentInputAutoPopupMode,
}: {
  nextStopHookEnabled: boolean;
  agentInputAutoPopupMode: AgentInputAutoPopupMode;
}): boolean {
  return false;
}
