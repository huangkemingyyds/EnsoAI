# EnsoAI 多 Agent 增强输入排障与维护手册 (Windows)

本手册总结了在 Windows 环境下开发、打包和使用 EnsoAI “多 Agent 增强输入”功能时的常见问题及其解决方案。

## 1. 原生依赖与打包问题

### 1.1 终端 (PTY) 无法启动
**现象**：打包后的版本点击 Agent 没有任何反应，或者报错 `The system cannot find the path specified`。
**原因**：`node-pty` 是原生 C++ 依赖，必须在生产环境中从 `.asar` 归档中解压出来才能正常加载 DLL。
**解决**：
- 确保 `electron-builder.yml` 中的 `asarUnpack` 包含 `node-pty`：
  ```yaml
  asarUnpack:
    - "node_modules/node-pty/**"
  ```
- 检查系统是否安装了 `Visual C++ Redistributable`。

### 1.2 文件监听失效
**现象**：工作区文件变动后，Agent 无法实时感应（如补全项不刷新）。
**原因**：`@parcel/watcher` 同样是原生依赖，需要解压。
**解决**：
- 确保 `asarUnpack` 包含 `@parcel/watcher`。

## 2. Gemini / 多 Agent 输入问题

### 2.1 Gemini 报错 Error 400 / INVALID_ARGUMENT
**现象**：发送指令后 Gemini 立即返回错误。
**原因**：
1. **图片路径问题**：Windows 下跨用户目录（Temp）的绝对路径可能导致权限拒绝或转义失败。
2. **上下文过长**：发送了大段代码（超过 32k tokens 限制）。
**解决**：
- **路径本地化**：EnsoAI 现在会自动将图片存入工作区的 `.ensoai-input/` 目录。请确保该目录未被加密或锁定。
- **大段文本转存**：如果粘贴超过 5000 字符，请接受系统的建议将其存为 `.md` 文件并让 Agent 读取，而不是直接发送文本。
- **重置会话**：如果报错持续，点击错误覆盖层上的“重置会话”以清除损坏的上下文。

### 2.2 增强输入框不弹出
**现象**：Agent 运行结束后，底部输入工作台没有自动出现。
**原因**：
1. **检测算法未匹配**：自定义 Agent 可能使用了非标准的 Prompt 结束符。
2. **静默时间不足**：`idleMs` 设定太短，Agent 还没输出完就被判定为结束。
**解决**：
- 在 `AgentRegistry` 或 `agentCapabilities.ts` 中调整该 Agent 的 `completionDetection` 配置：
  ```typescript
  outputPattern: '(?m)^>\\s*$', // 根据实际 Prompt 修改正则
  idleMs: 3000,                // 适当调大静默等待时间
  ```

## 3. 图片管理

### 3.1 图片无法预览
**现象**：上传图片后，缩略图显示为破碎图标。
**原因**：渲染进程被禁止访问本地文件系统。
**解决**：
- EnsoAI 使用 `local-file://` 协议访问本地图片。主进程已在 `files.ts` 中通过 `registerAllowedLocalFileRoot` 授权了 `.ensoai-input` 目录。
- 检查 `cwd` 是否获取正确。

## 4. 开发调试

### 4.1 查看 PTY 原始输出
如果怀疑状态检测有问题，可以在控制台开启调试：
```typescript
// 在 AgentTerminal.tsx 中临时开启
console.log('[PTY Data]', data);
```

### 4.2 清理缓存
如果输入逻辑出现混乱，可以尝试手动清理：
- 删除各工作区下的 `.ensoai-input/` 目录。
- 重启应用以刷新内存中的 `AgentSessionsStore`。
