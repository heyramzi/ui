# Coding standards

<!-- vibekit:coding-standards:start -->
<!-- Generated from upsys/kit/ai-doc/references/coding-standards.md. -->

Read only the rows that match the files or operation in this task. The linked rules are materialized locally so this repository also works without the sibling kit checkout.

| Task | Read before acting |
| --- | --- |
| Source changes | [Comments](.claude/rules/comments.md), [root causes](.claude/rules/root-causes.md), [simplicity](.claude/rules/simplicity.md), [scope](.claude/rules/surgical-changes.md), [testing](.claude/rules/testing.md), [verification](.claude/rules/verification.md) |
| JS, TS or Svelte imports | [Imports](.claude/rules/imports.md) |
| Svelte components, routes or configuration | [Svelte](.claude/rules/svelte.md) |
| Swift, project.yml or Makefiles | [Swift](.claude/rules/swift.md) |
| Swift UI | [Liquid Glass](.claude/rules/liquid-glass.md) |
| Convex functions | [Convex](.claude/rules/convex.md) |
| Shared helpers, dependencies or app CSS | [Packages](.claude/rules/packages.md) |
| Shell commands | [Shell](.claude/rules/shell.md) |
| Git operations | [Shared working trees](.claude/rules/git-shared-tree.md) |
| Reader-facing copy | [Voice](.claude/rules/voice.md) and the repository's copy gate |

For repository-specific implementation or runtime operations, read **Repository conventions** below, if present. For design, integrations, product decisions or releases, follow the **Task references** for that subject. Nested instruction files add local exceptions.

<!-- vibekit:coding-standards:end -->

## Repository conventions

```bash
pnpm gate <your paths>          # check-changed over your files and the files importing them: lint, types, related tests
pnpm gate                       # the same over everything since origin/main, other sessions' edits included
pnpm gate --list <your paths>   # what it would check, and nothing else
FULL_CHECK=1 pnpm verify        # every package's whole svelte-check, every unit test, whole-repo lint
pnpm release                    # runs FULL_CHECK=1 pnpm verify and the gallery suite before it publishes
```

- The push runs the same gate over the pushed files. A changed `pnpm-lock.yaml`, `tsconfig.json`, `svelte.config.js` or `.d.ts` runs that package's whole `check` inside it, because no import reaches the files it affects.
- `verify` is for a dependency upgrade, an export renamed across packages, or a gate scope in doubt. CI and the release run it, so a publish never ships on a scoped check.
