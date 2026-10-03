# Verification layers

The layers below have different claims. Passing one does not establish another.

## Direct documentation review

Maintain repository documentation directly under the same [writing rules](../skills/repo-knowledge/references/current-docs.md) used by the plugin. A maintainer can inspect source, update the owning guide and review the complete affected sections without a Codex model run. Check facts, applicable conditions, compatibility guarantees, failure behavior and evidence limits; verify relevant commands and local links. Do not create a decision record unless there is a genuine lasting choice to explain.

For prose-only changes, start with `git diff --check` and `npm run check` in a clean source checkout. The package checker reads distributable files, so keep credentials, Codex profiles and test-run evidence outside that checkout. It checks local link targets and package consistency, not factual accuracy or `SHA256SUMS`. Update an affected checksum manifest separately when preparing a distribution.

The inventory behind package checking is filesystem-wide, not `git ls-files` and
not `.gitignore`-aware. [package-files.mjs](../scripts/package-files.mjs) skips
entries named `.git`, `node_modules`, `.evals`, `dist` and `coverage`, rejects
symlinks, and reads other regular files, including hidden and untracked files.
Use an intended source-only tree; a clean Git status alone does not establish
that ignored local files are absent. `npm run pack:files` prints a JSON inventory
with sizes and hashes; it creates neither an archive nor `SHA256SUMS`. Review the
inventory and verify any separately prepared archive or checksum manifest against
its intended contents rather than treating a successful package check as that
verification.

If the change alters instructions that govern model behavior, review the text first and then select a small real task for that behavior. Grammar, layout or factual corrections to user documentation do not by themselves require another model run. Model-generated text remains a candidate for review, never the authority for current behavior.

## Offline deterministic suite

Run `npm run verify`. It uses Node's built-in test runner, real temporary Git repositories and real Node hook subprocesses supplied with documented JSON inputs. It checks instruction output, bounded reminders, unchanged pre-existing dirt, duplicate/concurrent events, receipts and stale digests, traversal/symlink refusal, budgets, state corruption, note structures and package consistency.

Choose checks by the contract affected, not by a target test count. `npm run verify` runs package consistency once, then all deterministic tests; `npm test` alone does not check the live package. Filesystem-only checks use temporary directories; committed Git fixtures are reserved for repository snapshots, lifecycle behavior and evaluation baselines.

| Group | What a failure would mean | Keep coverage for |
| --- | --- | --- |
| `runtime.test.mjs` | Guidance, change detection or bounded reminders no longer follow the supported lifecycle | startup/resume/clear/compact, existing dirt, commits, disabled/plan/subagent scope, receipt freshness |
| `final-status.test.mjs` | The host loses a genuine review or accepts an unrelated/replayed answer | strict final line, independent statuses, read-only model filesystem, one-reminder continuation, all observed replay branches |
| `safety.test.mjs` | A local check escapes its scope, executes repository configuration or blocks work unsafely | path/symlink/FIFO boundaries, Git filters and lazy fetch, submodules, staged/worktree identity, budgets, fail-open errors |
| `diagnostics.test.mjs` | Optional troubleshooting leaks content, changes behavior or grows without bound | default off, privacy, retention, bad state/locks, reader and legacy CLI compatibility |
| `notes.test.mjs` | The opt-in note checker rejects existing conventions or accepts malformed opted-in records | lifecycle structure, real local links, archive exclusion, no-op behavior; this is not a writing-quality grader |
| `tooling.test.mjs` and package check | Distribution or local verification gives a false result | explicit package inventory, CRLF, safe evaluation preparation, no false model pass, bounded native-probe failures |

The cheap status combinations and unsafe-path inputs remain separate cases so failures identify the offending value. Actual regressions are not removed merely because they share a setup or an expected error.

The package checker is repository-specific, not the full upstream manifest schema or a Codex loader. The Hook subprocess tests are simulations of the host protocol, not native Codex events. Git commits in these tests create isolated fixture baselines only. No authentication, npm download or model calls are required.

## Native CLI smoke

Run `npm run smoke:codex`. `RK_CODEX_BIN` can point to an absolute Codex executable. The script runs `--version`, registers this local marketplace and lists it in a temporary HOME/CODEX_HOME, then removes that temporary state. It does not modify the user's profile, copy credentials, trust/execute hooks, or call a model.

The script also starts the native app-server and calls only `skills/list` and `hooks/list`. It requires both installed skills and all three hook definitions, validates startup/resume/clear/compact matching, and requires untrusted hook state. No thread or model is started. Exit 0 confirms these operations and discovery checks; exit 2 means no executable; exit 1 is a failure. Hook execution and model behavior remain not-run.

