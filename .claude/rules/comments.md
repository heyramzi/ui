---
paths:
  - "**/*.{ts,tsx,js,jsx,mjs,cjs,svelte,swift,py,go,rs,sh,css,sql}"
---
<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Comments

**A comment block caps at 30 words, in every language.** Lines with no blank between them are one block, and `@heyramzi/lint` fails a push over it.

Write one sentence naming the trap, then a path to the reference that holds the reasoning. Never a paragraph, never a numbered list of reasons, never a second "WHY" after the first.

**No gate keeps an allowlist.** Every linter is a hard limit, and a violation gets fixed, never recorded. Never add an allowlist, baseline, ignore marker or `--update` mode to get a push through.
