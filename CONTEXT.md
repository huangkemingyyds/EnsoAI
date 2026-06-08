# EnsoAI

EnsoAI manages Git worktrees and AI agent sessions. This glossary names the domain concepts used when discussing agent chat workflows.

## Language

**Agent**:
An AI command-line worker that can be launched inside a worktree session.
_Avoid_: Provider, model, bot

**Agent Capability**:
A declared behavior that determines which chat-workspace features an Agent can use.
_Avoid_: Setting, feature flag, provider option

**AI Provider**:
The backend family or CLI integration used by an Agent, such as Claude Code, Codex CLI, Cursor CLI, or Gemini CLI.
_Avoid_: Agent, session, ChatPlus

**Agent Session**:
A live or resumable interaction with one Agent inside one worktree.
_Avoid_: Terminal, chat, provider session

**Agent Completion Signal**:
An Agent-specific indication that an Agent Session has finished its current turn and may accept the next prompt.
_Avoid_: Stop Hook, idle timer, terminal output

**Agent Group**:
A visual grouping of Agent Sessions in the chat workspace, used for split-panel workflows.
_Avoid_: Workspace, tab group

**Chat Workspace**:
The worktree-scoped UI area where Agent Sessions are arranged, viewed, and interacted with.
_Avoid_: Terminal, provider, worktree

**Enhanced Input**:
The reusable prompt composition surface for an Agent Session, supporting richer input such as multiline text and attachments when the Agent supports them.
_Avoid_: Claude input, chat box, terminal input

**Enhanced Input Draft**:
Unsent Enhanced Input content and Input Attachments kept for an Agent Session until the user sends, clears, or closes that session.
_Avoid_: Component state, textarea value, prompt history

**Enhanced Input Entry Point**:
A user-facing control that opens Enhanced Input for an Agent Session without requiring a keyboard shortcut.
_Avoid_: Shortcut, status line, tab action

**Enhanced Input Submission**:
An attempt to send an Enhanced Input Draft to an Agent Session or a local command handled by the Chat Workspace.
_Avoid_: PTY write, button click, form submit

**Enhanced Input Visibility**:
The user-facing presence of Enhanced Input for an Agent Session, independent of whether the Agent supports Enhanced Input.
_Avoid_: Mounted state, auto-popup mode, always-on input

**First Prompt Composer**:
The prompt composition surface shown before an Agent Session exists, used to launch a new Agent Session with initial content.
_Avoid_: Enhanced Input Visibility, session input, empty state

**Input Attachment**:
A file supplied alongside Enhanced Input content as context for an Agent Session.
_Avoid_: Upload, CLI argument, embedded file

**Slash Command Completion**:
An Agent-specific suggestion experience for slash-prefixed commands inside Enhanced Input.
_Avoid_: Enhanced Input, command palette, autocomplete

**ChatPlus**:
The enhanced chat-workspace capability that reuses Agent Sessions and AI Providers while adding richer input and session orchestration.
_Avoid_: AI Provider, Agent type
