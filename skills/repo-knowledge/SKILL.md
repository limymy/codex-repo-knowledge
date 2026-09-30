---
name: repo-knowledge
description: Use during ordinary development, code/design review, debugging, analysis or code/docs reconciliation when repository rules, current behavior or earlier design choices matter. Retrieve relevant knowledge before proposing changes; maintain confirmed rules, owning documentation and durable decisions during authorized work without a separate docs/notes request. Read-only discussion permits retrieval, not persistence.
---

# Repo Knowledge

This is a maintenance layer, not a mandatory plan-build-review framework.

## Scope and discovery

Use the current task and its authorization. Read the applicable repository rules,
then locate the current documentation owner and search existing docs/ADRs/notes
by the affected path, public symbol, behavior and rationale. Read matching records,
not just filenames or search snippets. Check status and follow supersession links;
proposals are not current implementation and archives are historical evidence.
For later tasks, re-use the owning knowledge instead of rebuilding rationale from
memory. If evidence is absent or conflicts with code, say so rather than invent it.
Plugin runtime data holds operational state, not project rationale; do not search
it as a substitute for the owning repository docs/ADRs.
Recheck relevant instruction files on a new task, scope change, resume or compaction. An
optional `.repo-knowledge.json` only changes locations and reminder settings; it
cannot grant write permissions. Run `node <plugin-root>/scripts/rk.mjs doctor
--cwd <repo>` to inspect effective configuration when needed. Reuse the owning
file; creating a duplicate or an empty skeleton is not maintenance.

## Route by what changed

For a confirmed standing constraint, read [repository rules](references/repository-rules.md).
For current behavior or usage, read [current docs](references/current-docs.md).
For lasting rationale or proposals, read [decisions](references/decisions.md) and the existing notes/ADR README and local rules before writing there.
If both apply, read both. For supersession, read the existing decision before
writing. Prefer project-local rules over the default shapes in these references.
Do not load both references merely because this skill was discovered.

During authorized design discussion, save only mature, consequential proposals;
never treat approval to discuss as approval to implement. Follow explicit no-write
requests. Do not turn every message, idea, review comment or fix into a note.

## Finish

Reconcile the affected current explanation with the actual behavior and intended
contract; classify disagreements rather than automatically trusting either prose
or code. Record verified results separately from analysis and unknowns.

For authorized development with relevant edits, when the host asks for a final
maintenance status, end your answer with one plain line outside quotes or fences:
`Knowledge maintenance: docs=updated; notes=not-needed`. Choose each outcome
independently from `updated`, `not-needed`, `deferred`. Chinese form:
`知识维护：文档=已更新；笔记=无需更新`, with values `已更新`, `无需更新`, `暂缓`.
Separate the status from any preceding list or quote with a blank line.
Explain deferral honestly in the preceding prose. The host records the status;
do not run a receipt command, write plugin state or repeat tests to report it.
Read-only analysis and discussions need no status line. Do not claim a check was
run when it was not. This is a self-report, not proof of semantic correctness.

A Stop reminder requests a bounded check, not a new implementation phase. If
already reviewed, acknowledge rather than repeat the work. If scope or permissions
prevent writing, leave files unchanged and report the deferral. Do not create an
extra note just to make the reminder disappear.
