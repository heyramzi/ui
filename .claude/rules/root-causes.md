---
paths:
  - "**/*.{ts,tsx,js,jsx,mjs,cjs,svelte,swift,py,go,rs,sh,css,sql}"
  - "**/package.json"
---
<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Fix the cause, not the symptom

- **Never cast past a type error.** `as any`, `@ts-ignore`, a non-null `!` or an `in` check that hides a missing field means the schema or the type is wrong. Fix that.
- **Never pin a dependency back to dodge a migration**, and never disable or loosen a test to get a green build. Read the migration guide and move the code.
- **A refactor leaves no compat layer.** No alias export, no `oldField?` "for migration", no shim. Move every caller and every row in the same change, then delete the old name.
- **Backfill old rows once, don't patch around them at read time.** When legacy data is missing a field or sits in an old table, write a script, run it, read the rows back, and keep live code reading one source. No `a ?? b ?? c`, no second query on the old table, no guessed default date. A row the script can't fill goes on a list for a person to check. The won-date lookup in `app/src/lib/calls/sync-project-step.ts` grew a second query on `memory_sources` `deal_stage_change` rows and a planned "Client since" fallback, when one backfill of `stage` record events was the fix (4 Nov 2026).
- **Never special-case the example you were handed.** A fix that only passes the case in front of you breaks on the next one.
- **Fix the class, not the instance.** When a bug came from a pattern, grep every sibling that uses the same pattern. A storefront fixed `/i/[storageId]`, left `/d/[...]` with the same bug, and buyers found it. "Replace this component" means every call site: swapping it on 3 course pages and leaving 2 sent Ramzi back (2 Nov 2026).
- **A rule nobody enforces is a bug waiting for the next file.** When safety depends on every author remembering (an auth call per endpoint, a key per route), write the test that reads the tree and fails on the one that forgot.
- **Read the result back before you trust it.** `canvas.toBlob` returns a PNG without complaint when it can't encode AVIF. A resolved promise isn't proof.
