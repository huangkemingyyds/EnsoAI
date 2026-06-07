# PRD: Complete cli_arg Image Launch Workflow for Agent Sessions

Target issue tracker label: `ready-for-agent`

Publication note: GitHub issue creation was attempted for `huangkemingyyds/EnsoAI`, but GitHub returned `410 Issues has been disabled in this repository`. This PRD is ready to publish with the `ready-for-agent` label once Issues are enabled or another tracker target is configured.

## Problem Statement

EnsoAI now has a clearer Agent Capability registry, Agent-specific completion detection, and protocol-aware Enhanced Input formatting. However, the `cli_arg` image protocol is only technically represented: it can be rejected in an active Agent Session and can be carried through launch-time metadata, but users do not yet have a complete workflow for starting a new Agent Session with image Input Attachments.

From the user's perspective, this creates a confusing gap. Some Agents can only accept image files as startup arguments, while Enhanced Input primarily operates inside an already-running Agent Session. If the user attaches an image after the Agent Session is running, EnsoAI correctly refuses to fake the protocol. But the user still needs an intentional path to start an Agent Session with a prompt and images when the selected Agent declares `cli_arg` support.

## Solution

Add a user-facing launch workflow for Agents whose Agent Capability declares `cli_arg` image input. The Chat Workspace should allow a user to compose a first prompt with image Input Attachments before the Agent Session starts, then launch the Agent Session with those images passed through the Agent's startup argument protocol.

The existing Enhanced Input surface should remain the user's main prompt composition model. When an Agent Session is already active, `cli_arg` image input should continue to be rejected with a clear explanation. When a new Agent Session is being created, the same image selection and paste/drop affordances should feed launch-time image arguments instead of runtime prompt text.

The workflow should preserve the already-confirmed boundary: EnsoAI must not restart an active Agent Session, must not create a one-off command outside the Agent Session, and must not silently append image paths to the prompt when the Agent requested `cli_arg`.

## User Stories

1. As an EnsoAI user, I want to start an Agent Session with a prompt and image attachments, so that Agents requiring startup image arguments can receive visual context.
2. As an EnsoAI user, I want the same Enhanced Input-style composer for first prompts, so that I do not need to learn a separate image launch UI.
3. As an EnsoAI user, I want EnsoAI to explain when image input only works at session launch, so that I understand why runtime sending is blocked.
4. As an EnsoAI user, I want `cli_arg` images to be passed as real startup arguments, so that the selected Agent receives them through its supported protocol.
5. As an EnsoAI user, I want active Agent Sessions not to restart unexpectedly, so that I do not lose context.
6. As an EnsoAI user, I want EnsoAI not to run hidden one-off commands for image input, so that all work remains tied to the Agent Session I can see.
7. As an EnsoAI user, I want image paths with spaces to work, so that screenshots from normal folders do not break startup commands.
8. As a Windows user, I want startup image paths to be quoted safely for PowerShell and command shells, so that attached files are not misinterpreted.
9. As a macOS or Linux user, I want startup image paths to be quoted safely for shell launch, so that attached files with spaces or quotes still work.
10. As an EnsoAI user, I want launch-time image files to be copied into the worktree-scoped input directory, so that Agents can read them consistently.
11. As an EnsoAI user, I want image previews before launch, so that I can confirm I attached the intended files.
12. As an EnsoAI user, I want to remove an image before launch, so that mistakes are easy to correct.
13. As an EnsoAI user, I want drag-and-drop image attachment support before launch, so that screenshot workflows stay fast.
14. As an EnsoAI user, I want paste-from-clipboard image support before launch, so that captured screenshots can be launched directly.
15. As an EnsoAI user, I want the send button to become a launch action when no Agent Session exists yet, so that the workflow feels continuous.
16. As an EnsoAI user, I want the new Agent Session tab to show the selected Agent, so that I know which Agent received the launch prompt.
17. As an EnsoAI user, I want startup image arguments to use the Agent's declared argument template, so that different Agent CLIs can express different protocols.
18. As an EnsoAI user, I want Agents using `prompt_with_arg` to continue sending images at runtime, so that Gemini-style workflows do not regress.
19. As an EnsoAI user, I want Agents using `append_to_prompt` to continue receiving text path references when that mode is explicitly declared, so that simple custom Agents remain useful.
20. As an EnsoAI user, I want `cli_arg` runtime sends to keep showing a warning rather than silently falling back, so that protocol failures are visible.
21. As an EnsoAI user, I want `hideWhileRunning` to continue reopening Enhanced Input after reliable completion signals, so that multi-turn workflows remain ergonomic.
22. As an EnsoAI user, I want completion auto-popup to work for Codex and Gemini when their Agent Capability declares a completion adapter, so that non-Claude Agent Sessions feel consistent.
23. As an EnsoAI user, I want Claude Stop Hook behavior to remain unchanged, so that existing Claude workflows do not regress.
24. As an EnsoAI maintainer, I want built-in Agent image behavior to be declared in Agent Capability metadata, so that adding Agent-specific protocols does not require scattered UI checks.
25. As an EnsoAI maintainer, I want launch payloads to be represented explicitly, so that startup prompts and startup images can be tested without rendering a full terminal.
26. As an EnsoAI maintainer, I want runtime send formatting and launch command formatting to remain separate concepts, so that `cli_arg` cannot accidentally re-enter runtime prompt sending.
27. As an EnsoAI maintainer, I want custom Agents to default conservatively, so that they do not claim real image support without a declared protocol.
28. As an EnsoAI maintainer, I want unknown Agents to avoid silent image fallback, so that failures are observable.
29. As an AFK coding agent, I want focused tests around capability resolution, launch payload planning, and runtime formatting, so that this behavior can be changed safely later.
30. As an AFK coding agent, I want this feature split from unrelated Agent UI redesign, so that implementation stays reviewable.
31. As a support/debugging user, I want troubleshooting docs to distinguish startup image arguments from runtime image prompt arguments, so that diagnosis uses the right vocabulary.
32. As a release maintainer, I want existing Enhanced Input settings to keep working, so that this launch workflow does not require a settings migration.

