# Architecture

This page owns the current component boundaries and maintenance-receipt protocol.
For user-facing settings and final-line syntax, use [configuration](configuration.md);
for durable reasons, use the [advisory-review decision](../.agents/notes/2026-09-28-bounded-advisory-review.md).

## Implementation map

| When changing or investigating… | Start here | Boundary to preserve |
| --- | --- | --- |
| Host event input/output and safe errors | [hook.mjs](../scripts/hook.mjs) | Bounded stdin, JSON output, fixed fail-open errors; no transcript fallback |
| Startup duties and turn transitions | [runtime.mjs](../scripts/lib/runtime.mjs), [bootstrap.md](../rules/bootstrap.md) | Guidance does not authorize edits; one persisted reminder budget per turn |
| Final-answer recognition | [final-status.mjs](../scripts/lib/final-status.mjs) | Closed grammar, independent outcomes, current host message only |
| What counts as a changed snapshot | [git.mjs](../scripts/lib/git.mjs) | HEAD, index and worktree identity; bounded observation without author attribution |
| State ownership and file safety | [store.mjs](../scripts/lib/store.mjs), [io.mjs](../scripts/lib/io.mjs) | Outside-project state, per-turn exclusion and checked local file access |
| Project options and note validation | [config.mjs](../scripts/lib/config.mjs), [notes.mjs](../scripts/lib/notes.mjs) | Options cannot grant permission; opt-in structure checking cannot grade reasoning |
| Optional execution diagnostics | [diagnostics.mjs](../scripts/lib/diagnostics.mjs) | Separate bounded records, not delivery or model-consumption proof |

The [test guide](testing.md) maps these contracts to focused regression groups.
The operator entry point, [rk.mjs](../scripts/rk.mjs), exposes inspection and
compatibility commands; it is not the native hook dispatcher.

## Instruction delivery and authority

`.codex-plugin/plugin.json` is the supported Codex manifest; `hooks/hooks.json` uses default discovery without a manifest `hooks` field. The repository marketplace references the repository root. Native discovery on CLI 0.159.0-alpha.7 found that the original dual portable/compatibility package exposed skills but no hooks; compatibility-only packaging exposes all three. See [packaging decision](../.agents/notes/2026-09-30-native-packaging-and-git-isolation.md).

`SessionStart` injects the bundled `rules/bootstrap.md` with resource locations. The implicit `repo-knowledge` skill routes current documentation and durable decisions to separate references. The explicit-only setup skill optionally merges project-specific instructions with permission. This plugin does not depend on the user invoking a workflow every turn, but execution requires host support, enabled/trusted hooks, and model compliance.

The responsibilities are separate: hooks deliver guidance and track bounded operational state; the agent retrieves knowledge and edits authorized project files; maintainers judge whether those edits are correct. The same repository writing rules can be followed directly by a maintainer without running a model session. Native tests are needed to establish host delivery and model behavior, not to author the plugin's own documentation.

Repository text is not promoted into the hook's developer context. Resource paths are JSON data, not executable commands. Higher-priority instructions, direct user scope and local conventions remain controlling; a reminder grants no extra permission. The maintenance handler ignores identified subagent events (`agent_id`). Plan mode receives startup guidance, but does not collect change receipts or trigger Stop reminders. Optional script diagnostics wrap this handler separately, so a diagnostic event does not establish participation in turn tracking.

The [functional contract](functional-contract.md) distinguishes DSH native dynamic instruction loading from this Codex adaptation. SessionStart reinjects responsibilities and asks for targeted rule refresh; it does not itself reload project instructions or guarantee later knowledge retrieval.

## Turn lifecycle

### Baseline and scope

`UserPromptSubmit` discovers the Git worktree and records a bounded baseline under host-provided `PLUGIN_DATA`. The state key hashes the canonical repository root, `session_id` and `turn_id`. Duplicate prompt events retain the original baseline and reminder budget. The handler asks for a short final maintenance status; it supplies neither a state-writing command nor an opaque state identifier to the model.

`Stop` uses only that matching turn's existing state. Missing state is not permission to construct a baseline from old changes. Both the baseline and current snapshot must be complete before any final-message history or receipt is recorded. Tracking is skipped for disabled projects, `stopReminder: "off"`, plan mode and identified subagents; those gates do not transfer review to another turn. See [configuration](configuration.md) for the distinction between disabling reminders and disabling the plugin.

### Stop decisions and ordering

The parser accepts only the exact final plain-text status in the host's current
`last_assistant_message`, with a 16 KiB UTF-8 limit on the entire message. It
normalizes CRLF and trailing whitespace before hashing the message; it does not
hash only the status line. The supported English/Chinese forms and separation
from lists, quotes and code are owned by [configuration](configuration.md).

A snapshot needs review only when its digest differs from both the turn baseline
and the latest recorded review digest. For a matching turn with complete
snapshots and valid state, these branches are ordered as follows:

| Condition | Persisted effect | Host response |
| --- | --- | --- |
| A valid message hash is not already remembered and fewer than eight are remembered | Remember the hash; if this snapshot needs review, also store the outcomes and current digest | No continuation |
| A new valid hash would be the ninth | Keep the existing history and review unchanged | Warning, no continuation |
| No new valid hash, and the snapshot equals the baseline or latest review | None | No continuation |
| No new valid hash, and the reminder was already spent or `stop_hook_active` is true | None; a stale review remains stale | No continuation |
| Review is needed, but the host message is missing, non-string or oversized | No new receipt; existing review unchanged and reminder budget available | Warning, no continuation |
| Review is needed, no fresh valid status exists, and the host supplied a bounded string | Persist `reminded: true` before responding | One `decision: "block"` advisory continuation |

