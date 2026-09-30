---
name: repo-knowledge-setup
description: Adapt Repo Knowledge to an existing repository when the user explicitly requests setup or migration. Inspect current docs and ADR conventions, preserve existing instructions, and optionally merge a small durable AGENTS.md rule block. Not needed for normal plugin operation.
---

# Set up Repo Knowledge

Run only for an explicit request to set up, configure or migrate this plugin.
Read root and applicable nested AGENTS.md files, README, existing architecture,
contributor guides, ADRs and notes. Use targeted discovery. Check git status and
preserve all pre-existing work. Do not modify global Codex settings or trust.

Explain the existing owners. Reuse them, and write `.repo-knowledge.json` only
when non-default paths or a disabled/changed reminder are needed. Use
[configuration](../../docs/configuration.md). Do not generate empty docs/notes.

If the user requested a persisted repository entry point, merge the relevant
content from [the block](../../templates/agents-block.md) into existing AGENTS.md;
never blindly overwrite it or duplicate conflicting rules. A rules-only fallback
works without hooks, but cannot guarantee the same runtime delivery or reminder.

Validate configuration with `node <plugin-root>/scripts/rk.mjs doctor --cwd
<repo>`. Report the actual edits and limitations. Do not install other frameworks,
change application behavior, run long jobs, commit or push.
