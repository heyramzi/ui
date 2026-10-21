---
paths:
  - "**/convex/**/*.ts"
---
<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Convex

- **Schema first.** A field the code expects and the schema lacks gets added to `convex/schema.ts`. Never paper over it with `as any`, an `in` check or optional chaining.
- **Verify identity server-side.** A `userId` in `args` is a claim. `ctx.auth.getUserIdentity()` is the fact.
- **A new field starts `v.optional(...)`** and becomes required after the backfill, not before.
- **Mutations are idempotent.** OCC retries them, so one that appends without checking state appends twice.
- **`Id<"table">` and `Doc<"table">`**, not `string` and an inline shape.

Depth: the `convex` skill. Convex breaks between minors, so fetch https://docs.convex.dev/llms.txt before you trust memory.