An active Stop continuation with no valid status returns before state lookup.
An active continuation with a fresh valid status can still take the first branch:
preventing another reminder does not prevent receipt collection. Once spent, the
reminder budget is not reset by later edits or a duplicate Prompt event.

### Message history is not a receipt

An automatically collected `review` associates two outcome enums with one snapshot digest, a
timestamp, fixed reason, message hash and `source: "stop-final-status"`.
`acceptedFinalHashes` separately remembers up to eight distinct valid messages,
including messages first seen on unchanged or already-reviewed snapshots. Such
observations must not create a receipt merely to populate replay history.

For example, a valid final answer A successfully remembered before any edit leaves
`review` empty. If a file later changes, replaying A in the same surviving turn
state cannot acknowledge that change. Likewise, an answer B remembered after a snapshot was already reviewed
cannot be reused after another edit. A newly worded answer with the same two
outcomes is a different hash and may be recorded; this is duplicate-message
protection, not proof that the agent actually reread or understood the changes.
The [final-status regressions](../tests/final-status.test.mjs) cover both cases.

An empty Stop output is therefore not evidence of a successful receipt: it also
occurs for unchanged work, missing state, scope exclusions and exhausted reminder
budget. Read-only unchanged tasks need no status or receipt. All recorded outcomes
remain self-reports, not proof of semantic correctness, authorship or awareness of
concurrent changes.

The optional legacy `review` CLI still accepts `--turn-state-id` or legacy `--key`.
It writes plugin state directly and does not use automatic final-message replay
collection. It is not the normal model workflow and may be denied by the model's
filesystem sandbox. The host-owned default does not require expanding that sandbox.

## Operational state and failure handling

`scripts/hook.mjs` reads at most 1 MiB of event JSON, delegates lifecycle decisions to `scripts/lib/runtime.mjs`, and writes the result to the host. Its caught input/runtime errors produce a fixed fail-open `systemMessage` without requesting continuation. This process-level catch is distinct from the intentional one-time `decision: "block"` response; direct callers of `handleEvent` can receive thrown errors and must not assume the helper itself implements the process boundary.

Turn state lives outside the repository in the host's plugin-data directory.
`store.mjs` enforces path containment and attempts an exclusive lock for the turn;
it does not wait, retry or steal an existing lock. Writes use a temporary file
followed by rename. Normal collection and reminder responses follow successful
state writes. If the write or lock fails, the hook returns the safe error response
instead of requesting an unrecorded continuation. This sacrifices tracking for
that event; it does not establish that a review happened or make the working tree
transactional.

The safe error response is not a rollback guarantee: the rename may have completed
before lock cleanup or output delivery fails. Nor does rename alone promise
crash-durable storage. When the distinction matters, inspect the matching state
through the authorized host context; do not infer persisted receipt presence or
absence solely from a no-op, warning or diagnostic result.

States older than seven days from creation are ignored, not automatically deleted.
Missing identifiers or data, incomplete snapshots, lock conflicts and invalid
state disable the affected tracking path, sometimes with a warning. Replay
protection depends on successfully persisted history, available unexpired state
and complete snapshots; it does not reconstruct missing history. The user-facing
storage and cleanup contract lives in [configuration](configuration.md), and file-access limits in
[security](../SECURITY.md).

`diagnostics.mjs` records only when diagnostics are enabled and its own validation/storage steps succeed. It is separate from turn-state validity and keeps at most 128 records per project. Host notifications, optional script diagnostics and inspection of the resulting project files answer different questions; see [Hook verification](hook-diagnostics.md). No transcript or arbitrary shell-command parsing occurs.

## Change-detection limits

Git is invoked shell-free with optional locks, fsmonitor, configured clean/process filters, lazy fetching and transport protocols disabled. Gitlink repositories return incomplete before status can descend into submodule-local configuration. Snapshot limits are 1,000 dirty/untracked paths, 1 MiB per file and 8 MiB total. Only changed file contents are hashed by the plugin. Known credential filename patterns use metadata in that hasher; Git may independently read tracked files during status, so these are hashing budgets and not total I/O guarantees or a secret detector. Leaf symlinks are hashed as links, parent symlinks are refused. Non-regular paths, including dirty submodules, make snapshots incomplete.

The baseline includes pre-existing work; unchanged pre-existing dirt does not trigger a reminder. Changes by another process after the baseline cannot be attributed to the model. Snapshots are observations, not filesystem transactions: concurrent modification may invalidate their interpretation. State is isolated between sessions but does not isolate their working directories.

## Repository content and validation

The plugin scripts do not write project knowledge. The agent follows the project-owned convention, and can decline unnecessary writes. The optional note checker validates structure only in files bearing `<!-- repo-knowledge:decision -->`; it leaves unmarked ADR formats alone, skips subtrees named `archived`, and never creates a notes directory. It still reads scanned Markdown to find the marker, so unmarked files remain subject to its read and path-safety limits. The [configuration reference](configuration.md) describes command results and scan limits. It checks structure and local file links, not truthful reasoning, requirement coverage, anchor targets or external sites.

The operator commands do not prove native plugin behavior. The [verification layers](testing.md) distinguish direct documentation review, deterministic checks, native discovery and small model-driven acceptance tasks. Actual dated results belong in [VERIFICATION.md](../VERIFICATION.md); the mechanics on this page are not a claim that every branch has been observed in a native host.
