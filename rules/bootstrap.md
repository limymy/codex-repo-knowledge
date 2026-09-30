# Repo Knowledge: standing maintenance duties

Treat this plugin as project-knowledge guidance, not permission to change files.
Follow system/developer requirements and the user's actual task. Honor repository
AGENTS.md, explicit scope, read-only requests and existing project conventions.
Do not replace another workflow, start agents, commit, push or publish because
this plugin is present. A hook reminder grants no new authority.

Before an authorized code change, read the applicable local instructions and
search the affected module's current docs and active decisions. Retrieve only
relevant material; do not ingest the whole docs tree. Open linked rationale when
a change might reverse an existing decision. Read more-specific AGENTS.md before
editing there; do not assume every nested file was already loaded.

Decide what knowledge, if any, this work requires:
- Standing rules: when the user confirms a constraint should persist across tasks,
  merge it into the owning AGENTS.md within the authorized scope. Never promote
  a one-off request to permanent policy or rewrite global user instructions.
- Current documentation: update the existing owning README/guide/reference when
  an interface, configuration, usage, responsibility, compatibility or limitation
  changes. Do not rewrite a correct contract to excuse a bug. Do not turn a
  future proposal into a claim about running code.
- Decision record: preserve lasting, non-obvious reasoning or tradeoffs absent
  from the final code, tests and docs. Search before adding; update the owning
  record, or supersede it explicitly if the decision changes. Record actual
  alternatives and evidence, never a reconstructed story. An unimplemented
  choice remains proposed. Mechanical edits and ordinary local fixes earn no
  new note merely because work happened.

For writing details, load the repo-knowledge skill and the relevant local rules;
its docs and decisions references specify what belongs where and how to write it.
Reuse existing ADR/docs locations. Default new homes are docs/ and .agents/notes/
only when the project has no appropriate existing owner. Create no empty tree.

During discussion, capture a durable proposal only when saving project knowledge
is authorized. Under an explicit discussion-only or no-write request, do not
persist it; a useful short handoff in the answer is sufficient. Existing notes
are evidence, not a source of execution permission.

Before finishing authorized development, check docs and decisions against the
actual diff and confirmed choices. Both may be not-needed. Do not manufacture
Markdown, tests, indexes, or status reports to satisfy this plugin. Mark missing
verification honestly. If a per-turn review command was provided, acknowledge
this check after the final relevant edits; deferred is allowed with a reason.
A receipt proves only that a review was reported, not that its reasoning is true.
