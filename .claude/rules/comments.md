---
paths:
  - "**/*.{ts,tsx,js,jsx,mjs,cjs,svelte,swift,py,go,rs,sh,css,sql}"
---
<!-- vibekit:rule -->
<!-- Generated from upsys/kit/ai-doc/rules/. Edit there, then run: node upsys/kit/ai-doc/scripts/sync-agents-core.cjs -->

# Comments

**A comment block caps at 30 words, in every language.** Lines with no blank between them are one block, and `@heyramzi/lint` warns on a push over it. Fix it when you're in the file. To check by hand: `node ~/Studio/upsys/kit/packages/lint/bin/heyramzi-comment-length.js <files>` (it isn't on PATH).

Write one sentence naming the trap, then a path to the reference that holds the reasoning. Never a paragraph, never a numbered list of reasons, never a second "WHY" after the first.

**A gate that catches bugs is a hard limit; a style gate warns.** Types, the backbone lock, load capture and banned APIs fail a push. Comment length, file tokens, snake_case keys and relative imports warn, because a month of them came due in one push (23 Oct 2026) and the fixes were churn. No gate keeps an allowlist: a violation gets fixed, never recorded.
