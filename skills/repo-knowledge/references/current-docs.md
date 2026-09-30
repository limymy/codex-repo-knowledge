# Current documentation

## Choose the owner

Use the closest existing README, guide, API reference or architecture page. Put
cross-module behavior in its existing cross-module reference. Put a single
component's details beside that component. One full explanation has one owner;
other places link. Preserve essential local caller guarantees even when the
long explanation lives elsewhere. Do not impose a new docs hierarchy.

## Decide whether a change is needed

Update when an interface, flag, default, error behavior, workflow, lifecycle,
compatibility promise, deployment requirement or meaningful limitation changes.
A bug fix restoring an already-correct documented behavior may need no docs edit.
Internal naming, formatting and obvious local rearrangements normally need none.

Current docs describe shipped behavior, not implementation progress, chat history
or intended future work. Formal requirements remain explicitly labeled as such.
Do not "fix" correct requirements to fit defective code. Explain any uncertainty.

## Write for the page's job

A guide states prerequisites, actions, expected observable result and material
failure/recovery information. A reference states the relevant inputs, outputs,
errors, timing/ownership, compatibility and limitations. Include only applicable
items. Link the decision for the why. Avoid inventories already owned by source,
schema, configuration or generated artifacts. Follow the repository's language.

Verify commands and behavior using the closest available evidence. Where running
an example needs unavailable services, secrets or authorization, record that
limitation; don't invent a successful run. Check changed relative links. Regenerate
owned derivatives when required; don't hand-edit generated output.
