# Implementation plans

Written by the improve skill on 2026-11-09, at commit `14bdba4` (`standard` depth, ticket
TSK-2143). Nobody was available to pick, so the top 5 by leverage were planned by default. Execute
in this order unless the dependencies say otherwise.

| Plan | Title | Priority | Effort | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| [001](001-review-server-cross-site-writes.md) | The review server refuses cross-site writes and survives a dropped upload | P1 | S | none | DONE |
| [002](002-rich-renderer-url-schemes.md) | RichRenderer drops unsafe link and image URLs before `{@html}` | P1 | S | none | DONE |
| [003](003-rebase-connected-delete.md) | A canvas rebase survives deleting a card that has an arrow | P1 | S | none | DONE |
| [004](004-slash-menu-enter.md) | The slash menu opens only on a real slash command, and never eats Enter when empty | P2 | S | none | DONE |
| [005](005-verify-command-and-release-gate.md) | One `pnpm verify`, and a release runs it before it tags | P2 | S | none | DONE |

Status: TODO | IN PROGRESS | DONE | BLOCKED (one-line reason) | REJECTED (one-line reason)

## Dependencies

- None between plans. 002 and 004 both add a file under `packages/ui/src/editor/` and edit
  different existing files, so they can run in parallel.
- 005 step 3 edits `scripts/release.sh`, which had another session's uncommitted edits at
  planning time. Steps 1 and 2 don't wait for it.

## Findings not planned yet

Each was checked against the code unless marked "not vetted". Next run: plan from here.

| # | Finding | Category | Impact | Effort | Risk | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | Infinite scroll stalls when the sentinel stays in view after a page loads | bug | List stops loading until the user scrolls away and back | S | LOW | `packages/ui/src/components/data-table/infinite-scroll.svelte:35-49` |
| 7 | Hold-to-confirm never completes from the keyboard: key repeat restarts the hold | bug | Keyboard users can't confirm; rAF isn't cancelled on unmount | S | LOW | `packages/ui/src/components/hold-to-confirm/hold-to-confirm.svelte:45-50,90-95` |
| 8 | Grouped TableView keys each run by its group key, so interleaved rows give duplicate keys | bug | `each_key_duplicate` when a grouped table is sorted by another column | S | LOW | `packages/ui/src/components/table-view/table-view.svelte:153,408` |
| 9 | `umamiScriptAttrs` defaults to a placeholder host | security | An app that omits `hostUrl` loads script from a domain nobody here owns; the test pins it | S | LOW | `packages/marketing/src/analytics/svelte.ts:21,37`, `svelte.test.ts:4-13` |
| 10 | Time series chart shows dates a day early west of UTC | bug | `new Date("YYYY-MM-DD")` is UTC, formatted in local time | S | LOW | `packages/ui/src/charts/time-series-chart.svelte:87,134,164` |
| 11 | Kanban, list and gantt call `onMove` with `void`; the prop doc says "Awaited" | bug | A rejected save is an unhandled rejection with no UI state | M | MED | `packages/ui/src/work/use-kanban-dnd.svelte.ts:125,137`, `kanban-board.svelte:32` |
| 12 | The `.svelte` re-export test misses import-then-export; 5 shadcn index files do it | tests | The 2.21.0 PILL_TINT break can recur through `shadcn/button` | S | LOW | `packages/ui/src/svelte-reexports.test.ts:18-19`, `shadcn/button/index.ts:1-13` |
| 13 | CopyButton awaits an async value before `writeText` | bug | Safari drops the click permission; client-glance forked the component | S | LOW | `packages/ui/src/components/copy/copy-button.svelte:89-90` |
| 14 | `@dagrejs/dagre` is a dependency nothing imports | deps | Every consumer installs it | S | LOW | `packages/ui/package.json:398` at `14bdba4` (file in flight) |
| 15 | Markdown bridge drops tables, checklists and underline on a round trip | bug | An agent's read-then-write of a body loses them | M | MED | `packages/ui/src/editor/markdown.ts` (not vetted; pair with the planned parser dedupe) |
| 16 | `node` export condition points 19 entries at code that imports `.svelte` | dx | Plain Node fails on them | S | LOW | `packages/ui/package.json` exports (not vetted; file in flight) |
| 17 | No tests on `work/board-order.ts`, whose keys are stored in 3 apps' databases | tests | A regression writes bad order keys | M | LOW | `packages/ui/src/work/board-order.ts` (not vetted) |
| 18 | Review `parseAction` passes unchecked note fields to the adapter | security | A request can store arbitrary JSON in the notes file | S | LOW | `packages/review/src/server/guards.ts:86` (not vetted) |
| 19 | imagegen `html` tag doesn't escape quotes in attributes; satori fetches any URL | security | SSRF from an OG-image route that puts user text in an attribute | M | MED | `packages/marketing/src/imagegen/markup.ts:88-89` (not vetted) |
| 20 | README and COMPONENTS.md claims that are wrong against the code; no `@source` setup step | docs | Copy-paste examples fail; 12 apps hand-wrote the Tailwind line | S | LOW | `packages/ui/README.md:28-41,90`, `COMPONENTS.md:6,100,143` (not vetted) |
| 21 | 5 day and date helpers with 3 default locales | tech-debt | One page shows 3 date styles | M | MED | `work/dates.ts:22`, `work/time/duration.ts:37,44`, `record/logic.ts:18,45` (not vetted) |

## Direction

Options, not ranked against the table above.

- **An editable status badge in the kit.** `StatusBadge` is read-only, and agency-os, upsys and
  solusign-os each wrap it in the same dropdown (`status-pill.svelte`, already drifted in one).
  Cheap and additive; the cost is one more prop surface to keep stable.
- **Decide what DESIGN.md's drag rule means.** It says kanban, list and gantt drag by pointer
  capture; only the gantt does, the other two use HTML5 drag and drop. Either amend the rule (an
  hour) or move two organisms to pointer drag (days, and it changes the feel in 3 apps).
- **Record sections: npm or file sync.** About 2,500 lines of record UI are copied into 3 apps by
  a backbone sync and have drifted, while `@heyramzi/ui/record` has 3 consumers. Worth a spike to
  see what's generic. It moves a boundary another repo owns, so it needs that owner's say.
- **`TaskDetail` and `work/docs` have no adopters.** upsys built its own 327-line task detail.
  Find the gap and close it, or add both to the 3.0 removal list.

## Not audited

- `packages/ui/src/shadcn/` (vendored from upstream) and `packages/ui/src/agents/vendor/`.
- `packages/ui/src/thread/`, `src/triage/`, and every other uncommitted path: in flight.
- The site's pages, registry and demos, beyond its text endpoints: changed today or in flight.
- Runtime behaviour. No build, typecheck, test, `pnpm audit` or bundle report was run, so the
  dependency audit and every "ships X KB" claim are unmeasured.
- The 5 unused effects and the 20 demo exports: deferred to 3.0.
- Consumer apps, beyond grepping their imports.

## Considered and rejected

- Security headers and a CSP on the docs site: it's a static public site with no user data.
- `cn` duplicated between `@heyramzi/utils` and `lib/utils.ts`: deliberate, the file says why.
- Tone and status colour maps: already one `Tone` type with four views.
- The root `index.ts` barrel: 53 lines of effects only.
- Pen preview and eraser cost on long strokes: plausible, not profiled, no user report.
- `brandStyle` not rejecting quotes: no consumer calls it yet.
