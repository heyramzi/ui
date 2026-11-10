# Gallery suite

Every page the site prerenders, at 390 and 1280 wide, in light and dark: 4 Playwright projects
(`390-light`, `390-dark`, `1280-light`, `1280-dark`). The page list is `build/sitemap.xml`, which
the sitemap route builds from the route folders and `nav.ts`, so a new page is covered with no
edit here.

Each test fails on:

- a console error or uncaught page error,
- an axe violation (WCAG 2.2 AA tags) that `axe-allowlist.json` doesn't list,
- an allowlist entry that no longer fires, so fixed entries get deleted,
- a screenshot that differs from its baseline (Linux only, see below).

## Commands

| What | Command |
| --- | --- |
| Run it (builds first) | `pnpm test:gallery` from the repo root |
| One page | `cd site && pnpm exec playwright test -g "/components/button$"` |
| One project | `cd site && pnpm exec playwright test --project 1280-dark` |
| Rewrite the axe allowlist in CI | `gh workflow run ci.yml -R heyramzi/ui -f record_axe=true` (commits it back) |
| Rewrite it on the Mac | `cd site && pnpm test:gallery:record-axe` (add `-g` or `--project` to rewrite only those) |
| Run it in CI (verify, then the suite with pixels) | `gh workflow run ci.yml -R heyramzi/ui` |
| Rewrite the screenshot baselines | `gh workflow run ci.yml -R heyramzi/ui -f update_baselines=true` |
| Open the last report | `cd site && pnpm exec playwright show-report e2e/report` |

The server is `serve.mjs`: it serves `build/` the way the Cloudflare assets binding does, on the
first free port from 3102 to 3109 (3101 is the dev server).

## Why screenshots compare on Linux only

A Mac renders text with different antialiasing, so a Mac baseline never matches CI and a CI
baseline never matches a Mac. The baselines in `__screenshots__/<project>/` are made by the CI
job above on the VPS runner image, which commits them back to the branch. On a Mac the suite
still runs every console and axe check and skips only the pixel compare. A project with no
baseline folder yet is skipped too; once the folder exists, a page without a baseline fails.

Axe results are the same on both: at commit a151edd the Mac and a CI runner recorded the same
872 page-rule-project entries.

CI is dispatch only and runs on the VPS runners, like every workflow here
(vibe-kit `ai-doc/references/github-actions-cost.md`). The Mac's pre-push hook doesn't run the
suite, so dispatch it after a change to the site or the kit, and `pnpm release` runs it before
every tag.
