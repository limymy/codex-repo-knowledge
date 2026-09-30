# Durable decisions and proposals

## Eligibility

Write only reasoning whose loss would plausibly cause a future maintainer to
repeat a meaningful error, undo an intentional tradeoff or redo substantial
investigation. Effort, diff size and task completion do not establish eligibility.
Real design alternatives, compatibility constraints, unusual failure handling and
important negative guarantees often qualify. Ordinary local edits do not.

Before writing, read the applicable notes/ADR README and local instruction chain.
Search related active and proposed records first. Reuse the owning record for the
same decision; do not assume the default notes path is its home. On later analysis,
check status and follow replacement links before relying on a recorded choice.
No central chronological index is required. Keep rules in AGENTS.md and present
behavior in current docs; a decision record explains why and what was given up.

## Default shape (only when no local convention exists)

Use `YYYY-MM-DD-topic.md` under the configured notes directory. Use the bundled
[decision template](../../../templates/decision.md) only as a shape, not filler.
The marker `<!-- repo-knowledge:decision -->` opts this file into the plugin's
format checker. Do not add that marker to existing ADRs with a different format.

Default marker status values: `proposed`, `implemented`, `rejected`, `superseded`.
This is the plugin's optional simple format, not a required DSH folder taxonomy.
DSH uses proposed/implemented/rejected active trees and a separate archived
history tree; it does not have an active superseded directory. If the project already
uses that or another lifecycle, follow its own statuses, moves and archive rules
without adding our marker or imposing a second schema.

A proposed record contains Problem, Proposal, Alternatives considered, Acceptance
criteria, Risks, and Evidence. An implemented record contains Problem, Decision,
Alternatives considered, Consequences, and Evidence. Evidence distinguishes
observations, analysis and missing verification. Rejected proposals state why;
superseded records link to their replacement and retain the original decision.

Describe the problem and constraints independently of the chosen solution.
Explain concretely why the choice fits those constraints and which costs or risks
it accepts. For each alternative actually considered, explain why it was rejected
under those conditions; if only one option was evaluated, say so rather than
inventing competitors. Keep unknown historic rationale explicit. An implemented
decision does not itself prove every desired outcome.

## Changes over time

When authorized code work implements a recorded proposal, revisit that same record.
Describe the implemented choice and consequences rather than retaining future-tense
steps or acceptance plans. Move or reclassify it according to local conventions,
update inbound references if its path changes, and reconcile the current docs.
Do not mark unimplemented portions complete or invent evidence; verification gaps
remain labeled even when the design has been implemented. If the proposal is
rejected instead, retain its real rejection reason rather than quietly deleting it.

Every new durable record triggers a scoped check for overlapping older records,
even when the task did not explicitly mention supersession. Fully displaced
records may be superseded under local rules; partially displaced records retain
their active guarantees and link the relevant replacement. Do not close unrelated
records simply because a new note was written. Consolidation must preserve unique
rationale, alternatives, consequences and verification gaps and repair inbound links.

Update stale paths, symbols, defaults and facts in the same change that affects
them. Do not append a running diary. If the decision reverses, add a replacement
and link both records; do not rewrite yesterday's rationale into its opposite.
Mark a partial replacement explicitly and retain any still-active guarantees.
Do not archive solely by age or word count. Follow local archive rules; archived
content is historical evidence, never current authority or permission.

After authorized writes, `node <plugin-root>/scripts/rk.mjs check-notes --cwd
<repo>` can check only plugin-marked records. It validates structure and local
links, not truth or whether a missing record should have existed.
