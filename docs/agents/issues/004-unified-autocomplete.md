## Parent
[PRD: Omni-Input Unified Command Orchestrator](docs/prds/2026-06-07-omni-input-unified-orchestrator.md)

## What to build
Expand the current slash-command autocomplete logic to be 'source-aware'. It should query the `CommandRegistry` for local commands and merge them with Agent-specific commands (resolved via Agent Capability). The UI should provide visual hints (e.g., different icons or labels) to help the user distinguish between local and remote commands.

## Acceptance criteria
- [ ] Autocomplete list includes both Local commands and Agent commands.
- [ ] Local commands are visually distinguished (e.g., different color or "App" badge).
- [ ] Descriptions from the `CommandRegistry` are displayed in the completion item.
- [ ] Keyboard navigation and selection work seamlessly for all command types.

## Blocked by
- [Issue 001: Command Registry and Router](docs/agents/issues/001-omni-input-registry-and-router.md)
