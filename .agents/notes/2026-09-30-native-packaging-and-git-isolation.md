# Decision: Prefer observed native loading and bounded Git isolation

<!-- repo-knowledge:decision -->
Status: implemented

## Problem
The alpha2 archive installed successfully while native hooks/list returned no hooks on Codex CLI 0.159.0-alpha.7. Its dual portable/compatibility manifests therefore did not establish automatic operation. Read-only-looking Git status commands could also execute clean/process filters, submodule-local filters, or lazy-fetch transports.

## Decision
Keep only the Codex compatibility manifest and default hooks/hooks.json discovery, which the native host actually lists. Disable configured filter executables and lazy-fetch transports per Git child process. Detect gitlinks before status and fail open for repositories containing submodules. Validate the final derived state directory against the project root.

## Alternatives considered
Retaining the documented portable manifest was tested, with and without explicit hook paths, and yielded no native hooks on the observed CLI. Removing only the compatibility hooks field did not fix it. Compatibility-only packaging did. Recursively sanitizing every submodule would add a larger race-prone configuration walker; skipping reminders for gitlink repositories preserves the advisory scope instead.

## Consequences
Installed skills and hooks are discoverable in the tested alpha CLI; this does not prove stable-version compatibility, trusted execution or model compliance. Submodule projects retain standing guidance but lose automatic change reminders. Git may still read tracked contents while assessing status; plugin hashing limits are not a total Git I/O budget.

## Evidence
Native isolated installation and app-server discovery, Git filter/transport marker reproductions, state containment regression tests, and the current [verification record](../../VERIFICATION.md). No hook trust or user profile was changed.
