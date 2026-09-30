# Configuration

No repository config is required. To change defaults, explicitly create `.repo-knowledge.json` at the repository root:

```json
{
  "version": 1,
  "enabled": true,
  "docsRoot": "docs",
  "notesRoot": ".agents/notes",
  "stopReminder": "once"
}
```

`docsRoot` and `notesRoot` supply fallback homes and tell the diagnostic/note-checker commands where to look. They do not replace the agent's obligation to find existing owners. Use distinct relative directories inside the repository. Absolute paths, parent traversal, `.git`, backslashes, controls and existing symlink components are rejected. Unknown keys and invalid values are errors; the hook warns and does not silently substitute defaults.

`stopReminder: "off"` disables baseline/receipt/Stop tracking but keeps SessionStart guidance. `enabled: false` disables all automatic behavior for this repository. A direct explicit skill invocation remains a user request; do not invoke it expecting `enabled` to act as an authorization boundary.

## Diagnostics

```bash
node /path/to/plugin/scripts/rk.mjs doctor --cwd /path/to/project
node /path/to/plugin/scripts/rk.mjs check-notes --cwd /path/to/project
```

Doctor checks effective configuration, Git visibility and snapshot completeness. It does not certify native plugin loading. The note command validates only opted-in decision files; existing unmarked ADRs are ignored.

## Local state

State is stored in `<PLUGIN_DATA>/repo-knowledge-state-v1`, never in the project. Missing host-provided data, an in-project location, or a symlinked data path disables reminders with a diagnostic. State contains repository identity, timestamps, aggregate digests, counts, the spent reminder bit and optional short review reason. Never place secrets in review reasons.

Records expire after seven days for operational use, but files are not automatically deleted. After ending active sessions, the operator may remove this plugin-owned state directory to reset reminders and receipts. Do not delete another plugin's data or edit active turn files. An orphan lock makes that turn fail open rather than removing a potentially active lock.

## Trust and scope

Use Codex `/hooks` to inspect and trust hook definitions after installation or an update. Never bypass trust by directly editing hashes. Hooks can run local commands with their host permissions; keep ordinary sandbox and approval controls enabled. Installing this plugin does not authorize application changes, commits, pushes, deployments or extra model calls.
