## Parent
[PRD: Omni-Input Unified Command Orchestrator](docs/prds/2026-06-07-omni-input-unified-orchestrator.md)

## What to build
Integrate the `CommandRouter` into the `EnhancedInputContainer`'s `onSend` flow. Instead of always forwarding text to the PTY, the container should now query the Router first. If a `LOCAL` routing decision is made, the corresponding handler in the Registry should be executed, and the PTY write should be suppressed.

As a 'tracer bullet', implement the `/reset` command end-to-end using this new flow to clear the current session.

## Acceptance criteria
- [ ] `EnhancedInputContainer` intercepts local commands before PTY write.
- [ ] `/reset` command correctly triggers the session reset logic from the Enhanced Input.
- [ ] Standard text still flows to the Agent/PTY without regression.
- [ ] Error handling for failed local command execution (e.g., showing a toast).

## Blocked by
- [Issue 001: Command Registry and Router](docs/agents/issues/001-omni-input-registry-and-router.md)
