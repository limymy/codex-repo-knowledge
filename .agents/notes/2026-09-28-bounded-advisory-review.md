# Decision: Bound the knowledge-maintenance reminder

<!-- repo-knowledge:decision -->
Status: implemented

## Problem
Standing instructions can be overlooked during a long coding task. A file-based check cannot determine whether a change needs new explanation, and a missing Markdown diff is not evidence of a documentation defect.

## Decision
Inject the maintenance duties at session startup and after compaction. Track a bounded per-turn Git baseline and accept separate self-reported docs/notes outcomes after the final edit. An unmatched change can request one review continuation; subsequent stops pass. Scripts never write the project's documentation.

## Alternatives considered
Requiring a Markdown diff would reward unnecessary documents and reject correct mechanical changes. Running another model inside a hook would add credentials, latency, cost and potentially a second writer. Using only standing prose would avoid runtime state but provide no deterministic missed-check reminder.

## Consequences
The mechanism can remind without dictating that a note must exist. It accepts honest not-needed or deferred outcomes and cannot prove those judgments are correct. The one-reminder budget and fail-open errors protect usability at the expense of enforcement. Git changes from another process remain indistinguishable from agent edits.

## Evidence
Offline tests exercise real Git worktrees and hook subprocess JSON, including stale receipts and repeated stops. Native Codex delivery and real model behavior remain unverified. See the current verification report rather than interpreting these tests as a model-quality guarantee.

## Reconsider when
A stable host API can identify authorized task edits and surface a low-cost semantic review signal without introducing a second writer. Any stronger blocking policy needs measured false-positive rates and an escape path.

## Related
[Architecture](../../docs/architecture.md) and [verification](../../VERIFICATION.md).
