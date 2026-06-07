## What to build

接入 `window.electronAPI.claudeCompletions` 数据源，实现本地 Skill 管理命令。支持列出所有已加载的 Skill 并查看其详细定义（从 `skill.md` 解析出的元数据）。

## Acceptance criteria

- [ ] `/skills list` 展示所有 Skill 的名称和简短描述。
- [ ] `/skills show <skillName>` 展示该 Skill 的完整元数据（Name, Description, Path）及内容摘要。
- [ ] 若 Skill 不存在，输出友好错误提示。

## Blocked by

- 006-standardize-command-registry-and-result.md
- 007-dynamic-help-command.md