## Implementation Decisions

- Treat `cli_arg` as a launch-time image input protocol only.
- Treat `prompt_with_arg` as a runtime prompt protocol that may include an Agent-declared image argument template.
- Treat `append_to_prompt` as an explicit text-reference mode, not as a fallback for unsupported protocols.
- Continue rejecting `cli_arg` image sends in active Agent Sessions with a clear user-facing warning.
- Do not restart an active Agent Session to satisfy `cli_arg`.
- Do not create hidden one-off command executions to satisfy `cli_arg`.
- Extend the Chat Workspace creation flow so a first prompt can carry image Input Attachments before the Agent Session is initialized.
- Represent launch-time prompt text and launch-time image paths as explicit launch payload data on the Agent Session.
- Clear launch payload data after the Agent Session has initialized, so it cannot be applied twice.
- Use the Agent Capability registry as the source of built-in Agent protocol declarations.
- Keep Custom Agent and unknown Agent defaults conservative unless explicit metadata declares image support.
- Reuse the existing worktree-scoped input file handling so launch images are available from the current worktree.
- Reuse Enhanced Input's image validation limits for file count and file size.
- Preserve existing Claude-specific session, IDE, provider, MCP, and Stop Hook behavior.
- Preserve existing non-image multiline prompt behavior.
- Preserve current `agentInput` settings semantics; no new settings namespace is required for this workflow.
- Keep launch command construction centralized in the Agent Session startup path.
- Keep runtime Enhanced Input formatting centralized in the runtime formatter.
- Add a small launch payload planning seam if needed so tests can validate CLI argument generation without booting Electron or PTY.
- Use `ready-for-agent` when publishing because the boundary has been clarified and remaining work is implementable by an AFK agent.

## Testing Decisions

- Good tests should validate externally visible behavior: what the user can send, what is rejected, and which launch payload is created for a declared Agent Capability.
- Prefer testing capability resolution at the existing resolver seam.
- Prefer testing runtime formatting at the existing Enhanced Input formatter seam.
- Add or use a launch payload planning seam for startup argument generation rather than testing a full terminal boot.
- Test that `cli_arg` runtime image sending returns an unsupported result and does not produce prompt text.
- Test that `cli_arg` launch payload planning produces image arguments using the declared template.
- Test that launch image paths with spaces are quoted correctly.
- Test that `prompt_with_arg` runtime image sending still produces prompt-ready image arguments.
- Test that `append_to_prompt` still produces text path references only when explicitly declared.
- Test that completion auto-popup uses declared Agent Completion Signals and does not depend on Claude-only Stop Hook for non-Claude Agents.
- Test that Claude Stop Hook behavior remains compatible.
- Test that launch payload data is cleared after initialization.
- Use existing Vitest-style unit tests as prior art.
- Always run TypeScript typecheck and targeted Biome checks after implementation.

## Out of Scope

- Do not redesign the Chat Workspace.
- Do not add a new AI Provider.
- Do not add a new Agent type.
- Do not restart active Agent Sessions for image input.
- Do not introduce hidden one-off command execution for image input.
- Do not silently append image paths when the Agent declared `cli_arg`.
- Do not build Agent-specific slash command completion for Codex or Gemini.
- Do not generalize Claude provider switching or Claude MCP integration.
- Do not migrate existing `agentInput` settings.
- Do not change global theme tokens or design system foundations.
- Do not solve every custom Agent protocol; custom Agents require explicit metadata to claim real image support.

## Implementation Status

Status: Completed on 2026-06-07.

The launch workflow now reuses the existing Enhanced Input composer in the empty Chat Workspace state. First prompts can carry image Input Attachments before the Agent Session starts, and launch-time payloads are represented explicitly with `pendingCommand` and `pendingImagePaths`.

The implementation keeps runtime formatting and launch formatting separate:

- Runtime sends still use `formatEnhancedInputForAgent`.
- `cli_arg` runtime image sends return an unsupported result and do not write to the PTY.
- Launch-time image arguments use `planAgentLaunchPayload`.
- Launch payload lifecycle uses `createAgentLaunchSession`, `hasPendingLaunchPayload`, and `createInitializedSessionUpdates`.

The selected Agent for the first prompt is resolved through `resolveAgentLaunchTarget`, including Hapi/Happy environment variants and custom path/args settings. Image-only launch payloads are treated as pending work so the Agent Session still starts.

Verification completed:

- Relevant Vitest suites passed: capability resolution, runtime formatting, launch target resolution, launch payload planning, launch session lifecycle, Agent Input settings, and settings migration.
- `pnpm typecheck` passed.
- Targeted Biome checks passed for touched files.

## Further Notes

This PRD follows the glossary terms in `CONTEXT.md`: Agent, Agent Capability, Agent Session, Chat Workspace, Enhanced Input, Input Attachment, Slash Command Completion, Agent Completion Signal, and ChatPlus.

The implementation includes a shared built-in Agent Capability registry, structured runtime formatting results, runtime rejection for `cli_arg`, a user-facing first prompt launch composer, explicit launch payload planning, and lifecycle cleanup for pending launch data.

The earlier phase-one PRD intentionally allowed `cli_arg` fallback to appended prompt paths. That decision is superseded for this follow-up: unsupported real protocols should be visible to the user instead of disguised as text prompt content.
