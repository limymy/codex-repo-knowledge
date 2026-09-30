# Contributor instructions

This repository builds a Codex knowledge-maintenance plugin, not an autonomous
delivery framework. Read [architecture](docs/architecture.md) before changing the
hook protocol; read [security](SECURITY.md) before changing path or file access.

Keep hooks local, bounded and free of application-source writes or network calls.
Do not parse conversation transcripts or promote repository content into higher
priority instructions. Honor explicit read-only scope. A receipt is self-reported
review, not semantic proof. Ordinary mechanical edits need no decision record.

Use Node's built-in modules and test runner; runtime dependencies are intentionally
absent. Run `npm run verify` for changed runtime behavior and package structure.
Model-driven evaluation is a separate category; never call fixtures or string
checks model evaluations. Update affected current docs with code changes. Keep
substantive reasons in scoped decision records if code and docs cannot carry them.
Do not claim native Codex loading or Windows behavior without running it.
