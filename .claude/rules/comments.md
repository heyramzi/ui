---
paths:
  - "**/*.{ts,tsx,js,jsx,mjs,cjs,svelte,swift,py,go,rs,sh,css,sql}"
---
<!-- vibekit:rule -->
<!-- Generated from upsys/kit/ai-doc/rules/. Edit there, then run: node upsys/kit/ai-doc/scripts/sync-agents-core.cjs -->

# Comments

**A comment block caps at 30 words, in every language.** Lines with no blank between them are one block, and `@heyramzi/lint` warns on a push over it. Fix it when you're in the file. To check by hand: `node ~/Studio/upsys/kit/packages/lint/bin/heyramzi-comment-length.js <files>` (it isn't on PATH).

A comment holds what the code can't show: a platform bug, an outside rule, a trade-off. Write it as one sentence naming the trap, plus a path to the reference that holds the reasoning. Delete a comment that says what the next line does, tells the history of the change ("now we", "fixed the bug where": git holds that), or marks a section (split the file instead). Swift's `// MARK: -` is the one section marker that stays, because Xcode's jump bar reads it.

A hack marker (`TODO`, `FIXME`, `HACK`, "for now", a temporary fix, backward compat) fails a push in every language. Fix the hack, or file a TSK and delete the comment: an agent copies a comment that excuses a hack along with the hack. A history phrase ("now we", "used to", "was changed to") only warns.

**A gate that catches bugs is a hard limit; a style gate warns.** Types, the backbone lock, load capture and banned APIs fail a push. Comment length, file tokens, snake_case keys and relative imports warn, because a month of them came due in one push (23 Oct 2026) and the fixes were churn. No gate keeps an allowlist: a violation gets fixed, never recorded.
