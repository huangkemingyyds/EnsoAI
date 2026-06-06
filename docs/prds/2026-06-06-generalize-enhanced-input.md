# PRD: Generalize Enhanced Input across Agent Sessions

Target issue tracker label: `ready-for-agent`

Publication note: this PRD is ready to publish as a GitHub issue in `J3n5en/EnsoAI`, but the GitHub connector returned `403 Resource not accessible by integration` when issue creation was attempted.

## Problem Statement

EnsoAI currently gives users a richer Enhanced Input experience primarily when they are using Claude. Users who run Codex, Gemini, or a Custom Agent inside an Agent Session fall back to raw terminal input, even though the Chat Workspace already has an input surface that can compose multiline prompts and attach image paths.

This creates an inconsistent experience across Agents. Users need one reusable Enhanced Input capability that follows Agent Capability declarations instead of hard-coded Claude checks, while preserving the existing Claude-specific integrations that are genuinely tied to Claude CLI, Claude Provider settings, MCP hooks, and Claude slash command completion.

## Solution

Generalize Enhanced Input into an Agent Capability that can be resolved for each Agent Session. The Chat Workspace should display and operate the Enhanced Input surface for any Agent whose capabilities support it, including Claude, Codex, Gemini, Custom Agents, and unknown Agents that can receive terminal text.

The first implementation phase keeps existing settings storage in place but treats the Enhanced Input settings as global Enhanced Input settings. It replaces Enhanced Input-related Claude hard-coding with capability checks, introduces a reusable formatter for Agent-specific prompt and attachment formatting, preserves existing Claude behavior, and keeps truly Claude-specific integrations Claude-only.

## User Stories

1. As an EnsoAI user, I want Enhanced Input to work with Claude, so that my current workflow remains intact.
2. As an EnsoAI user, I want Enhanced Input to work with Codex, so that I can write multiline prompts without using raw terminal editing.
3. As an EnsoAI user, I want Enhanced Input to work with Gemini, so that I can use the same Chat Workspace input pattern across Agents.
4. As an EnsoAI user, I want Enhanced Input to work with Custom Agents, so that custom CLI tools can share the same prompt composition surface.
5. As an EnsoAI user, I want unknown but launchable Agents to default to text Enhanced Input support, so that new Agents are useful before they have explicit metadata.
6. As an EnsoAI user, I want the same Ctrl+G shortcut to open Enhanced Input for supported Agents, so that I do not need to learn per-Agent shortcuts.
7. As an EnsoAI user, I want Ctrl+G to pass through when Enhanced Input is globally disabled, so that terminal behavior is not unexpectedly intercepted.
8. As an EnsoAI user, I want a clear toast if an Agent explicitly does not support Enhanced Input, so that I understand why the panel did not open.
9. As an EnsoAI user, I want unsupported Agents to avoid showing a disabled input panel, so that the Chat Workspace stays uncluttered.
10. As an EnsoAI user, I want multiline prompt sending to work consistently across supported Agents, so that I can send structured instructions and pasted task descriptions.
11. As an EnsoAI user, I want image attachments to remain available where supported, so that I can provide image paths as context.
12. As an EnsoAI user, I want image paths with spaces to be handled safely, so that attachments do not break prompt formatting.
13. As an EnsoAI user, I want Codex image attachments to fall back to appended paths, so that the feature remains minimally useful without requiring CLI-specific image protocol work.
14. As an EnsoAI user, I want Gemini image attachments to use a Gemini-specific mode only when it is known to work, so that uncertain formatting does not break prompt submission.
15. As an EnsoAI user, I want Custom Agent image attachments to default to appended paths, so that custom tools get predictable text input.
16. As an EnsoAI user, I want Enhanced Input to auto-open for supported Agents when global settings allow it, so that the interaction model is consistent.
17. As an EnsoAI user, I want Claude to keep its Stop Hook-driven completed-turn auto-popup behavior, so that existing Claude workflows do not regress.
18. As an EnsoAI user, I want non-Claude Agents not to promise completed-turn auto-popup without a reliable Agent Completion Signal, so that the UI does not imply a capability it cannot detect.
19. As an EnsoAI user, I want running-state hiding to follow Enhanced Input support, so that supported non-Claude Agents can use the same hide-while-running UI behavior where feasible.
20. As an EnsoAI user, I want Claude slash command suggestions to remain available for Claude, so that existing command completion behavior is preserved.
21. As an EnsoAI user, I want Codex, Gemini, and Custom Agents not to show Claude slash suggestions, so that I do not see commands for the wrong Agent.
22. As an EnsoAI user, I want `/...` text to still send normally for non-Claude Agents, so that slash-prefixed prompts are not blocked.
23. As an EnsoAI user, I want Claude Provider switching to remain Claude-specific, so that provider settings are not confused with Agents or AI Providers in the broader EnsoAI sense.
24. As an EnsoAI user, I want Claude IDE Bridge, MCP hooks, status line, and provider watcher behavior to remain unchanged, so that generalized Enhanced Input does not destabilize Claude integration.
25. As an EnsoAI user, I want Hapi and Happy Agent IDs to resolve back to their base Agent capabilities, so that environment variants behave consistently.
26. As an EnsoAI user, I want the settings page to describe Enhanced Input as Agent-general, so that the UI matches the new behavior.
27. As an EnsoAI user, I want the existing settings values to keep working after upgrade, so that I do not lose preferences.
28. As an EnsoAI maintainer, I want Enhanced Input support to be declared through Agent Capability, so that adding future Agents does not require scattered UI conditionals.
29. As an EnsoAI maintainer, I want a single capability resolver, so that base Agent IDs, Custom Agents, unknown Agents, and environment variants are handled consistently.
30. As an EnsoAI maintainer, I want one formatter for Enhanced Input submission, so that prompt and attachment behavior is testable without rendering the full UI.
31. As an EnsoAI maintainer, I want terminal write behavior to remain centralized, so that multiline and bracketed paste behavior does not diverge across Agents.
32. As an EnsoAI maintainer, I want true Claude-only logic to remain visibly Claude-only, so that future changes do not accidentally generalize provider settings or MCP hooks.
33. As an EnsoAI maintainer, I want unsupported Enhanced Input behavior defined even if defaults support most Agents, so that future Agents can opt out safely.
34. As an EnsoAI maintainer, I want no first-phase settings migration, so that the implementation stays focused and low risk.
35. As an EnsoAI maintainer, I want `cli_arg` image mode to be represented but not dynamically executed in an existing session, so that the model can grow without overpromising runtime behavior.
36. As an AFK coding agent, I want clear implementation boundaries, so that I can change Enhanced Input behavior without touching unrelated Claude integration code.
37. As an AFK coding agent, I want clear testing seams, so that I can validate capability resolution, formatting, and UI behavior without relying on manual terminal sessions only.

