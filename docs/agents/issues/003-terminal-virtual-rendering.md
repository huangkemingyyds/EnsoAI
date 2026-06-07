## Parent
[PRD: Omni-Input Unified Command Orchestrator](docs/prds/2026-06-07-omni-input-unified-orchestrator.md)

## What to build
Enable the terminal to display local command execution results without sending them to the PTY or polluting the Agent's context. This involves introducing a `VirtualMessage` data type that the terminal renderer (Xterm.js) can intercept and display using a distinct visual style (e.g., a "System" or "EnsoAI" prefix with custom colors).

## Acceptance criteria
- [ ] Terminal supports rendering 'virtual' messages that are NOT part of the PTY stream.
- [ ] Virtual messages have a clear visual distinction from Agent/User output.
- [ ] Local commands (like a future `/mcp list`) can write their output to this virtual layer.
- [ ] Virtual messages do not trigger 'Agent Running' states or completion signals.

## Blocked by
- [Issue 002: Enhanced Input Interception & /reset Validation](docs/agents/issues/002-enhanced-input-interception-reset.md)
