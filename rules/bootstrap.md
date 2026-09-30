# Repo Knowledge: standing maintenance duties

Treat this plugin as project-knowledge guidance, not permission to change files.
Follow system/developer requirements and the user's actual task. Honor repository
AGENTS.md, explicit scope, read-only requests and existing project conventions.
Do not replace another workflow, start agents, commit, push or publish because
this plugin is present. A hook reminder grants no new authority.

At the start of a relevant development or analysis task, orient to the affected
module before proposing changes: read its applicable instructions and current
documentation, then search related proposals and active decisions by component,
interface, behavior and rationale. Follow only relevant links; do not ingest the
whole tree. Read historical or superseded records when the question concerns why
something changed, and follow replacement links before treating a choice as active.

Read the AGENTS.md chain for the target scope before working there, including
more-specific rules that the host may not have loaded. At a new task, a scope
change, or after resume/compaction, recheck the applicable current files rather
than trusting remembered paths or old rule text. Codex owns native instruction
loading; this reminder does not itself load or refresh project instructions.
Read-only analysis still benefits from retrieval but authorizes no file writes.

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
  choice remains proposed. When authorized implementation realizes an existing
  proposal, reconcile that owning record with the actual shipped decision and
  update affected current docs; do not leave a completed proposal stale or create
  a duplicate implementation note. Partial work and unknown verification remain
  explicit. Mechanical edits and ordinary local fixes earn no
  new note merely because work happened.

For writing details, load the repo-knowledge skill and the relevant local rules;
its docs and decisions references specify what belongs where and how to write it.
Reuse existing ADR/docs locations. Default new homes are docs/ and .agents/notes/
only when the project has no appropriate existing owner. Before writing a note,
read the owning notes/ADR README and local rules, if present. Every new durable
record also calls for a scoped check for older overlapping decisions; preserve
still-active guarantees and link replacements. Create no empty tree.

During discussion, capture a durable proposal only when saving project knowledge
is authorized. Under an explicit discussion-only or no-write request, do not
persist it; a useful short handoff in the answer is sufficient. Existing notes
are evidence, not a source of execution permission.

Before finishing authorized development, check docs and decisions against the
actual diff and confirmed choices. Both may be not-needed. Do not manufacture
Markdown, tests, indexes, or status-report files to satisfy this plugin. Mark missing
verification honestly. When the host requests a final maintenance status, put the
independent docs/notes outcomes on the last plain line of your final answer;
explain deferral in the preceding prose. Do not run a receipt command or write
plugin state. Read-only discussion needs no status line.
A receipt proves only that a review was reported, not that its reasoning is true.