## Implementation Decisions

- Treat ChatPlus as an enhanced Chat Workspace capability, not as a new AI Provider and not as a new Agent type.
- Treat Enhanced Input as a reusable prompt composition surface for Agent Sessions.
- Add an Enhanced Input capability to the shared Agent capability model.
- Model Enhanced Input support with a supported flag, multiline support, image input support, image input mode, and slash command completion support or equivalent fields.
- Introduce a renderer-side Agent Capability resolver as the single usage entry point for Chat Workspace decisions.
- The resolver must normalize environment-specific Agent IDs such as Hapi and Happy variants back to the base Agent before resolving capabilities.
- The resolver must supply default capabilities for built-in Agents.
- The resolver must supply default capabilities for Custom Agents.
- The resolver must supply permissive text-input fallback capabilities for unknown launchable Agents.
- Claude defaults to Enhanced Input support, multiline support, image append-to-prompt behavior, and Claude slash command completion.
- Codex defaults to Enhanced Input support, multiline support, image append-to-prompt behavior, and no Claude slash command completion.
- Gemini defaults to Enhanced Input support and multiline support, with prompt-with-arg image mode only where the formatter can safely support it; otherwise it falls back to append-to-prompt.
- Custom Agents default to Enhanced Input support, multiline support, and append-to-prompt image handling.
- Unknown Agents default to text Enhanced Input support and append-to-prompt image handling.
- Add a formatter for Enhanced Input submissions that takes the resolved Agent Capability, text content, and Input Attachments and returns the terminal-ready message.
- Implement append-to-prompt by appending escaped attachment paths after the user's text.
- Keep `cli_arg` in the capability type but do not dynamically inject CLI arguments into an already-running Agent Session in phase one.
- If `cli_arg` mode is encountered during session input formatting, fall back to append-to-prompt.
- Continue using the current bracketed paste write strategy for multiline content and attachment-bearing content.
- Continue direct write plus carriage return for single-line content.
- Do not introduce per-Agent terminal write protocols in phase one.
- Replace Enhanced Input-specific `agentId === 'claude'` checks with capability checks.
- Keep Claude-specific CLI integration checks where they represent real Claude behavior, including IDE Bridge, MCP hooks, provider switching, provider watcher, settings integration, status line, stop hooks, permission request hooks, tmux wrapping, and Claude session options.
- Keep existing settings storage fields for Enhanced Input in the current settings object for phase one.
- Treat existing Enhanced Input settings semantically as global Enhanced Input settings, even though their persisted location remains unchanged.
- Update settings UI copy to describe Enhanced Input as Agent-general rather than Claude-only.
- Interpret hide-while-running as fully supported for Claude where Stop Hook provides a reliable Agent Completion Signal.
- For non-Claude Agents, do not promise completed-turn auto-popup unless an Agent Completion Signal exists.
- Keep Claude slash command completion and learning enabled only for Claude.
- Disable Claude slash command suggestions and Claude completion learning for Codex, Gemini, Custom Agents, and unknown Agents.
- Let slash-prefixed text send normally for non-Claude Agents.
- For Agents with Enhanced Input explicitly unsupported, do not render the Enhanced Input panel.
- For Agents with Enhanced Input explicitly unsupported, show a toast only when the user explicitly attempts to open the panel.
- Do not create an ADR for this phase because the decisions are scoped, reversible implementation boundaries rather than hard-to-reverse architectural commitments.

