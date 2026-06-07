## What to build

全面升级 `SystemMessageFormatter`，为本地命令输出提供专业、美观的 ANSI 样式方案。引入颜色区分、边框线、列表符号优化等视觉增强。

## Acceptance criteria

- [ ] 成功提示使用绿色标识，错误使用红色，信息使用蓝色。
- [ ] 复杂的列表或详情输出支持使用简单的字符边框或缩进线。
- [ ] 在不同终端背景色（通过 `useTerminalSettings` 获取）下保持高对比度和可读性。
- [ ] 所有本地命令（help, mcp, skills）的输出均已应用新样式。

## Blocked by

- 007-dynamic-help-command.md
- 008-mcp-command-and-real-data.md
- 009-skills-management-command.md
