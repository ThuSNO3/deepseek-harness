# Agent Note: Separate simplification scope from completion depth

Status: implemented

English | [中文](2026-09-03-simplification-scope-and-completion-modes.zh.md)

## Problem

`dsh-find-simplifications` treated broad and narrow surveys as discovery workflows whose durable output was usually a proposed Agent Note. A request to simplify the repository could therefore stop after recording work, even though the request authorized implementation. “Full” was also used informally for repository breadth without saying whether it meant audit-only or completion, while recent-diff and targeted work had no explicit names. The ambiguity made scan breadth determine neither write authority nor the completion condition.

Long repository surveys have a second termination problem. If new upstream commits cause the survey to restart or newly noticed candidates continually join the run, a full simplification has no stable end. Conversely, stopping at the first candidate misses the breadth the user selected.

## Decision

The skill uses two independent mode axes. Scope is `recent`, `targeted`, or `full`; execution is `complete` or `discover`. `recent` is the default scope and never silently expands an empty diff into a repository scan; an unqualified plural such as "recent PRs" requires a repository-owned window or a caller-supplied boundary. `targeted` follows only the named owner and the consumers needed to prove it. `full` surveys every eligible domain at a recorded starting identity, excluding vendored source and frozen archived Agent Notes.

Change, build, refactor, simplify, fix, and delivery requests default to `complete`. Review, audit, report, plan, and proposal-only requests default to `discover` and preserve their read/write authority: "propose" alone means response content, while proposal files require an explicit request to record, add, update, or commit them. “Full” selects breadth only, so an unqualified request to perform a full simplification is `full + complete`; an explicit full audit is `full + discover`. Neither mode authorizes an external commit, push, pull request, merge, issue, or message without separate user authority. Unqualified auto-merge authorization ends at verified enablement; waiting for `MERGED` requires the user to name merging or the merged state as the outcome.

After the selected breadth is surveyed, the run freezes the smallest coherent set of strong, non-overlapping candidates that fits the authorized kind of change and one delivery's risk/review subject. A full run surveys every domain before freezing but does not place every strong candidate into one implementation batch; unrelated or independently risky work remains for later. Recent and targeted runs follow every affected owner and consumer without scanning unrelated packages. Upstream movement triggers a final overlap check rather than restarting the survey, and unrelated candidates discovered during implementation remain for a later run. The frozen set is stated before implementation so the run cannot redefine success around an easier subset.

Every frozen candidate in `complete` mode ends implemented, rejected by implementation evidence, or blocked on a specific need for new authority or external state. Size, elapsed effort, or a separate-commit boundary does not turn a proposal into completion; a candidate with materially different risk or authority stays outside the frozen batch rather than becoming an unresolved promise inside it. Proposed Agent Notes are intermediate: an implemented candidate moves and rewrites its note under `implemented/`; a disproved candidate moves to `rejected/` with the reason. The skill never infers permission for a product behavior change merely because the result seems smaller or reasonable; a behavior contraction must be named or covered by the user's request and must record what it gives up. Independent candidates may use separate commits or pull requests when authorized, but the run remains incomplete while its frozen set contains unresolved proposals.

## Alternatives considered

**Make every invocation implement findings.** Rejected because reviews and audits are intentionally read-only, and a proposal-only request must not gain write authority from a skill default. Execution depth follows the request type or an explicit mode.

**Make `full` mean discovery and add a separate refactor command.** Rejected because breadth and completion are independent. A user may want a recent audit, a full audit, a targeted implementation, or a full implementation; overloading one word cannot express those combinations.

**Keep adding candidates until no simplification remains.** Rejected because an evolving repository never reaches that state. Freezing a proven set after the selected survey gives one run a stable completion condition while later runs can discover new work.

**Always implement one candidate per pull request and stop.** Rejected because pull-request topology is a delivery decision, not the task's completion condition. Separate pull requests may reduce review risk, but they do not discharge the unresolved frozen candidates.

## Consequences

Simplification change requests now produce shipped deletion or consolidation by default rather than a backlog of proposals. Discovery-only work remains available and preserves read-only requests. Full runs have a finite boundary: one broad survey, one frozen candidate set, and an overlap check before delivery. Implementations may still conclude that a candidate loses its expected net-deletion or safety case, but the durable result is an explicit rejection rather than an active proposal that appears ready to build.