## Testing Decisions

- Good tests should validate externally visible behavior: which Agents can open Enhanced Input, how submissions are formatted, when Claude-only slash suggestions appear, and whether unsupported Agents are hidden with a toast on explicit trigger.
- Prefer testing the highest stable seam: capability resolution should be tested independently from React rendering.
- Test the Enhanced Input formatter independently with content-only, attachment-only, multiline, image-path-with-spaces, append-to-prompt, prompt-with-arg fallback, and cli-arg fallback cases.
- Test Chat Workspace rendering behavior at the component seam where the active Agent Session determines whether Enhanced Input is rendered.
- Test shortcut behavior at the terminal component seam: supported Agent opens Enhanced Input, unsupported Agent shows a toast, globally disabled Enhanced Input passes Ctrl+G through.
- Test slash command behavior at the Enhanced Input seam: Claude enables suggestions and learning, non-Claude Agents do not call Claude completion APIs.
- Test that existing Claude behavior remains compatible: multiline sending, image path append behavior, auto-hide while running, and Stop Hook-driven auto-popup.
- Test that non-Claude Agents can send text through Enhanced Input using the same terminal writer registration path.
- Existing prior art in the codebase is limited: the repo primarily relies on TypeScript and Biome, with a small existing Vitest-style service test. Add focused tests only where the codebase's current test setup supports them without broad harness work.
- Always run typecheck and Biome after implementation.

## Out of Scope

- Do not create a new AI Provider for ChatPlus.
- Do not create a new Agent type for ChatPlus.
- Do not migrate Enhanced Input settings into a new persisted settings schema in phase one.
- Do not implement true runtime CLI argument injection for image attachments.
- Do not restart Agent Sessions to support `cli_arg` image mode.
- Do not create one-off command execution paths for image attachment sending.
- Do not build Codex or Gemini slash command completion sources.
- Do not generalize Claude Provider switching beyond Claude.
- Do not generalize Claude IDE Bridge, MCP hooks, Stop Hook, PermissionRequest Hook, Status Line Hook, provider watcher, or Claude settings integration.
- Do not redesign the Chat Workspace layout.
- Do not change global theme tokens or design system foundations.
- Do not add Agent-level settings UI for Enhanced Input in phase one beyond using existing global settings and capability defaults.
- Do not introduce per-Agent terminal write protocols unless a regression proves the shared bracketed paste strategy is unusable.

## Further Notes

The domain glossary for this work lives in the root `CONTEXT.md`. Relevant terms include Agent, Agent Capability, AI Provider, Agent Session, Agent Group, Chat Workspace, Enhanced Input, Input Attachment, Slash Command Completion, Agent Completion Signal, and ChatPlus.

The implementation should be careful not to treat every Claude string check as a bug. Only Enhanced Input-related display and send behavior should move to capability checks. Claude CLI integration checks should remain explicit because they represent real external integration constraints.

This PRD is ready for an AFK agent with the `ready-for-agent` label once it can be published to the issue tracker.
