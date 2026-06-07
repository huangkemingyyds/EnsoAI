## Parent
[PRD: Omni-Input Unified Command Orchestrator](docs/prds/2026-06-07-omni-input-unified-orchestrator.md)

## What to build
Implement the core `CommandRegistry` and `CommandRouter` logic in the renderer. This is the foundation of the Omni-Input system, responsible for maintaining a list of available commands and determining whether a given input string is a Local Client command, an Agent-specific command, or a standard Chat prompt.

The Registry should allow registration of command handlers (local functions) and metadata (description, target). The Router should parse the input (sniffing the first token) and return a routing decision.

## Acceptance criteria
- [ ] `CommandRegistry` supports registering and retrieving local commands.
- [ ] `CommandRouter` accurately identifies `/` prefixed tokens.
- [ ] Unit tests verify correct routing for:
    - Registered local commands (e.g., `/reset`) -> `LOCAL`
    - Known agent commands (e.g., `/fix`) -> `AGENT`
    - Unknown text -> `PROMPT`
- [ ] The implementation is decoupled from UI components.

## Blocked by
None - can start immediately.
