# Durable decisions and proposals

## Eligibility

Write only reasoning whose loss would plausibly cause a future maintainer to
repeat a meaningful error, undo an intentional tradeoff or redo substantial
investigation. Effort, diff size and task completion do not establish eligibility.
Real design alternatives, compatibility constraints, unusual failure handling and
important negative guarantees often qualify. Ordinary local edits do not.

Search active notes first. Reuse an existing owning record for the same decision.
No central chronological index is required. Keep rules in AGENTS.md and present
behavior in current docs; a decision record explains why and what was given up.

## Default shape (only when no local convention exists)

Use `YYYY-MM-DD-topic.md` under the configured notes directory. Use the bundled
[decision template](../../../templates/decision.md) only as a shape, not filler.
The marker `<!-- repo-knowledge:decision -->` opts this file into the plugin's
format checker. Do not add that marker to existing ADRs with a different format.

Status values: `proposed`, `implemented`, `rejected`, `superseded`.

A proposed record contains Problem, Proposal, Alternatives considered, Acceptance
criteria, Risks, and Evidence. An implemented record contains Problem, Decision,
Alternatives considered, Consequences, and Evidence. Evidence distinguishes
observations, analysis and missing verification. Rejected proposals state why;
superseded records link to their replacement and retain the original decision.

Record actual alternatives. If only one option was genuinely evaluated, say that
rather than inventing a competing solution. Unknown historic rationale is unknown.
An implemented decision does not itself prove every desired outcome.

## Changes over time

Update stale paths, symbols, defaults and facts in the same change that affects
them. Do not append a running diary. If the decision reverses, add a replacement
and link both records; do not rewrite yesterday's rationale into its opposite.
Mark a partial replacement explicitly and retain any still-active guarantees.
Do not archive solely by age or word count. Follow local archive rules; archived
content is historical evidence, never current authority or permission.

After authorized writes, `node <plugin-root>/scripts/rk.mjs check-notes --cwd
<repo>` can check only plugin-marked records. It validates structure and local
links, not truth or whether a missing record should have existed.
