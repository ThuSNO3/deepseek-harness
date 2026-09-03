# Agent Note: Share the shell Consumer kernels

Status: proposed

English | [中文](2026-09-03-share-shell-consumer-kernels.zh.md)

## Problem

The Bash and PowerShell model-facing Consumers intentionally provide parallel product behavior, but their common implementation remains copied across four packages. `tool-bash` and `tool-pwsh` repeat foreground/background execution, generic Job adaptation, approval escalation, schema/application plumbing, result rendering, and presentation. `tool-bash-persistent` and `tool-pwsh-persistent` repeat the owner-scoped shell registry, per-Agent serialization, retained-output polling, timeout/cancel/exit reset, result clipping, and disposal. The PowerShell persistent source wraps its complete implementation in a duplication exclusion and names it a deliberate mirror of the Bash package.

The [PowerShell parity decision](../../implemented/feature/2026-08-02-pwsh-tool-bash-parity.md) deferred a fully shared base until a third dialect or a persistent-PTY twin made the abstraction observable. The [persistent PowerShell decision](../../implemented/architecture/2026-08-11-pwsh-persistent-pty.md) supplies that second independent comparison: the two pairs now expose stable common lifecycle and result responsibilities, while quoting, prompt/echo recognition, executable policy, and platform details remain dialect-specific. Across the four packages, about 2,100 source lines and 4,400 test lines currently receive parallel fixes; the copied lifecycle code is the maintained cost this proposal targets.

## Proposal

Extract two private implementation owners under the shell group: one for one-shot Consumer execution/result/Job plumbing and one for persistent-session ownership/poll/reset plumbing. Keep the four public plugin packages as thin dialect leaves with their existing npm names, Cordis plugin names, tool names, configuration fields, Service Definition dependencies, schemas, and model-visible behavior. The shared owners are implementation libraries, not new capability seams or Loader rows.

Each dialect leaf supplies explicit operations and values rather than subclassing a stateful base: command wrapping and quoting, initial shell setup, completion/prompt recognition, executable description, dialect-specific denial text, platform status normalization, and any schema wording that differs. The shared kernels own only behavior that both current leaves exercise. A hook required by one leaf alone stays in that leaf; do not add optional callbacks to make a generic framework.

Move common characterization tests to each shared owner while retaining focused leaf tests for both dialects and real-shell integration. The refactor must delete more source and test code than it adds after manifests, project references, adapters, and tests are counted. Remove duplication-ignore regions only where the shared owner eliminates the duplication. If measured net deletion is not substantial, reject this proposal rather than landing a relocation.

## Alternatives considered

**Keep deliberate twins to detect behavioral drift.** Independent real implementations are useful where their differences test an abstraction, as with the two LLM adapters. Here both shell Consumer pairs already share one Service Definition and promise parity; copied orchestration has repeatedly required the same fixes on both sides. Separate dialect adapters and real integration tests preserve cross-dialect verification without owning two copies of the same lifecycle controller.

**Make `tool-pwsh` depend directly on `tool-bash`.** Rejected because either dialect must remain independently composable, and a sibling Consumer is not the owner of their shared behavior. The implementation owner sits below both leaves and contains no Bash-only product identity.

**Create one universal shell tool with a dialect config.** Rejected because package selection, tool names, platform composition, schema text, executable semantics, and persistent wrapper protocols remain distinct product choices. This proposal deduplicates private machinery without collapsing the four public leaves.

**Extract every structurally similar line.** Rejected because superficial symmetry can hide dialect safety constraints. Quoting, prompt detection, CRLF/exit normalization, denial details, and real-process integration remain local unless both current dialects prove an identical contract.

## Acceptance criteria

- Two private owners contain the exercised common one-shot and persistent Consumer machinery; the four public plugin packages remain independently loadable.
- Bash and PowerShell quoting, wrapper construction, prompt/echo recognition, executable policy, platform status behavior, package/tool identities, configuration, and model-facing schemas remain leaf-owned.
- Foreground/background Jobs, escalation, timeout, cancellation, output retention/spill, session reset, owner isolation, HMR disposal, and close-to-quiescence behavior remain externally unchanged.
- The outgoing diff demonstrates substantial net deletion across production code and tests after all new glue and package wiring are counted.
- Unit, real Bash/PowerShell, Loader composition, snapshot, coverage, build, duplication, and documentation checks pass on their applicable platforms.

## Risks

A common kernel can erase a dialect-specific safety distinction or turn a simple pair into a callback-heavy framework. The explicit operation-object boundary and net-deletion requirement limit that risk. A shared defect can affect both dialects at once, so leaf-level real-process tests remain mandatory even when common unit cases move.
