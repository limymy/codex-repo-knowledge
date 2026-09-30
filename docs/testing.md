# Verification layers

The layers below have different claims. Passing one does not establish another.

## Offline deterministic suite

Run `npm run verify`. It uses Node's built-in test runner, real temporary Git repositories and real Node hook subprocesses supplied with documented JSON inputs. It checks instruction output, bounded reminders, unchanged pre-existing dirt, duplicate/concurrent events, receipts and stale digests, traversal/symlink refusal, budgets, state corruption, note structures and package consistency.

The package checker is repository-specific, not the full upstream manifest schema or a Codex loader. The Hook subprocess tests are simulations of the host protocol, not native Codex events. Git commits in these tests create isolated fixture baselines only. No authentication, npm download or model calls are required.

## Native CLI smoke

Run `npm run smoke:codex`. `RK_CODEX_BIN` can point to an absolute Codex executable. The script runs `--version`, registers this local marketplace and lists it in a temporary HOME/CODEX_HOME, then removes that temporary state. It does not modify the user's profile, copy credentials, trust/execute hooks, or call a model.

The script also starts the native app-server and calls only `skills/list` and `hooks/list`. It requires both installed skills and all three hook definitions, validates startup/resume/clear/compact matching, and requires untrusted hook state. No thread or model is started. Exit 0 confirms these operations and discovery checks; exit 2 means no executable; exit 1 is a failure. Hook execution and model behavior remain not-run.

## Genuine model acceptance

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

For a stronger result, repeat each case at least three times in fresh prepared directories and run a control set without this plugin. Do not reuse another trial's modified repository. Report fractions, failure examples, false-positive note writes and added continuations; do not describe six happy-path trials as a universal guarantee.

## Platforms and CI

The shipped CI file configures offline Linux/macOS/Windows tests on Node 20 and 22. It has not executed until the repository is uploaded and a workflow run is observed. Windows/macOS native hook launch, different sandboxes and plugin update/retrust require their own tests. No platform parity claim follows from a portable-looking Node command.