## Genuine model acceptance

Start with the [functional contract and continuous scenarios](functional-contract.md). Independent one-turn fixtures below do not establish later retrieval, proposal transitions or stale-rule refresh.

### Minimal native checks

Choose the claim to establish before starting the model. A useful small sequence is:

1. Start a native session in a disposable repository with an existing owning document, and submit one ordinary, bounded behavior-change task. Do not tell the model which document to edit. Verify the native SessionStart and UserPromptSubmit events, review the actual reads and changes, and observe Stop and the matching changed-work receipt.
2. Start a fresh read-only task that needs the updated knowledge. Check targeted retrieval and the answer, then verify that the project is unchanged. This is evidence for that retrieval case, not general recall reliability.
3. Add resume/compact, scope changes, decision lifecycle or missing-status recovery only when that is the specific acceptance gap. A normal no-op Stop or a valid first answer does not exercise the missing-status reminder branch.

Do not turn this sequence into a full-repository documentation-writing assignment. Direct documentation review and native behavior acceptance serve different purposes. A short end-to-end case must still check semantic adoption; merely observing a script exit or a receipt is insufficient.

Record model/host errors separately from plugin outcomes. If a run is interrupted, preserve completed stages, partial changes and the last observed activity. A total deadline, stream disconnection or command exit is not a substitute for locating the unfinished step. Resume only the unfinished task when appropriate; do not rerun completed setup or attribute all elapsed time to hooks. Keep credentials and detailed trial infrastructure outside the package.

### Selecting an existing fixture

On an authenticated development machine, install the plugin in the normal Codex profile and inspect/trust its hooks. Do not send credentials to the plugin or another person. First use a disposable project; do not test on production or uncommitted research work.

```bash
node scripts/eval.mjs prepare --out /absolute/path/to/new-evaluation
```

The directory must not exist. The script creates six independent Git fixtures, their baseline hashes and prompts. No AGENTS.md or pasted bootstrap is placed in the fixtures, so the experiment does not accidentally substitute manual instructions for plugin delivery.

For each fixture, start a fresh Codex session in that directory using the same model/settings and the installed plugin. Send only that case's ordinary prompt from PROMPTS.md. Do not explicitly ask the agent to load the plugin, update docs or write notes. Keep file/tool permission settings unchanged. Observe in `/hooks` and the client's visible event information that SessionStart/UserPromptSubmit hooks actually ran; after the task, check Stop behavior. Record exact Codex version, model/provider, hook trust state, settings, case id, result and whether a reminder caused an extra continuation. Do not infer activation only from the final prose.

After all cases:

```bash
node scripts/eval.mjs grade --out /absolute/path/to/new-evaluation
```

The grader executes independent behavior assertions and checks file-level policy, but deliberately leaves semantic review pending. Inspect each README/decision diff for truthfulness, scope, actual alternatives, supersession links and invented evidence. A receipt or arbitrary Markdown change does not satisfy this review. The original fixture HEAD must remain unchanged: the prompts do not authorize commits.

Select the smallest scenario that exercises the changed behavior. The single-turn fixtures provide objective code/file-policy checks; continuity scenarios add cross-task retrieval, changing rules and decision lifecycle. Their shared setup is not a requirement to run both suites after every edit. For writing changes, inspect actual generated prose and retained constraints; a structural check cannot substitute for that review.

Repeat trials and add an uninstalled control only when measuring reliability or causal improvement. Use fresh directories and report denominators, failures, false-positive notes and added continuations. For a specific regression, one targeted reproduction plus its relevant review is the appropriate starting point. A successful fixture remains bounded evidence, not a universal guarantee.

The separate provider-driven acceptance launcher used during development is not part of this package or CI. Its historical results remain in [VERIFICATION.md](../VERIFICATION.md); temporary credentials, profiles and trial infrastructure are not imported into the project.

## Platforms and CI

The shipped CI file configures offline Linux/macOS/Windows tests on Node 20 and 22. Check GitHub Actions for the exact installed commit; prior published-commit results are recorded in VERIFICATION.md. Windows/macOS native hook launch, different sandboxes and plugin update/retrust require their own tests. No platform parity claim follows from a portable-looking Node command.

## Local command-hook evidence

Cloud-orchestrated tasks do not support this plugin's command hooks, even with local execution. Use actual locally orchestrated Work/Codex threads for native event checks. The optional [bounded diagnostic reader](hook-diagnostics.md) distinguishes script instrumentation from host delivery or model consumption; subprocess tests and manual script runs are not native lifecycle proof.
