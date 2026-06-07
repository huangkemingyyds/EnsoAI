# Agent Capability Registry 与图片输入协议后续实现

状态: Completed
日期: 2026-06-07

## 背景

`2026-06-06-generalize-enhanced-input.md` 完成了第一阶段 Enhanced Input 通用化，但仍留下四个后续优化点：

1. 引入正式 Agent capability registry。
2. 将 Enhanced Input 设置迁移到更中性的 `agentInput` 命名。
3. 支持 Agent-specific completion signal。
4. 支持真实图片输入协议，避免把所有图片输入模式静默 fallback 到 prompt 追加。

本 follow-up 推进 1、3、4，并确认 2 已经基本落地。

## 已确认边界

- `cli_arg` 表示启动 Agent Session 时才能传入的图片参数。
- 已运行的 Agent Session 不会为了 `cli_arg` 自动重启。
- 已运行的 Agent Session 不会创建旁路的一次性命令来发送图片。
- 已运行的 Agent Session 若遇到 `cli_arg` 图片模式，应显式提示不支持当前发送路径，而不是追加图片路径到 prompt。
- `prompt_with_arg` 表示运行中可以通过 prompt 参数模板发送的图片协议。
- `append_to_prompt` 只表示 Agent 明确声明的文本路径引用模式，不再作为 `cli_arg` 或未知协议的兜底。

## 实现计划

### 1. Agent Capability Registry

- 使用 shared Agent registry 作为 built-in Agent 能力声明来源。
- renderer 的 capability resolver 从 shared registry 读取 built-in capabilities。
- main process 的 `AgentRegistry` 复用 shared registry，避免 main/renderer/shared 三份 built-in metadata 漂移。
- Custom Agent 和 unknown Agent 仍由 renderer resolver 提供默认能力。

### 2. Agent Completion Signal

- Claude 继续使用 WebSocket Stop Hook 作为精确 completion signal。
- Codex/Gemini/其他 built-in Agent 使用 `completionDetection.outputPattern` 和 `idleMs` 形成 completion signal adapter。
- 当非 WebSocket adapter 判断 Agent Session 从 running 进入 idle 时，触发 Enhanced Input 的 completion auto-popup 判断。
- `waiting_input` 状态仍阻止自动弹出，避免覆盖权限请求/提问状态。

### 3. 图片输入协议

- `prompt_with_arg` 使用 Agent 声明的 `injectionTemplate`，默认模板为 `--image %path%`。
- `cli_arg` 在运行中发送时返回 unsupported 状态，由 UI toast 告知用户该 Agent 只支持新建会话启动参数。
- 不再从 `cli_arg` 静默 fallback 到 `append_to_prompt`。
- formatter 返回结构化发送结果，而不是裸字符串，便于 UI 区分“可发送”和“协议不支持”。

## 验收标准

- Built-in Agent 能力声明来自 shared registry，renderer 不再维护一份 built-in override 表。
- Codex/Gemini 在 output pattern 或 idle adapter 判断完成后，可按 `hideWhileRunning` 语义重新打开 Enhanced Input。
- `cli_arg` 图片模式在运行中发送时不会写入 PTY。
- `prompt_with_arg` 支持默认 `--image %path%` 和自定义 `injectionTemplate`。
- 相关 formatter/capability 单测覆盖新语义。
- `pnpm typecheck` 和相关 Vitest 测试通过。

## 完成记录

- Built-in Agent 能力声明已集中到 shared `AGENT_REGISTRY`，main process 和 renderer resolver 复用同一来源。
- Claude 继续使用 WebSocket Stop Hook；Codex/Gemini 等 Agent 使用声明式 completion adapter 触发 `hideWhileRunning` 自动弹出判断。
- `cli_arg` 已明确建模为 launch-time 图片协议：运行中发送会返回 unsupported 并显示提示，不再 fallback 到 prompt 追加。
- 新建 Agent Session 的首条 prompt composer 可携带图片附件，并通过 `pendingCommand` / `pendingImagePaths` 显式表达 launch payload。
- Agent Session 初始化后会清理 launch payload，避免重复应用；image-only launch payload 也会强制激活终端启动。
- Custom Agent 和 unknown Agent 默认不声明图片输入支持，避免未知协议静默 fallback。
- 相关 Vitest 覆盖 capability resolution、runtime formatter、launch payload planning、launch session lifecycle、Agent Input settings migration；`pnpm typecheck` 通过。
