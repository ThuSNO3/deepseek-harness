# Agent Note: 将浏览器 fixture 降级到测试支撑

Status: proposed

[English](2026-09-03-demote-browser-fixture-to-test-support.md) | 中文

## Problem

`packages/client/connection/src/client/fixture.ts` 是一套约 3,600 行的内存 Host RPC 仿真实现。已发布的 Connection Client 静态导入它，并在页面 query 含 `fixture` 时选用它，因此每份 `lib/client.js` 都携带这个伪 Host；任何已提供服务的产品页面只要加上 `?fixture`，就会用该伪实现替换真实 transport。固定 session、settings、credentials、workspace、目录树、prompt、流式时序、搜索排序、projection 与故障开关都在复刻生产 Host 包拥有的行为，却没有运行这些真正的拥有者。

仓库中的固定消费方都是测试或开发诊断：Connection fixture 测试、jsdom 组装启动测试、浏览器预期输出用例，以及显式启用的 100,000 chunk 压力车道。Web snapshot 语料已经通过录制 session 启动随附 profile 来验证产品行为，其余 fixture 消费方需要的是确定性测试替身，而不是产品 query 开关。[Web 浏览器测试决策](../../implemented/testing/2026-07-24-web-gui-browser-e2e-lane.zh.md)已把 `?fixture` 定义为不覆盖 Client API 以下层级的 Client shell 替身；[录制 session 语料](../../implemented/testing/2026-08-24-session-log-snapshot-corpus.zh.md)负责真实组装产品路径。

## Proposal

从 `@deepseek-ai/dsh-client-connection` 的 Client program 与发布 bundle 中移除 `fixture.ts`。生产插件始终根据页面的物理 transport 构造 RPC channel，并把 `fixture` 当作无特殊含义的普通 query key。包描述不再声称提供「browser fixture」，同时删除只为解释 fixture query 参数而存在的产品源码分支。

把确定性状态图及其开关移到测试支撑 Client 插件或 `apps/web/tests` 构建入口；该入口只在测试与显式开发组合中提供同一个 `ctx.connection` 服务。组装 jsdom、预期输出与压力测试通过自身 boot graph 加载该入口，不再依靠产品 URL 选择。保留覆盖展示状态的原始事件样本，但不要因为伪实现当前复刻了排序、校验或生命周期时序，就继续维护这些 Host 算法；只需要一帧的测试使用窄脚本响应，Host 行为本身则使用真实 Web profile 与录制 session。

这项变更必须缩小随附 Connection Client 产物及其运行时依赖闭包。把完整文件原样搬进另一个已发布产品包不算完成；测试专属归属，以及删除已被录制 session 场景替代的镜像，都是验收条件。

## Alternatives considered

**为了方便开发而保留 `?fixture`。** 不采用。无服务器页面便于调试展示，压力车道也需要确定性的高频生产方，但显式测试／开发入口仍可提供这些能力；无需让每个生产产物携带伪 Host，也无需保留一个绕过真实 transport 的公共 URL 开关。

**删除 fixture，并把所有用例改成真实 profile 浏览器场景。** 不采用。组件组装与 100,000 chunk 压力生产方需要低成本、确定性的输入；让真实 Host 制造极端数据流会把性能诊断与模型、持久化设置耦合。按测试对象拆分：产品行为走真实 profile，纯 Client 组装与压力测试走测试支撑。

**公开一个接受 `ClientConnectionRpc` 的通用生产 hook。** 不采用。这样会把测试逃生口变成受支持的产品注入 API。现有物理 transport hook 继续服务于真正拥有 Host carrier 的 shell；测试组合可以替换 Connection 插件本身。

## Acceptance criteria

- `@deepseek-ai/dsh-client-connection` 不再包含 fixture 实现、`?fixture` 分支、fixture query 解析，也没有把测试数据保留进 `lib/client.js` 的静态 import。
- 已构建并提供服务的页面无论是否带 `fixture` query key，都只使用所配置的物理 transport。
- 确定性的纯 Client 组装测试与显式启用的压力车道加载独立测试支撑入口，并保留外部断言。
- 产品可见 Web 流程继续通过随附 profile 与录制 session snapshot harness；真实 Host 约定不只由伪实现断言。
- Bundle 检查证明随附 Connection 产物净缩小，GUI、Web replay、构建、包与文档检查通过。

## Risks

手工 UI 开发必须启动显式测试入口，不能再给任意产品页面加 query 参数。误依赖 fixture 仿真 Host 行为的测试可能需要迁移到录制 session 场景，或改用更窄的脚本响应。测试入口仍会携带需要维护的样本数据，但它的漂移不再作为休眠代码进入生产产物。
