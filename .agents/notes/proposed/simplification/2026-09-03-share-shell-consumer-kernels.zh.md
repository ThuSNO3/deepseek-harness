# Agent Note: 共享 shell Consumer 内核

Status: proposed

[English](2026-09-03-share-shell-consumer-kernels.md) | 中文

## Problem

Bash 与 PowerShell 的模型侧 Consumer 有意提供并行产品行为，但四个包仍复制公共实现。`tool-bash` 与 `tool-pwsh` 重复前台／后台执行、通用 Job 适配、审批升级、schema／应用接线、结果渲染与展示。`tool-bash-persistent` 与 `tool-pwsh-persistent` 重复按拥有者隔离的 shell registry、每个 Agent 的串行化、保留输出轮询、超时／取消／退出后的重置、结果裁剪与 dispose。PowerShell persistent 源码还把完整实现包在 duplication 排除区域中，并明确称它是 Bash 包的刻意镜像。

[PowerShell parity 决策](../../implemented/feature/2026-08-02-pwsh-tool-bash-parity.zh.md)把完全共享的 base 延后到第三种 dialect 或 persistent-PTY twin 使抽象可观察时。[PowerShell persistent 决策](../../implemented/architecture/2026-08-11-pwsh-persistent-pty.zh.md)提供了第二份独立对照：两组实现已显露出稳定的公共生命周期与结果职责，而 quoting、prompt／echo 识别、可执行文件策略及平台细节仍属于 dialect。四个包目前约有 2,100 行源码和 4,400 行测试需要接收并行修复；本提案针对的正是复制的生命周期代码带来的维护成本。

## Proposal

在 shell 分组下提取两个私有实现拥有者：一个负责一次性 Consumer 的执行／结果／Job 接线，另一个负责 persistent session 的归属／轮询／重置接线。四个公共插件包保留现有 npm 名、Cordis 插件名、工具名、配置字段、Service Definition 依赖、schema 与模型可见行为，成为轻量 dialect leaf。共享拥有者是实现库，不是新 capability seam，也不是 Loader row。

每个 dialect leaf 提供显式操作和值，而不是继承有状态 base：命令 wrapper 与 quoting、初始 shell setup、完成／prompt 识别、可执行文件描述、dialect 特有拒绝文本、平台状态规范化，以及确实不同的 schema 文案。共享内核只拥有两个当前 leaf 都实际使用的行为。只有一个 leaf 需要的 hook 留在该 leaf；不要为了通用框架增加可选 callback。

把公共特征测试移到各共享拥有者，同时为两种 dialect 与真实 shell integration 保留聚焦的 leaf 测试。计入 manifest、project reference、adapter 与测试后，重构删除的源码和测试必须多于新增量。只在共享拥有者确实消除重复时删除 duplication-ignore 区域。如果测得的净删除不显著，应拒绝本提案，而不是只搬运代码。

## Alternatives considered

**保留刻意 twins 来发现行为漂移。** 不采用。两份真实实现的差异在验证抽象时很有用，例如两个 LLM adapter。这里两组 shell Consumer 已共享一个 Service Definition 并承诺 parity；复制的编排代码已经多次要求两侧同步修复。独立 dialect adapter 与真实 integration test 可以保留跨 dialect 验证，无需拥有两份相同生命周期 controller。

**让 `tool-pwsh` 直接依赖 `tool-bash`。** 不采用。任一 dialect 都必须能独立组合，兄弟 Consumer 也不是公共行为的拥有者。实现拥有者位于两个 leaf 之下，不含 Bash 专属产品身份。

**用 dialect 配置创建一个通用 shell 工具。** 不采用。包选择、工具名、平台组合、schema 文案、可执行语义与 persistent wrapper protocol 仍是不同产品选择。本提案只去重私有机制，不折叠四个公共 leaf。

**提取每一处结构相似的代码。** 不采用。表面上的对称可能掩盖 dialect 安全约束。Quoting、prompt 识别、CRLF／exit 规范化、拒绝细节与真实进程 integration 继续留在本地，除非两个现有 dialect 都证明完全相同的约定。

## Acceptance criteria

- 两个私有拥有者包含实际使用的公共一次性与 persistent Consumer 机制；四个公共插件包继续可独立加载。
- Bash 与 PowerShell quoting、wrapper 构造、prompt／echo 识别、可执行文件策略、平台状态行为、包／工具身份、配置与模型侧 schema 继续归 leaf 拥有。
- 前台／后台 Job、升级、超时、取消、输出保留／spill、session 重置、拥有者隔离、HMR dispose 与完全停稳的关闭行为在外部保持不变。
- 计入所有新 glue 与包接线后，最终 diff 证明生产代码和测试有显著净删除。
- 单元、真实 Bash／PowerShell、Loader 组合、snapshot、coverage、build、duplication 与文档检查在适用平台通过。

## Risks

公共内核可能抹去 dialect 特有的安全差异，或把简单成对实现变成 callback 过多的框架。显式 operation object 边界与净删除要求会限制该风险。共享缺陷可能同时影响两种 dialect，因此即使公共单元测试迁移，leaf 级真实进程测试仍属必需。
