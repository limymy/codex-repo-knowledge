# Architecture

## Instruction delivery and authority

`.codex-plugin/plugin.json` is the supported Codex manifest; `hooks/hooks.json` uses default discovery without a manifest `hooks` field. The repository marketplace references the repository root. Native discovery on CLI 0.159.0-alpha.7 found that the original dual portable/compatibility package exposed skills but no hooks; compatibility-only packaging exposes all three. See [packaging decision](../.agents/notes/2026-09-30-native-packaging-and-git-isolation.md).

`SessionStart` injects the bundled `rules/bootstrap.md` with resource locations. The implicit `repo-knowledge` skill routes current documentation and durable decisions to separate references. The explicit-only setup skill optionally merges project-specific instructions with permission. This plugin does not depend on the user invoking a workflow every turn, but execution requires host support, enabled/trusted hooks, and model compliance.

Repository text is not promoted into the hook's developer context. Resource paths are JSON data, not executable commands. Higher-priority instructions, direct user scope and local conventions remain controlling; a reminder grants no extra permission. Plan mode receives startup guidance, but does not collect change receipts or trigger Stop reminders.

The [functional contract](functional-contract.md) distinguishes DSH native dynamic instruction loading from this Codex adaptation. SessionStart reinjects responsibilities and asks for targeted rule refresh; it does not itself reload project instructions or guarantee later knowledge retrieval.

## Turn lifecycle

`UserPromptSubmit` discovers the Git worktree and records a bounded baseline under host-provided PLUGIN_DATA. The state index hashes repository identity, session_id and turn_id. Duplicate prompt events retain the original baseline. It asks the agent for a short final maintenance status; it no longer supplies a state-writing command or opaque state identifier to the model.

`Stop` compares HEAD, index and dirty/untracked worktree identities. A matching baseline or review digest passes. For a changed complete snapshot, it accepts only an exact final status line in the host-supplied `last_assistant_message` (at most 16 KiB), outside quoted/fenced content. Supported English and Chinese forms are documented in [configuration](configuration.md). The host hook stores enums, a message hash and the current digest; it never stores or reads a conversation transcript. A bounded set of up to eight valid message hashes observed on complete snapshots per turn (including unchanged or already-reviewed snapshots) prevents an old answer from renewing a stale receipt after another edit, including out-of-order replay. Exhausting that budget fails open without requesting another continuation.

If a changed task has no valid status, one advisory continuation is allowed, with its spent budget persisted before responding. A later valid status can still be recorded after this reminder, including when `stop_hook_active` is true; no second continuation is requested. Missing/non-string/oversized final-message fields fail open without forcing a format the host cannot deliver. Read-only unchanged tasks need no status or receipt. Other turns, agents, plan mode and disabled tracking do not acquire this turn's review.

All outcomes remain agent self-reports, not proof of semantic correctness, authorship or awareness of concurrent changes. The optional legacy review CLI still accepts `--turn-state-id` or legacy `--key`, but is not the normal model workflow: its writer needs plugin-data access that ordinary model tools may not have. The default protocol does not require expanding the workspace sandbox.

Missing turn IDs/data, incomplete snapshots, concurrent locks, malformed configuration or corrupt state produce bounded diagnostics without forcing continuation. No transcript or arbitrary shell-command parsing occurs.

## Change-detection limits

Git is invoked shell-free with optional locks, fsmonitor, configured clean/process filters, lazy fetching and transport protocols disabled. Gitlink repositories return incomplete before status can descend into submodule-local configuration. Snapshot limits are 1,000 dirty/untracked paths, 1 MiB per file and 8 MiB total. Only changed file contents are hashed by the plugin. Known credential filename patterns use metadata in that hasher; Git may independently read tracked files during status, so these are hashing budgets and not total I/O guarantees or a secret detector. Leaf symlinks are hashed as links, parent symlinks are refused. Non-regular paths, including dirty submodules, make snapshots incomplete.

The baseline includes pre-existing work; unchanged pre-existing dirt does not trigger a reminder. Changes by another process after the baseline cannot be attributed to the model. Snapshots are observations, not filesystem transactions: concurrent modification may invalidate their interpretation. State is isolated between sessions but does not isolate their working directories.

## Repository content and validation

The plugin scripts do not write project knowledge. The agent follows the project-owned convention, and can decline unnecessary writes. The optional note checker validates only files bearing `<!-- repo-knowledge:decision -->`; it leaves unmarked ADR formats alone and never creates a notes directory. It checks structure and local file links, not truthful reasoning, requirement coverage, anchor targets or external sites.

The source map is small: `runtime.mjs` handles events; `git.mjs` snapshots; `store.mjs` isolates state; `config.mjs` validates locations; `notes.mjs` validates opt-in records. CLI and hook entry points adapt those functions without running a second agent.

可选 `check-notes` 仅检查带插件标记的记录，并跳过所有名为 `archived` 的子树；归档内容不在该结构检查覆盖内。
