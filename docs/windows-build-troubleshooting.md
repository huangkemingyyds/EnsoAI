# Windows 本地打包问题排查指南

## 问题现象

在 Windows 上执行 `pnpm build:win` 时，electron-builder 在解压 winCodeSign 缓存阶段报错：

```
⨯ cannot execute  cause=exit status 2
    errorOut=ERROR: Cannot create symbolic link : A required privilege is not held by the client.
    : ...\Cache\winCodeSign\<hash>\darwin\10.12\lib\libcrypto.dylib
    ERROR: Cannot create symbolic link : A required privilege is not held by the client.
    : ...\Cache\winCodeSign\<hash>\darwin\10.12\lib\libssl.dylib
```

electron-builder 会反复重试（每次生成不同的缓存哈希），最终打包失败。

## 根因

electron-builder 依赖 [winCodeSign](https://github.com/electron-userland/electron-builder-binaries) 二进制包，内含 Windows 代码签名工具（signtool、rcedit 等）以及 macOS 的 OpenSSL 库文件。

打包流程中，app-builder（Rust 编写的辅助二进制）下载 `winCodeSign-2.6.0.7z` 后调用 7-Zip 解压到缓存目录：

```
7za.exe x -snld -bd '<hash>.7z' '-o<hash>'
```

该压缩包中包含两个 macOS 符号链接（`darwin/10.12/lib/libcrypto.dylib` → `libcrypto.1.0.0.dylib`）。Windows 上创建符号链接需要 **管理员权限** 或 **开发人员模式**，普通终端权限不足，导致 7-Zip 返回 exit code 2（非致命错误），app-builder 将其视为失败并不断重试。

关键点：实际 Windows 所需的工具文件（rcedit、signtool 等）**已全部解压成功**，仅两个无关的 macOS 符号链接失败，但 7-Zip 的非零退出码触发了重试逻辑。

## 解决方案

### 方案一：开启 Windows 开发人员模式（推荐）

开启后普通用户即可创建符号链接，无需额外操作。

1. 打开 **设置 → 系统 → 开发者选项**（或搜索"开发者设置"）
2. 开启 **开发人员模式**
3. 正常执行 `pnpm build:win`

### 方案二：以管理员身份运行终端

1. 右键点击终端（PowerShell / CMD / Git Bash）
2. 选择 **以管理员身份运行**
3. 进入项目目录，执行 `pnpm build:win`

### 方案三：创建 7za wrapper exe

通过一个始终返回 exit code 0 的 wrapper 程序包装 7za，使 app-builder 认为解压成功。

**步骤：**

1. 找到 7za 路径（通常为 `node_modules/.pnpm/7zip-bin@5.2.0/node_modules/7zip-bin/win/x64/7za.exe`）
2. 将原始 `7za.exe` 重命名为 `7za_real.exe`
3. 编写 C# wrapper 源码（`wrapper.cs`）：

```csharp
using System;
using System.Diagnostics;
class Program {
    static int Main(string[] args) {
        string self = Environment.GetCommandLineArgs()[0];
        string real = self.Replace("7za.exe", "7za_real.exe");
        var psi = new ProcessStartInfo(real);
        psi.UseShellExecute = false;
        psi.Arguments = string.Join(" ", args);
        try {
            var p = Process.Start(psi);
            if (p != null) p.WaitForExit();
        } catch {}
        return 0;
    }
}
```

4. 使用 PowerShell 内置编译器生成 exe：

```powershell
Add-Type -Path 'wrapper.cs' -OutputAssembly '7za.exe' -OutputType ConsoleApplication
```

5. 将生成的 `7za.exe` 放到原路径（与 `7za_real.exe` 同目录）
6. 清理缓存并打包：

```bash
rm -rf "$LOCALAPPDATA/electron-builder/Cache/winCodeSign/"*
pnpm build:win
```

7. 打包完成后恢复原始 7za：

```bash
mv 7za_real.exe 7za.exe
```

> **注意：** 方案三仅应作为临时方案，每次 `pnpm install` 后 wrapper 会被覆盖，需重新设置。

## 缓存路径

electron-builder 缓存目录：`%LOCALAPPDATA%\electron-builder\Cache\`

相关子目录：

| 目录 | 用途 |
|------|------|
| `winCodeSign/` | Windows 代码签名工具 |
| `nsis/` | NSIS 安装包生成器 |
| `nsis-resources/` | NSIS 资源文件 |
| `electron/` | Electron 二进制文件 |

如需强制重新下载，删除对应缓存目录即可。

## 参考

- [electron-builder winCodeSign](https://github.com/electron-userland/electron-builder-binaries/tree/master/winCodeSign)
- [7-Zip symbolic link handling on Windows](https://sourceforge.net/p/sevenzip/discussion/45798/thread/24e46e9d/)
- [Windows Developer Mode - Symbolic links](https://learn.microsoft.com/en-us/windows/apps/get-started/developer-mode-features-and-debugging#sysreqs)
