# Current documentation

## Choose the owner

Use the closest existing README, guide, API reference or architecture page. Put
cross-module behavior in its existing cross-module reference. Put a single
component's details beside that component. One full explanation has one owner;
other places link. Include affected API docstrings/JSDoc and other source-adjacent
contracts when they own the caller-facing behavior. Preserve essential local caller guarantees even when the
long explanation lives elsewhere. Do not impose a new docs hierarchy.

## Decide whether a change is needed

Update when an interface, flag, default, error behavior, workflow, lifecycle,
compatibility promise, deployment requirement or meaningful limitation changes.
A bug fix restoring an already-correct documented behavior may need no docs edit.
Internal naming, formatting and obvious local rearrangements normally need none.
For an externally visible breaking change, also update the existing migration or
upgrade owner with who is affected, required action and any compatibility bridge.
Do not impose a new release process or generate an upgrade guide for harmless edits.

Current docs describe shipped behavior, not implementation progress, chat history
or intended future work. Formal requirements remain explicitly labeled as such.
Do not "fix" correct requirements to fit defective code. Explain any uncertainty.

## Write for the page's job

Organize the page around what its reader needs to understand and do. A guide
identifies who must do what, under which prerequisites, and the expected observable
result with material failure/recovery information. A reference explains inputs,
outputs, errors, compatibility and material limitations, including side effects,
cancellation, persistence, timing, ordering and ownership where
those boundaries affect correct use. Provide enough context to apply the
contract, with a small example where ambiguity is likely. Link to the owning
decision for durable reasons rather than repeating them.

Integrate a change into the page's explanation and structure, not as an appended
correction or development update. Reread affected sections with their surrounding context, arrange ideas in a
logical order, use consistent terms, and remove stale or redundant statements
and contradictions. Revise the structure where needed without rewriting unrelated
material merely for consistency. Editing or shortening must preserve applicable conditions,
exceptions, ordering, obligations and negative guarantees. Follow the repository's
language and avoid inventories already owned by source, schema, configuration
or generated artifacts.

Verify commands and behavior using the closest available evidence. Where running
an example needs unavailable services, secrets or authorization, record that
limitation; don't invent a successful run. Check changed relative links. Regenerate
owned derivatives when required; don't hand-edit generated output.
