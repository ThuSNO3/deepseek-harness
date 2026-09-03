# Agent Note: 分离 simplification 范围与完成深度

Status: implemented

[English](2026-09-03-simplification-scope-and-completion-modes.md) | 中文

## Problem

`dsh-find-simplifications` 把宽泛与局部巡查都当成 discovery 工作流，其持久化产出通常是 proposed Agent Note。因此，即使请求已经授权实施，精简仓库的任务仍可能在记录工作后停止。「Full」也只是非正式地表示全仓范围，没有说明它指 audit-only 还是完成实施；近期 diff 与定向工作则没有明确名称。这种歧义让扫描范围既不能决定写权限，也不能定义完成条件。

长时间全仓巡查还有第二个终止问题：如果每次上游新增 commit 都重启巡查，或持续把新发现候选加入当前任务，full simplification 将永远没有稳定终点。反过来，找到第一个候选就停止，又没有覆盖用户选择的广度。

## Decision

该 skill 使用两条独立模式轴。范围为 `recent`、`targeted` 或 `full`；执行深度为 `complete` 或 `discover`。`recent` 是默认范围，空 diff 绝不静默扩张成全仓扫描；「recent PRs」之类未限定的复数范围必须使用仓库自有窗口，或由调用方补充边界。`targeted` 只跟踪用户点名的 owner，以及证明该对象所需的消费方。`full` 在记录的起始 identity 上巡查每个合格领域，并排除 vendored source 与冻结的 archived Agent Note。

Change、build、refactor、simplify、fix 与 delivery 请求默认使用 `complete`。Review、audit、report、plan 与只提案请求默认使用 `discover`，并保留原请求的读写权限：只说「propose」表示在回复中给出提案；写 proposal 文件必须明确要求 record、add、update 或 commit。「Full」只选择广度，因此未限定的 full simplification 请求是 `full + complete`，明确的全仓 audit 则是 `full + discover`。如果没有单独的用户授权，任何模式都不允许执行外部 commit、push、PR、merge、issue 或 message。未限定的 auto-merge 授权以验证功能已启用为终点；只有用户把 merge 或 merged 状态点名为结果时，才等待 `MERGED`。

完成所选范围的巡查后，当前 run 会冻结一组最小、连贯、证据充分且互不重叠，并符合已授权变更类型和单次交付风险／审阅主题的候选。Full run 在冻结前巡查每个领域，但不会把每个强候选都塞进同一个实施批次；无关或风险独立的工作留待后续。Recent 与 targeted run 会跟踪所有受影响 owner 和消费方，但不扫描无关包。上游变化只触发交付前的重叠检查，不会重启巡查；实施时发现的无关候选留给后续 run。实施前会明确冻结集合，禁止事后把更容易完成的子集重新定义为成功。

`complete` 模式中的每个冻结候选都必须以三种状态之一结束：已实现、被实施证据否决，或因明确需要新增权限／外部状态而阻塞。规模、耗时或需要单独 commit 都不能把写完 proposal 变成完成；需要不同权限或具有显著不同风险的候选应留在冻结批次之外，而不是在其中形成未解决承诺。Proposed Agent Note 是中间产物：候选实施后，记录移动并改写到 `implemented/`；候选被证伪后，记录移动到 `rejected/` 并写明原因。Skill 绝不能仅因另一种结果更小或看似合理，就推断用户允许产品行为变化；行为收缩必须由用户点名或包含在请求中，并记录放弃了什么。获得授权时，独立候选可以使用不同 commit 或 PR，但冻结集合仍有未解决 proposal 时，当前 run 尚未完成。

## Alternatives considered

**让每次调用都实施发现项。** 不采用。Review 与 audit 有意保持只读，只要求 proposal 的请求也不能因 skill 默认值获得写权限。执行深度由请求类型或显式模式决定。

**让 `full` 表示 discovery，再增加独立 refactor 命令。** 不采用。广度与完成深度彼此独立。用户可能需要近期 audit、全仓 audit、定向实施或全仓实施；把两者塞进同一个词无法表达这些组合。

**持续加入候选，直到仓库没有可精简内容。** 不采用。持续变化的仓库永远不会达到这种状态。完成所选巡查后冻结已证明候选，能让单次 run 有稳定完成条件，后续 run 仍可发现新工作。

**每个 PR 固定只实现一个候选，然后停止。** 不采用。PR 拓扑是交付决策，不是任务完成条件。拆分 PR 可以降低审阅风险，但不能消除冻结集合中尚未解决的候选。

## Consequences

精简类变更请求现在默认交付实际删除或合并，不再只积累 proposal。Discovery-only 仍然可用，并保留只读请求的权限。Full run 具有有限边界：一次广泛巡查、一个冻结候选集合，以及交付前的一次重叠检查。实施仍可能证明某个候选无法实现预期净删除或安全收益，但持久化结果会是明确 rejection，而不是一份看似可立即实施的 active proposal。
