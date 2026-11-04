# Craft refresh: what was in the tree (TSK-1794)

The half-built redesign of the shared look, found uncommitted on `main` on 4 Nov 2026: 178 paths,
most written 24 to 30 Oct, no session owning them. Branch: `design/craft-refresh`. Not released.

Releases 2.19.2 to 2.20.0 (4 Nov) already took the row-action and InfoList grid parts of
`craft.css`, so the branch carries only what's left over HEAD `7b36a18`. The real index held a stale
`craft.css` that would have reverted the row-action commit; it was unstaged, the file on disk kept.

## Tokens: finished

| File | What changed |
| --- | --- |
| `tokens/craft.css` | Radius scale moves to 6 / 10 / 14 / 18 / 22 (`sm` chip, `lg` control, `xl` card, `2xl` overlay, `3xl` shell); `xs` and `md` fold into `sm`. `--text-control` (13px) joins `--text-2xs`. `--elev-card` carries its own hairline and gains `--elev-card-hover`; raised and overlay drop a layer and get lighter. Focus ring goes from a 5px 16% halo to 3px 10%, plus `--ring-focus-inset` for rows in a clipped list. |
| `tokens/palette.css` | Light gets two levels: a grey canvas (`--brand-canvas-light`, L 0.945) under white cards; the sidebar sits on the canvas and its active item is a card. Dark card goes to L 0.2, the dark sidebar to the page colour, and dark `--color-input` is mixed from paper and surface so an input's edge holds 3:1. |
| `animations/dropdown.css`, `modal.css` | Menus grow from bits-ui's computed origin; modal timing on the tokens. |
| `charts/*.css`, `chart-tooltip`, `stat-tile`, `dashboard-section` | Tooltip and stat card on `--radius-lg` and the elevation steps instead of hand-written shadows. |

Fixed in this pass: the second "Type, by role" block that defined `--text-2xs` twice is gone.

## Atoms (`src/shadcn`): finished after this pass

69 files. Buttons, inputs, selects, menus, dialog, sheet, alert dialog, popover, tooltip, tabs,
sidebar and the rest moved onto `--ring-focus`, the radius roles and `shadow-btn` / `shadow-field` /
`shadow-edge-*`. New parts: `dialog-body`, `sheet-body` (header, body and a banded footer shared by
dialog, alert dialog and sheet) and `skeleton-delay` (a skeleton that waits before it shows).

Half-done, finished here: 14 controls still drew shadcn's 3px 50% ring (accordion, slider, radio,
scroll area, calendar selects, trace, bubble, sidebar group label and action, segmented, table-view
rows, tags input, InfoList's picker). They now use `--ring-focus`, or `--ring-focus-inset` for rows.
Tailwind's `shadow-xs` / `sm` / `md` / `lg` left on toggle, toggle group, radio, calendar selects,
switch, hover card, floating sidebar, the inset page and the docs' on-this-page menu moved onto
the elevation steps; the inset page is now a `bg-card` panel at `rounded-3xl` on the canvas.

## Molecules and organisms: finished after this pass

`components/` (list-page 14 files, segmented, table-view, tags-input, data-table, section-header,
docs, copy, picker), `status/` (new `status-pill`, the tinted pill StatusBadge draws), `charts/pop-value`
(new), `record/`, `panel/`, `inbox/`, `work/` (detail, time, gantt, docs, inbox, task list, kanban
column on `WorkWell`), `editor/`.

Half-done, finished here: 21 raw `text-[13px]` became `text-(length:--text-control)` and 5
`text-[11px]` became `text-2xs`. TableView's `@deprecated bare` prop, a no-op nobody passes, is
removed.

## Demos and docs: finished

`site/src/lib/Sidebar.svelte`, `demos/` (badge, colors, dialog, list-page, table-view, task-list),
the dialog line in `registry-meta.ts`. `packages/ui/DESIGN.md` (new: the four layers and what each
may do), its link in `packages/ui/README.md`, `status/README.md`.

## In the branch but not the redesign

`thread/*` (4 files) adds `ThreadEventRecord`, a record chip inside an activity line (2 Nov). It's
a feature, tangled with the thread's restyle in one 180-line diff, so it rides along; review it apart.

## Left in the tree, not this redesign

- `.claude/rules/*`, `AGENTS.md`: the vibe-kit agents-core sync. Generated, belongs to that sync.
- `packages/review/src/ui/*`: formatter reflow only.
- `scripts/release.sh`: a comment for the tasks-to-work rename.
- `charts/motion.ts`: `tokenMs` re-exported from `lib/motion` (a compat shim; a refactor, not design).
- The triage module (27 Oct): `src/triage/`, its `package.json` export, `modules.test.ts`, the site
  demo, `component-sources.ts`, `registry.ts` and the triage entry in `registry-meta.ts`.
- `vite.config.ts` (root fmt config), `.vite-hooks/` (hook installer), `packages/ui/.svelte-check/` (cache).
