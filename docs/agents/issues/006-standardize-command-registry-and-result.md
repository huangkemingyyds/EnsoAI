## What to build

扩展 `commandRegistry` 以支持更丰富的元数据和结构化输出。不再让 handler 直接调用 `writeVirtual`，而是返回一个 `CommandResult` 对象。重构 `commandProcessor` 以支持异步执行这些 handler，并消除对 `/reset` 等特定命令的硬编码路径。

引入 `CommandResult` 类型定义：
```typescript
type CommandResult = {
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message?: string;
  sections?: Array<{
    title?: string;
    lines: string[];
  }>;
}
```

## Acceptance criteria

- [ ] `CommandRegistry` 支持注册带有 `usage`, `aliases`, `description` 的命令。
- [ ] `CommandHandler` 统一返回 `Promise<CommandResult | string | undefined>`。
- [ ] `commandProcessor` 实现通用的 `LOCAL` 命令分发逻辑，支持执行 `executeLocal` 回调。
- [ ] 现有 `/reset` 命令通过新机制注册，不再由 `commandProcessor` 硬编码识别其 ID。
- [ ] 新增 `SystemMessageFormatter` 基础模块，能将 `CommandResult` 简单转为 ANSI 文本。

## Blocked by

None - can start immediately
