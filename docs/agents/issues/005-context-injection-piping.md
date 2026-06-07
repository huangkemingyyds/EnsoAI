## Parent
[PRD: Omni-Input Unified Command Orchestrator](docs/prds/2026-06-07-omni-input-unified-orchestrator.md)

## What to build
Implement the 'Context Injection' engine that allows mixing local tool data with Agent prompts. This includes:
1. Identifying `@mcp:server-name` tags and replacing them with data fetched from the local MCP service.
2. Supporting the pipe operator `|` to send the output of a local command (e.g., `/mcp get_logs`) as input to the next part of the prompt.

## Acceptance criteria
- [ ] Pre-processor correctly identifies and resolves `@mcp` tags before sending to Agent.
- [ ] Pipe syntax (`/cmd | prompt`) correctly sequences local execution and Agent dispatch.
- [ ] Graceful error handling if a referenced tool or MCP server is unavailable.
- [ ] Comprehensive unit tests for the injection/formatting logic.

## Blocked by
- [Issue 001: Command Registry and Router](docs/agents/issues/001-omni-input-registry-and-router.md)
- [Issue 003: Terminal Virtual Rendering](docs/agents/issues/003-terminal-virtual-rendering.md)
