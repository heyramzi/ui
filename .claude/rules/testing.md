---
paths:
  - "**/*.{ts,tsx,js,jsx,mjs,cjs,svelte,swift,py,go,rs,sh,css,sql}"
---
<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Testing

**Tests are E2E first, and you don't write unit or integration tests on your own.** A test you write is your reading of the intent, same as the code, so it can't catch you misreading it. On 25 Sep 2026 we cut back the unit suite on every website for restating the code. Outside evals agree: on SWE-bench Verified (arXiv 2602.07900), cutting agent-written tests left success flat and cut input tokens by a third or more.

- E2E is the default and usually the only mechanism. That's Playwright on the web and XCUITest on Apple, and each run leaves a trace, screenshot or report anyone can rerun.
- A unit or integration test needs a source outside your head. That's test cases Ramzi wrote or named, or a bug that really happened, reproduced as a failing test before the fix (`diagnose` owns that). Anything else, prove with E2E or say what's unproven.
- **Check what you changed: `check-changed <your paths>`, or `check-changed --staged`.** It lints those files, finds the tests that import them with a static import scan and runs only those, and typechecks only your files and what they import, then reports only errors in your files. `vp test related` is refused: it transforms every test file first, 3.3 GB and 10 minutes in upsys/app (27 Oct 2026). A whole-repo `svelte-check`, `pnpm check` or `vp test run` is refused: upsys/app's svelte-check needs a 3 to 4.6 GB heap, and 3 at once filled 16 GB of swap (26 Oct 2026). A change that truly needs the whole repo (a shared type, a config, a dependency bump) prefixes `FULL_CHECK=1`.
- **E2E runs the specs that reach your files: `check-changed --e2e <your paths>`.** It follows imports from your files to the SvelteKit routes that use them and runs only the specs that visit those routes, against the server Ramzi already has up. A one-component edit runs 2 specs, not 15. A whole `playwright test` or `pnpm test:e2e` is refused, because one spec held a gate slot for 11 minutes while every vitest run waited (26 Oct 2026). "No spec reaches these files" means the change is unproven by E2E: say so, or drive the page yourself. After a failure, `playwright test --last-failed` reruns only what broke.
- **Rerunning is free when nothing changed.** `check-changed` remembers a pass by your files' contents, so asking again skips straight to `pass`. Don't rerun a gate to feel sure; `--force` is for a flaky server, not for reassurance.
- **Vite+ runs the tests, never `npx vitest`.** Vite+ is the whole toolchain (Ramzi, 22 Oct 2026), and since `vp migrate` most packages no longer install `vitest` at all.
