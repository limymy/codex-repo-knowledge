# Architecture

## Instruction delivery and authority

`.codex-plugin/plugin.json` is the supported Codex manifest; `hooks/hooks.json` uses default discovery without a manifest `hooks` field. The repository marketplace references the repository root. Native discovery on CLI 0.159.0-alpha.7 found that the original dual portable/compatibility package exposed skills but no hooks; compatibility-only packaging exposes all three. See [packaging decision](../.agents/notes/2026-09-30-native-packaging-and-git-isolation.md).

`SessionStart` injects the bundled `rules/bootstrap.md` with resource locations. The implicit `repo-knowledge` skill routes current documentation and durable decisions to separate references. The explicit-only setup skill optionally merges project-specific instructions with permission. This plugin does not depend on the user invoking a workflow every turn, but execution requires host support, enabled/trusted hooks, and model compliance.

Repository text is not promoted into the hook's developer context. Resource paths are JSON data, not executable commands. Higher-priority instructions, direct user scope and local conventions remain controlling; a reminder grants no extra permission. Plan mode receives startup guidance, but does not collect change receipts or trigger Stop reminders.

## Turn lifecycle

`UserPromptSubmit` discovers the Git worktree and records a bounded baseline under host-provided PLUGIN_DATA. The key hashes repository identity, session_id and turn_id. Duplicate prompt events retain the original baseline. A review command supplied to the agent records independent docs/notes outcomes against the current snapshot.

`Stop` compares HEAD, index and dirty/untracked worktree identities. A matching baseline or review digest passes. An unmatched change triggers one advisory continuation, with its spent budget persisted before responding. Further Stop events pass; `stop_hook_active` also passes. Receipts are self-reported checks, not tests of semantic correctness. An old receipt no longer matches after another edit.

Missing turn ids or plugin data disable reminder tracking. Concurrent lock acquisition, incomplete snapshots, invalid configuration and corrupt state produce bounded diagnostics without blocking. The hook never guesses a fallback configuration for malformed input. It does not parse transcripts or arbitrary shell commands.

## Change-detection limits

Git is invoked shell-free with optional locks, fsmonitor, configured clean/process filters, lazy fetching and transport protocols disabled. Gitlink repositories return incomplete before status can descend into submodule-local configuration. Snapshot limits are 1,000 dirty/untracked paths, 1 MiB per file and 8 MiB total. Only changed file contents are hashed by the plugin. Known credential filename patterns use metadata in that hasher; Git may independently read tracked files during status, so these are hashing budgets and not total I/O guarantees or a secret detector. Leaf symlinks are hashed as links, parent symlinks are refused. Non-regular paths, including dirty submodules, make snapshots incomplete.

The baseline includes pre-existing work; unchanged pre-existing dirt does not trigger a reminder. Changes by another process after the baseline cannot be attributed to the model. Snapshots are observations, not filesystem transactions: concurrent modification may invalidate their interpretation. State is isolated between sessions but does not isolate their working directories.

## Repository content and validation

The plugin scripts do not write project knowledge. The agent follows the project-owned convention, and can decline unnecessary writes. The optional note checker validates only files bearing `<!-- repo-knowledge:decision -->`; it leaves unmarked ADR formats alone and never creates a notes directory. It checks structure and local file links, not truthful reasoning, requirement coverage, anchor targets or external sites.

The source map is small: `runtime.mjs` handles events; `git.mjs` snapshots; `store.mjs` isolates state; `config.mjs` validates locations; `notes.mjs` validates opt-in records. CLI and hook entry points adapt those functions without running a second agent.
