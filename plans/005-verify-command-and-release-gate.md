# Plan 005: One `pnpm verify` says the workspace works, and a release runs it before it tags

> **Executor**: follow the steps in order. Run each verification and confirm the expected result
> before the next step. If a STOP condition occurs, stop and report; don't improvise. Update this
> plan's row in `plans/README.md` when done, unless a reviewer dispatched you and keeps the index.
>
> **Drift check, first**: `git diff --stat 14bdba4..HEAD -- package.json scripts/release.sh`.
> If an in-scope file changed, compare "Current state" against the live code. A mismatch is a STOP.
> `scripts/release.sh` had uncommitted edits from another session when this plan was written, so
> expect drift there and read the live file before step 3.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none. Step 3 waits until `git status --short -- scripts/release.sh` is empty.
- **Category**: dx
- **Planned at**: commit `14bdba4`, 2026-11-09
- **Ticket**: TSK-2143, step 5

## Why this matters

Three public npm packages release from this repo, and about 16 apps install them. Nothing runs
the typecheck or the tests before a release. The only CI workflow forwards the tarball to npmjs.
`scripts/release.sh` has one gate, and it calls `.git/hooks/pre-push`, a path git no longer uses
here (`core.hooksPath` is `.vite-hooks/_`). The script also tells you to release from a fresh
worktree, where `.git` is a file, so the `-x` test is false and the gate is skipped without a
word. The first full compile is the site build, which runs after the tag, the GitHub release and
the publish. There's also no root `test` script, so "does everything pass" is three commands
someone has to remember.

## Current state

- `package.json` (repo root), the workspace scripts.
- `scripts/release.sh`, run as `pnpm release`.
- `.vite-hooks/pre-push`: the tracked pre-push hook (format and lint over pushed files). Not edited.
- `.github/workflows/publish-npmjs.yml`: publishes the release tarball. It can't build, because
  `packages/ui`'s build calls a script in a private sibling repo. Not edited.

Root `package.json`, the scripts block:

```json
  "scripts": {
    "check": "pnpm -r check",
    "typecheck": "pnpm -r check",
    "prepare": "vp config",
    "build": "pnpm -r build",
    "lint": "vp fmt --check . && vp lint -c .oxlintrc.json . && pnpm lint:comment-length",
    "lint:fix": "vp fmt . && vp lint -c .oxlintrc.json --fix .",
    "lint:comment-length": "heyramzi-comment-length",
    "release": "bash scripts/release.sh"
  },
```

Per-package scripts: `packages/ui`, `packages/review` and `packages/marketing` each have
`"test": "vp test run"`. `packages/ui`, `packages/review` and `site` have `check`
(svelte-check). `packages/marketing` has no `check`. `site` has no `test`.

`scripts/release.sh` at `14bdba4`, lines 106 to 115:

```bash
if [ "$DRY_RUN" = "1" ]; then
  echo "release: dry run, stopping."
  exit 0
fi

# Run the push gate before the bump: a rejected push after it leaves a local
# release commit, and a rerun then reads the new version as never tagged.
if [ -x .git/hooks/pre-push ]; then
  .git/hooks/pre-push origin "$(git remote get-url origin)" </dev/null
fi
```

Line 233, the last step, after every publish:

```bash
(cd site && pnpm run deploy)
```

The script starts with `set -euo pipefail` and `cd "$(dirname "$0")/.."`, so a failing command
stops it and paths are relative to the repo root. Its messages are prefixed `release:` and go to
stderr on failure.

On this Mac, typecheck, test and build runs go through a shared queue with 3 slots, so `verify`
can wait a while before it starts. That's expected, not a hang.

## Commands

Read from the manifests during the audit; none were run, because the build queue was busy.

