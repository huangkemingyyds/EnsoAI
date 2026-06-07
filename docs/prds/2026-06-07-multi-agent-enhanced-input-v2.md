# 多 Agent Enhanced Input 稳定性增强 PRD

- **状态**: 已完成 (Finalized)
- **日期**: 2026-06-07
- **更新**: 修复了新建会话白屏崩溃 bug，完成稳定性增强全量交付。

## 1. 背景
EnsoAI 当前的 Enhanced Input (增强输入框) 功能高度绑定 Claude Agent，利用其特有的 Stop Hook 实现状态同步。随着 Codex、Gemini 等更多 Agent CLI 的引入，现有的“Claude 专用”架构限制了其他 Agent 的输入体验，导致图片上传失败、运行状态识别不准、重复发送等稳定性问题。

## 2. 当前问题
1. **架构耦合**：UI 代码中充斥着 `agentId === 'claude'` 的硬编码判断。
2. **检测失效**：非 Claude Agent 缺乏稳定的运行完成信号，导致输入框弹出时机不对或无法自动隐藏。
3. **状态冲突**：在 Agent 运行过程中允许再次发送，导致 PTY 任务堆积或 API 报错。
4. **图片路径风险**：直接引用系统临时目录图片，导致部分 Agent (如 Gemini) 因权限或路径解析问题无法读取。
5. **大段文本崩溃**：粘贴数千行代码直接写入 PTY，易触发 CLI 参数长度限制或导致终端假死。
6. **错误处理薄弱**：Gemini API 返回 400 (INVALID_ARGUMENT) 时，用户无法得到明确的重置建议。

## 3. 目标
1. **通用化**：将 Enhanced Input 能力解耦，通过 `AgentCapabilities` 动态配置。
2. **稳定性**：为非 WebSocket 协议的 Agent 提供基于“特征匹配 + 静默超时”的运行检测。
3. **安全性**：增加发送状态锁，并在工作区内本地化管理图片资源。
4. **容错性**：识别常见的 API 错误并提供一键重置会话的操作。
5. **保护机制**：大段文本自动转为文件引用。

## 4. 非目标
1. 改变 Agent CLI 本身的运行逻辑。
2. 为不支持图片输入的 Agent 强制开启图片上传功能。
3. 替换现有的 PTY 底层实现。

## 5. 用户场景
- **场景 A**：用户在使用 Gemini 修复代码时，通过底栏增强输入框快速选择本地截图并发送。
- **场景 B**：用户粘贴了一段 2000 行的日志给 Codex，系统自动将其存为 `prompt.md` 并告诉 Agent “读取该文件”，而不是卡死终端。
- **场景 C**：Gemini 因为上下文过长报错 400，输入框上方出现“重置会话”按钮，点击后清除 PTY 并重启。

## 6. 功能需求
### 6.1 通用增强输入支持
- 支持在 `AgentRegistry` 中为每个 Agent 配置 `enhancedInput` 能力。
- Codex / Gemini 默认开启底栏增强输入框。

### 6.2 运行状态锁 (Running Lock)
- 当检测到 Agent 正在运行时，禁用发送按钮并锁定 Enter 键发送功能。
- 显示清晰的“运行中”视觉状态。

### 6.3 增强型完成检测 (Completion Detection)
- 引入混合检测算法：
    - **WebSocket Hook**：保留 Claude 现有的 Stop Hook。
    - **Output Pattern**：支持正则匹配（如 `> ` 或 `$\s*`）判定结束。
    - **Idle Timeout**：支持配置 `idleMs`（静默时间）和 `minRunningMs`（最小运行时间）。

### 6.4 本地化图片管理
- 图片上传后不再留在 Temp，而是复制到当前 Worktree 的 `.ensoai-input/` 目录下。
- 会话结束或重置时自动清理该目录（可选）。

### 6.5 大段代码输入保护
- 设定阈值（如 5000 字符）。
- 超过阈值时，提示用户或自动保存为临时文件，并在 PTY 中发送“请阅读 [file]”的指令。

### 6.6 错误识别与引导
- 监控 PTY 输出中的关键字（如 `INVALID_ARGUMENT`, `400`）。
- 识别到严重 API 错误时，在 UI 显著位置提供“重置会话”操作。

## 7. 技术需求
- **扩展 AgentCapabilities 接口**：增加 `completionDetection` 配置对象。
- **重构 AgentPanel / AgentTerminal**：移除 `agentId === 'claude'`，改为 `capabilities.enhancedInput.supported`。
- **引入指令拦截层**：在发送前判断文本长度和 Agent 状态。

## 8. 兼容性要求
- **Claude 回归测试**：确保 Claude 现有的 WebSocket 联动逻辑不受影响。
- **Windows 路径**：确保 `.ensoai-input/` 下的图片路径在 PowerShell 和 CMD 中均能被正确引用（需处理转义）。

## 9. 风险点
- **误报/漏报**：Output Pattern 如果配置不当，可能导致提前判定结束或永远卡在运行态。
- **磁盘占用**：频繁上传大图可能导致 `.ensoai-input/` 膨胀，需要清理策略。

## 10. 验收标准
1. Gemini 下可以稳定弹出增强输入框并发送带图片的指令。
2. 粘贴 10KB 以上文本时，不会导致 PTY 长时间阻塞。
3. Agent 运行中，点击发送按钮无效且有提示。
4. 手动重置会话功能可正常杀掉并重启 PTY 进程。
5. 打包为 Windows 安装包后，原生依赖（node-pty等）加载正常。
