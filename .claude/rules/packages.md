---
paths:
  - "**/src/lib/**"
  - "**/app.css"
  - "**/package.json"
---
<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Shared packages and dependencies

- **Reuse `@heyramzi/*` before you write a helper.** `cn`, formatting, auth defaults, email, Sentry, Umami tracking, OG images and the model catalog already exist in `@heyramzi/utils`, and Zod field schemas in `@heyramzi/validation`. A utility that could serve a second project goes into a shared `@heyramzi/*` package, not this repo.
- **`app.css` keeps `@import "@heyramzi/ui/design"`** for the shared tokens.
- **To move one dependency, edit `package.json` and run `pnpm install`.** Never `pnpm install` beside Ramzi's running dev server without saying so.
- **A `feat` on a 0.x package bumps the minor**, so a consumer pinned `^0.35.0` never picks it up. Bump the consumer's range in the same change.
