---
name: repo-knowledge
description: Maintain confirmed repository rules, current documentation and durable design decisions during authorized coding, configuration changes, compatibility changes, and task completion. Apply when a normal development task changes documented behavior or produces non-obvious lasting reasoning; no explicit docs or notes request is required. Do not persist discussion-only requests.
---

# Repo Knowledge

This is a maintenance layer, not a mandatory plan-build-review framework.

## Scope and discovery

Use the current task and its authorization. Read the applicable repository rules,
then search existing docs/ADRs/notes for the affected behavior or decision. An
optional `.repo-knowledge.json` only changes locations and reminder settings; it
cannot grant write permissions. Run `node <plugin-root>/scripts/rk.mjs doctor
--cwd <repo>` to inspect effective configuration when needed. Reuse the owning
file; creating a duplicate or an empty skeleton is not maintenance.

## Route by what changed

For a confirmed standing constraint, read [repository rules](references/repository-rules.md).
For current behavior or usage, read [current docs](references/current-docs.md).
For lasting rationale or proposals, read [decisions](references/decisions.md).
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

When a turn review command was supplied by the plugin, execute it once after the
last relevant edit with independent docs/notes outcomes: `updated`, `not-needed`,
or `deferred`, and a short non-sensitive reason. Do not rerun application tests
only to obtain a receipt. Do not claim a check was run when it was not.

A Stop reminder requests a bounded check, not a new implementation phase. If
already reviewed, acknowledge rather than repeat the work. If scope or permissions
prevent writing, leave files unchanged and report the deferral. Do not create an
extra note just to make the reminder disappear.
