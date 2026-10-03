# Decision: Bound the knowledge-maintenance reminder

<!-- repo-knowledge:decision -->
Status: implemented

## Problem
Standing instructions can be overlooked during a long coding task. A file-based check cannot determine whether a change needs new explanation, and a missing Markdown diff is not evidence of a documentation defect. A useful reminder therefore needs to ask for judgment without demanding unnecessary writing or trapping the user in a continuation loop.

The later native integration also exposed an ownership problem: the hook's plugin-data directory was outside the model tool sandbox, so having the model persist its own review could fail even after legitimate project work. Repeated or out-of-order Stop messages introduced a separate risk: a previously reported review could be incorrectly attached to a newer filesystem snapshot.

## Decision
Inject the maintenance duties at session startup and after compaction. Track a bounded per-turn Git baseline and accept separate self-reported docs/notes outcomes after the final edit. An unmatched change can request one review continuation; subsequent stops pass. Scripts never write the project's documentation.

Keep knowledge judgment with the agent and receipt persistence with the host Stop hook. The agent reports independent outcomes in its final answer; the host recognizes a bounded, strict last-line grammar and associates the report with its current snapshot. This keeps the default protocol within existing model write permissions and avoids a transcript reader or another model inside the hook. The explicit review CLI remains available for compatibility, not as a requirement for normal completion.

Keep observed valid-message history separate from the latest reviewed snapshot. Remember an observed message even if no review was needed when it arrived; otherwise replaying it after an edit could manufacture freshness. Persist the reminder budget before asking for continuation. When safe tracking or persistence is unavailable, fail open rather than substitute an unbounded retry, a new write permission or an assumed successful review. Current mechanics and limits are owned by [architecture](../../docs/architecture.md).

## Alternatives considered
The original reminder decision considered the following approaches:

- Requiring a Markdown diff would reward unnecessary documents and reject correct mechanical changes.
- Running another model inside a hook would add credentials, latency, cost and potentially a second writer.
- Using only standing prose would avoid runtime state but provide no deterministic missed-check reminder.

The later protocol has evidence for two concrete corrections. Model-written receipts were implemented, but the recorded native sandbox failure made them unsuitable as the default. Remembering valid messages only when a new receipt was written left unchanged and already-reviewed snapshots open to later replay; the recorded regression review identified that gap and the current implementation tracks those observations separately.

There is no recorded comparison establishing that eight remembered hashes or seven-day state expiry are optimal. They are current bounded implementation choices, not measured semantic guarantees. Transcript parsing and wider model write access are excluded by the selected boundary; this record does not claim they were tested alternatives.

## Consequences
The mechanism can remind without dictating that a note must exist. It accepts honest not-needed or deferred outcomes and cannot prove those judgments are correct. Host-owned persistence removes the normal receipt-writing tool call and its sandbox dependency, but requires the host to supply the current final answer and the agent to use the agreed format.

The one-reminder budget and fail-open errors protect usability at the expense of enforcement. An unavailable host field, incomplete snapshot, missing/expired state, lock or write failure, or exhausted message-history budget can leave changes without a fresh receipt. No continuation is not the same as successful review. A fresh answer can report the same outcomes, but a different message hash still does not prove a new semantic check.

Git changes from another process remain indistinguishable from agent edits. Per-turn state and locking prevent state collisions; they do not isolate the shared worktree or prove that a snapshot and final answer describe the same authorized edits. Existing permissions, code review and application tests remain necessary.

## Evidence
This record retains the original 2026-09-28 advisory decision. Its host-owned persistence and replay rationale were consolidated on 2026-10-03 from the existing implementation, tests and recorded 2026-09-30 findings; this is retrospective clarification, not a newly implemented protocol or an assertion that all details were chosen on September 28.

- Observed history: [VERIFICATION.md](../../VERIFICATION.md) records the model-side plugin-data sandbox failure, later native host-owned receipts without widened model permissions, and the two complete-snapshot replay corrections. At the original decision date, native delivery and model behavior were unverified.
- Current implementation: [runtime.mjs](../../scripts/lib/runtime.mjs) separates observed hashes, review digest and reminder budget; [final-status.mjs](../../scripts/lib/final-status.mjs) reads only the supplied current message; [store.mjs](../../scripts/lib/store.mjs) and [hook.mjs](../../scripts/hook.mjs) implement bounded state and the fail-open process boundary.
- Deterministic evidence: [final-status tests](../../tests/final-status.test.mjs) exercise a real permission-denied model-side writer followed by host collection, stale and out-of-order messages, unchanged/already-reviewed observations, and receipt collection after a reminder. [Runtime tests](../../tests/runtime.test.mjs) cover independent turns, unchanged dirt, duplicate prompts, expired/corrupt state and the one-reminder budget.
- Limits: the recorded native runs support normal collection in their specific CLI/model/Linux setup. The exact replay sequences and missing-status reminder-to-continuation path remain deterministic coverage, not completed native branch acceptance. Neither these tests nor successful receipt storage establishes model-quality reliability.

## Reconsider when
A stable host API can identify authorized task edits and surface a low-cost semantic review signal without introducing a second writer. Any stronger blocking policy needs measured false-positive rates and an escape path.

## Related
[Architecture](../../docs/architecture.md) owns current behavior. The separate [native packaging and Git isolation decision](2026-09-30-native-packaging-and-git-isolation.md) owns manifest discovery and executable Git-configuration risks; it remains active and is not superseded by this clarification.
