# Agent Note: Prune remaining dead public API and result fields

Status: proposed

English | [中文](2026-07-04-prune-dead-core-spine-api.zh.md)

## Problem

Several public methods, result fields, lifecycle hooks, and package-root exports have no fixed production consumer. Tests and generated Cordis reflection keep them visible, so they enlarge the pre-release API and invite implementations to preserve unused states. The production corpus for this inventory is package and application source, runtime scripts, and shipped Cordis configuration; tests, READMEs, generated catalogs, and Agent Notes establish publication but are not fixed callers.

`cordis_inspect` and `cordis_mount` make service methods and returned fields a real dynamic product surface. Removing a catalogued member is therefore an intentional pre-release contraction even when no repository source calls it. Package-root implementation helpers are different: Loader namespace imports mount the plugin contract, while tests can import owning source modules without publishing every helper at the package root.

The current exact-symbol inventory is:

| API element | Consumer evidence | Simplification |
| --- | --- | --- |
| `AgentSetupCommit` and the return branch of `AgentSetup` | Agent-loop is the only code that invokes `commit()`; every production setup callback in ACP, Webhook, API Session Controller, Headless, and preset composition returns `void` or `Promise<void>`. Only loop tests produce a finalizer. | Make setup return only `void`/`Promise<void>` and remove the publication-finalizer branch, its rollback cases, and the catalog/docs that advertise mutable provisioning revalidation. |
| `PlanModeController.get()` / `set()` | `get()` has no fixed production caller; the `/plan` handler inside the class is the only fixed caller of `set()`. Outside the package they appear in tests, docs, and generated reflection. | Remove `get()` and make selection an internal operation used by `/plan`; keep the command, exit tool, prompt section, durable projection, pending-intent timing, and model-visible behavior. |
| `CompactionResult.startSeq`, `endSeq`, and `summary` | Production consumers read shadowed range/seq/token accounting and `command-compact` reads `summarySeq` for `CommandResult.sourceEventSeq`; no production consumer reads the three listed echoes. Durable events own their values. | Remove only the three unused fields and simplify result construction. Retain `summarySeq`, which is load-bearing, plus the compaction lifecycle and transcript renderers. |
| `tool-fs-search` package-root implementation exports | Exact production searches find no outside-package named consumer of the re-exported glob/grep builders, parsers, formatters, presenters, constants, error class, or run helpers. The plugin itself imports its local owners and Loader consumers need `name`, `inject`, `Config`, and `apply`. | Stop re-exporting implementation modules from the package root; same-package tests import their source owners. Keep the plugin/config contract and any value proven necessary by a real external consumer during implementation. |
| `tool-web` package-root implementation exports | Exact production searches find no outside-package named consumer of the search/fetch apply helpers, formatters, presenters, metadata converters/types, or default constants. Runtime composition mounts the namespace plugin. | Keep `name`, `inject`, `Config`, and `apply`; make search/fetch implementation helpers source-private and move tests to their owning modules. |
| `SubagentDepthError` root export | Production code throws it inside the package but no production package imports the concrete class; fixed callers handle the service's public error/result contract. | Keep depth enforcement and its diagnostic, but make the concrete enforcement error package-private and test through the start boundary. |

The earlier inventory entries that are absent from this table are not part of the proposal. Current code already returns `void` from `BlockAssembler.push()`, keeps `ReactLoopAgent` and worker protocols off package roots, omits duplicate `ToolExecutionResult.callId`, `ToolNotFoundError.toolName`, and `SystemPrompt.config` fields, and uses `CodeRuntime.language`/`isolation` plus `LlmError.status` in production. An implementation follows the table above rather than treating an older symbol list as authority.

## Proposal

Remove or demote each table row as one public-surface cleanup, split into reviewable commits by owning package. Update package READMEs, JSDoc, subsystem pages, generated Cordis reflection, type-equivalence records, and tests together. Tests import private source modules or exercise public behavior instead of keeping a helper exported.

Before changing each row, repeat the exact production search against the implementation branch and retain any member that acquired a real caller. Do not collapse a capability seam, remove dialect/provider twins, weaken publication rollback or close-to-quiescence, or delete `CompactionResult.summarySeq`.

## Alternatives considered

**Keep test conveniences and self-contained result echoes public.** Public helpers simplify white-box imports, and returning every lifecycle event value can look ergonomic. Tests can import source owners, while durable events remain the authority for compaction details. A real consumer can add the smallest API it needs with known ownership and failure semantics.

**Keep `AgentSetupCommit` for future mutable provisioning.** The finalizer is a legitimate commit-point design, but no current producer uses it. Setup already remains unpublished and rollback-safe while its asynchronous work settles. A future provisioning source that can change between preparation and publication can introduce a transaction with the exact revalidation it needs instead of making every setup carry an unused union branch.

**Keep `PlanModeController.set()` for dynamic Cordis mounts.** Model-written mounts and out-of-tree Host plugins can call it today, but the supported product controls are `/plan` and `exit_plan_mode`, which own user input, narration, review, and durable timing. A generic setter bypasses those product interactions without a current owner.

**Keep every package-root helper as an informal library.** The function-plugin root is a Loader contract, not a convenience barrel. Publishing implementation functions creates compatibility surface without demonstrating an independently supported library use.

## Acceptance criteria

- Every table row is absent or demoted as specified, after a fresh exact-symbol search confirms no new production consumer.
- Agent creation/resume retains unpublished setup, cancellation, rollback, scoped contribution ordering, persistence suffix handling, publication, and disposal behavior without the unused finalizer.
- Plan mode retains its command/tool UX, durable state, projection, prompt guidance, pending selection, narration, and review settlement.
- Compaction retains `summarySeq`, lifecycle events, automatic/manual operation, cancellation, shadow accounting, and transcript behavior.
- Filesystem search and Web tools keep the same schemas, configuration, model-visible output, presentation, timeout, spill, and provider behavior while their roots expose only supported plugin API.
- Focused behavior tests, snapshots where output can move, typecheck, coverage, generated catalogs, build, hygiene, and documentation checks pass.

## Risks

The service-method and result-field changes are compile-visible product contractions for dynamic mounts and pre-release embedders. Removing `AgentSetupCommit` gives up an unused publication-time revalidation hook; privatizing plan selection gives up a direct programmatic switch outside the supported interactions. Package-root demotion can break imports that the repository does not exercise. The pre-release stance permits these breaks, but each row must be re-proven immediately before implementation.
