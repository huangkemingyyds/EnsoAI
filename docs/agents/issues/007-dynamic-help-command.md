## What to build

将 `/help` 命令从硬编码文本重构为动态生成。它将读取 `commandRegistry` 中所有已注册的命令及其元数据（`usage`, `description`, `aliases`），并利用 `SystemMessageFormatter` 输出格式统一的帮助文档。

## Acceptance criteria

- [ ] `/help` 处理器自动迭代 `commandRegistry.getAllCommands()`。
- [ ] 输出包含命令名称、别名、用法说明和描述。
- [ ] 支持查看特定命令的帮助（例如 `/help mcp`）。
- [ ] 输出风格通过 `SystemMessageFormatter` 统一处理，具有良好的缩进和层次感。

## Blocked by

- 006-standardize-command-registry-and-result.md