| Purpose | Command | Expected |
| --- | --- | --- |
| Install (fresh worktree only) | `pnpm install` | exit 0 |
| Typecheck | `pnpm check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Release preview | `DRY_RUN=1 pnpm release` | prints `release plan:` or a "nothing to release" line, exit 0 |

## Executor toolkit

`software-engineer`. No skill needed.

## Scope

**In scope**, the only files to modify:
- `package.json` (repo root)
- `scripts/release.sh`

**Out of scope**, though they look related:
- `packages/ui/package.json`: another session has uncommitted edits.
- `packages/marketing/package.json`: a `check` script there needs `svelte-check` installed, and an
  install changes the lockfile. Follow-up.
- `.vite-hooks/*`: generated from another repo.
- `.github/workflows/publish-npmjs.yml`: CI can't build until the build script stops living in a
  private repo. Follow-up.
- The changelog-writing part of `release.sh` (the `node -e` block): another agent is changing it.

## Git

- Work in the worktree you were given. One commit per step that changes a file, in the repo's
  style, for example `fix(release): a perf-only patch lists its commits, not "initial publish" (TSK-1131)`.
- `git add -- package.json` then `git commit --only -- package.json`; the same for
  `scripts/release.sh`. Don't push.

## Steps

### Step 1: Add `test` and `verify` to the root scripts

In the root `package.json` scripts block add:

- `"test": "pnpm -r test"` (pnpm skips a package with no `test` script)
- `"verify": "pnpm check && pnpm test && pnpm lint"`

**Verify**: `node -p "Object.keys(require('./package.json').scripts).join(' ')"` prints a list
that includes `test` and `verify`.

### Step 2: Run it once and record the baseline

**Verify**: `pnpm verify` exits 0.

If it doesn't, don't fix the failures here. Record the failing command and its first error in
this plan's row in `plans/README.md` as `BLOCKED (verify is red: <command>)`, keep the step 1
commit, and stop. A red baseline is its own finding and needs its own plan.

### Step 3: Make the release run it

Only when `git status --short -- scripts/release.sh` prints nothing.

In `scripts/release.sh`, replace the 5 lines from `# Run the push gate before the bump` through
the closing `fi` with a gate that can't be skipped silently:

```bash
# Gate before the bump: a failure after it leaves a local release commit, and a rerun then reads
# the new version as never tagged. SKIP_VERIFY=1 is for a rerun that already passed.
if [ "${SKIP_VERIFY:-0}" = "1" ]; then
  echo "release: SKIP_VERIFY=1, not running pnpm verify." >&2
else
  pnpm verify
fi
```

Keep it after the `DRY_RUN` exit, so a dry run stays fast.

**Verify**: `bash -n scripts/release.sh` exits 0;
`grep -n '\.git/hooks/pre-push' scripts/release.sh` returns nothing;
`DRY_RUN=1 pnpm release` exits 0 and never prints a `verify` line.

### Step 4: Say so in the README

Out of scope by file list, so don't edit it: add a line to this plan's row notes in
`plans/README.md` that the root `README.md` "Releasing" section should mention `pnpm verify` and
`SKIP_VERIFY=1`.

**Verify**: `git status --short` shows only `package.json` and `scripts/release.sh` as yours.

## Tests

No new test files. The proof is `pnpm verify` exiting 0 (step 2) and the dry run (step 3).

## Done when

- [ ] `pnpm verify` exits 0
- [ ] `grep -n '"verify"' package.json` shows the script
- [ ] `grep -n 'pnpm verify' scripts/release.sh` shows the gate, and `grep -n '\.git/hooks/pre-push' scripts/release.sh` returns nothing
- [ ] `git status --short` shows no file outside the in-scope list as yours

## STOP conditions

Stop and report when:

- `scripts/release.sh` still has another session's uncommitted edits at step 3. Steps 1 and 2 can
  land without it; report that step 3 is waiting.
- The gate lines in `release.sh` no longer match the excerpt above (someone already replaced
  them). Compare intent, and stop if a different gate is in place.
- `pnpm verify` is red at step 2 (see that step).
- `pnpm verify` appears to hang for more than 15 minutes: check `~/bin/heavy-gate.py status`
  before killing anything, and report the queue state.

## Maintenance

When CI can build (the build script moved out of the private sibling repo), the same `pnpm verify`
belongs in a pull-request workflow. Follow-ups left out, each small: a `check` script for
`packages/marketing`; adding `pnpm --filter site build` to `verify`, so the one full compile runs
before the publish instead of after; `sync:check` as a release warning.
