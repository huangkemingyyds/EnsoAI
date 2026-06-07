# PRD: Omni-Input Unified Command Orchestrator

- **Status**: Ready for Implementation (`ready-for-agent`)
- **Date**: 2026-06-07
- **Author**: Gemini CLI

## Problem Statement

Users currently experience a fragmented interaction model when using EnsoAI. While the Enhanced Input (EI) surface is excellent for multi-line prompts and attachments, it acts as a simple pass-through to the PTY. Consequently, client-side commands (such as `/mcp`, `/skill`, `/reset`) only work when typed directly into the raw terminal (and even then, they often conflict with Agent input) or are not recognized when sent through the EI. 

There is a logical gap between the 'UI input layer' and the 'Client capability layer'. Users want a single, unified entry point where any command—whether it targets the local application or the remote AI agent—is correctly routed and executed.

## Solution

Transform the Enhanced Input from a 'Text Buffer' into an **'Omni-Input Action Bar'**. This involves introducing a Command Router that intercepts all submissions from the EI and determines their destination (Local Client or Remote Agent). 

The solution includes:
1. A **Unified Command Registry** to manage both client-side and agent-side instructions.
2. A **Logic Router** that sniffs input prefixes and redirects commands to the appropriate handler.
3. **Virtual Output Rendering** to display local command results in the terminal without polluting the Agent's context.
4. **Context Injection** to allow local tool data (e.g., MCP output) to be piped or embedded into Agent prompts.

## User Stories

1. As an EnsoAI user, I want to type `/mcp list` in the Enhanced Input and see my MCP servers, so that I don't have to switch to raw terminal mode.
2. As an EnsoAI user, I want the UI to highlight `/skill` in a different color, so that I know the client has recognized it as a local command.
3. As an EnsoAI user, I want to use `/reset` in the Enhanced Input to clear the current session, so that I can maintain a consistent input workflow.
4. As an EnsoAI user, I want the results of local commands to appear in the terminal with a 'System' tag, so that I can distinguish them from Agent output.
5. As an EnsoAI user, I want my local command results to be 'invisible' to the Agent, so that my context window doesn't get filled with irrelevant system information.
6. As an EnsoAI user, I want a unified slash-command autocomplete that shows both EnsoAI tools and Agent-specific commands (like Claude's `/fix`), so that I don't have to memorize prefixes.
7. As an EnsoAI user, I want to be able to pipe local command output to an Agent (e.g., `/mcp get_logs | analyze this`), so that I can automate complex diagnostic workflows.
8. As an EnsoAI user, I want to use `@mcp:server-name` in my prompt to automatically inject data from a specific tool, so that I can provide rich context without manual copy-pasting.
9. As an EnsoAI user, I want the Enter key to 'just work' for both system commands and chat messages, so that the interaction feels seamless.
10. As an EnsoAI maintainer, I want a single registry where I can add new client commands, so that the codebase remains modular and extensible.
11. As an EnsoAI maintainer, I want to decouple the input surface from the PTY write logic, so that I can implement complex pre-processing and routing.

## Implementation Decisions

- **Command Registry**: A centralized service (likely in `src/renderer/lib/commandRegistry.ts`) that maps command strings to handlers. Handlers can be local (Electron/Main process calls) or remote (PTY write).
- **Logic Router**: A middleware layer in the `EnhancedInputContainer` or a dedicated library that parses the first token of any submission.
- **Interception Logic**:
    - If token matches a `ClientCommand`, call the registered handler and suppress PTY write.
    - If token matches an `AgentCommand` (resolved via Agent Capability), pass through to PTY.
    - Otherwise, treat as standard `AgentPrompt`.
- **Virtual Messages**: A new message type in the terminal data stream that is handled by the renderer-side terminal component (Xterm.js) to display text in a distinct style (e.g., boxed, italicized, or colored) without being part of the PTY buffer.
- **Context Injection Engine**: A pre-processor that identifies `@mcp` tags or pipe operators, executes the underlying tool, and replaces the tag with the formatted tool output before the final dispatch to the Agent.
- **Unified Autocomplete**: Extend the current `SlashCommandCompletion` logic to query the Command Registry and merge local results with Agent-provided suggestions.

## Testing Decisions

- **Command Parsing Tests**: Unit tests to verify that `/mcp`, `/skill`, and regular text are correctly categorized by the Router.
- **Interception Integration Tests**: Verify that `onSend` in the EI container correctly calls the Local Handler for specific strings and the Terminal Writer for others.
- **Virtual Rendering Tests**: Verify that 'system' messages are rendered in the UI but do not trigger Agent completion signals or occupy the output buffer.
- **Formatting Tests**: Verify that the Context Injection engine correctly replaces tags with data and handles errors (e.g., tool not found) gracefully.

## Out of Scope

- Redesigning the entire Terminal UI or Xterm.js integration.
- Implementing a full 'bash-like' piping system (only basic client-to-agent piping is targeted).
- Generalizing Agent commands across different providers (e.g., making Claude's `/fix` work on Gemini).

## Further Notes

This PRD moves EnsoAI towards being a 'Command Orchestrator'. The domain glossary in `CONTEXT.md` should be updated to include 'Command Router', 'Virtual Message', and 'Context Injection' once implemented.
