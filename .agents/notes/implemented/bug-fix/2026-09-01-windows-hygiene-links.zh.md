# Agent Note: 让 Windows hygiene 检查不依赖符号链接权限

Status: implemented

[English](2026-09-01-windows-hygiene-links.md) | 中文

## Problem

两项 hygiene 检查要求 Windows 文件符号链接权限，但其检查对象本身并不需要该权限。NodeNext consumer 检查用文件系统 symlink 连接 workspace package 目录与 Node 声明。Git 无法创建 symlink 时，会把 mode 120000 的 Cordis config link 签出为普通文本 stub，Cordis config discovery 随后把该文本当 YAML 解析。普通非提权 checkout 因此会在检查 package declaration 或 canonical Loader file 之前失败。

## Decision

NodeNext consumer fixture 在 Windows 使用 directory junction，在其他平台使用 directory symlink。两者都解析到真实 package 目录，同时保留临时外部 consumer 布局。

Cordis config discovery 排除文件系统 symlink 或 Git index mode 120000 路径。Canonical target 仍会在自己的 repository path 被独立发现和扫描；只有 alias 被排除。

## Alternatives considered

**要求 Windows Developer Mode 或管理员提权。** Hygiene 检查必须能在普通开发与 CI shell 中运行，其检查对象不需要特权链接创建。

**在 Windows 跳过检查。** 这会移除受支持平台上的 declaration compatibility 与 Loader metadata 覆盖。

**把纯文本 link stub 解析为路径并跟随。** 这会重复扫描 canonical target，使 config discovery 与 checkout 表示耦合，并可能引入预定 glob scope 外的路径。

## Consequences

Windows 无需提权即可运行相同 NodeNext 与 Cordis config 断言。Junction 只存在于临时 NodeNext fixture；config discovery 仍会把每个 canonical in-scope Loader YAML 文件扫描一次。
