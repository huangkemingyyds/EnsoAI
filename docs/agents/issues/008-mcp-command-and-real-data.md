## What to build

实现 `/mcp` 本地命令并接入真实数据。同时将 `commandProcessor` 中对 `@mcp:` 标签的替换逻辑从 Mock 字符串改为从 `window.electronAPI.claudeConfig.mcp.read()` 获取真实配置数据。

## Acceptance criteria

- [ ] `/mcp` 命令列出所有已配置的服务器、类型（stdio/http）以及当前启用状态。
- [ ] 在终端输入包含 `@mcp:name` 的 Prompt 时，系统自动读取该服务器的配置快照并注入上下文（替代 Mock 占位符）。
- [ ] 若服务器不存在或读取失败，输出合适的警告提示。

## Blocked by

- 006-standardize-command-registry-and-result.md
