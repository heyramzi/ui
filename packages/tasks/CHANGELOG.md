# Changelog

## Unreleased

### Breaking changes

* feat(tasks)!: remove `TaskViewSwitch`, `BoardIcon`, `ListIcon`, `GanttIcon` and the `TaskView` type; use `SegmentedFilter` from `@heyramzi/ui/components/segmented` with the Phosphor `Kanban`, `ListBullets` and `ChartBarHorizontal` icons
* feat(tasks)!: remove `TONE_CLASS`, `TONE_COLOR`, `TONE_ICON`, `TONE_TEXT`, `insetWellClass` and the `Tone` type; import them from `@heyramzi/ui/lib/tone.js` and `@heyramzi/ui/lib/panel.js`
* feat(tasks)!: `phosphor-svelte` is a peer dependency, and `@heyramzi/utils` a dependency

### Features

* feat(tasks): `SidePanel`, a sheet for one record with badges, doors out to other tools, a copy-a-prompt handoff and a stats strip, also at `@heyramzi/tasks/side-panel`
* feat(tasks): `StatusBadge` renders the kit `Badge`, and its busy state renders the kit `Spinner`
* feat(tasks): `StatusBadge` takes `dot`, a dot in the tone's colour before the label, and passes `title`, `aria-*` and other attributes to the badge

### Bug Fixes

* fix(tasks): `class` on a task component overrides its defaults, because `cn` now merges conflicting Tailwind classes
* fix(tasks): every icon is a Phosphor icon, not a private SVG

* feat(tasks): TaskList and TaskGantt take `flat`, which drops the card border, radius and fill
* feat(tasks): TimeTracker, an optional time log for one task with a start and stop timer, quick entry, day groups, a per-person split and an estimate ring
* feat(tasks): TimeTracker takes `flat`, which drops its card
* feat(tasks): TimeChip, TimeRing and TimeDot show logged time on cards and rows, with a pulsing dot while a timer runs
* feat(tasks): parseMinutes, formatMinutes and formatClock, and a `./time` subpath
* feat(tasks): KanbanBoard takes `onSelect`, called on Enter or Space on a focused card
* feat(tasks): KanbanBoard takes your own column type, a `limit` per column with `expanded`, a `hidden` rail with animated fold and unfold, a `columnFooter`, a `wrapColumn` for context menus, `getLabel` and `manualTiebreak`
* feat(tasks): onMove carries `beforeId` and `afterId` on a manual drop, and `boardOrder` only when you pass an accessor
* feat(tasks): the board folds a held card out of its column and slides a drop slot in, instead of fading the card
* feat(tasks): TaskList takes `getParent` to nest a group under another, and the group context carries `depth` and `hasChildren`
* feat(tasks): TaskList takes `actions`, `groupFooter`, `onCollapsedChange`, `getLabel`, `manualTiebreak` and `draggable={false}`
* feat(tasks): StatusBadge takes its text as children, and `capitalize` turns the capital letters off
* feat(tasks): the accent tone reads `--tone-accent` and falls back to `--color-primary`
* feat(tasks): the gantt nests tasks with getParent, folds them, and draws a parent's span from its children when it has no dates
* feat(tasks): the gantt takes undated tasks, milestones as a flag, a noDatesLabel and a label context of depth, hasChildren and open

## [0.2.0](https://github.com/heyramzi/ui/compare/board-v0.1.0...board-v0.2.0) (2026-10-06)

### Features

* feat(board): merge kanban and status into one board package


## [0.3.0](https://github.com/heyramzi/ui/releases/tag/tasks-v0.3.0) (2026-10-16)

### Features

* feat(tasks): @heyramzi/board becomes @heyramzi/tasks, with a list view and a gantt view

### Bug Fixes

* fix(tasks): the list chevron and the badge spinner are .svg files, not inline paths
* fix(tasks): the gantt progress fill scales instead of animating width


## [0.4.0](https://github.com/heyramzi/ui/compare/tasks-v0.3.0...tasks-v0.4.0) (2026-10-16)

### Features

* feat(tasks): TaskList takes getParent to nest a group under another
* feat(tasks): an Inbox to approve, decline or steer what an agent isn't sure about, and StatusDot gets a dashed ring and drops Tailwind
* feat(tasks): a time tracker, flat views, and a board, list and gantt that take more of your own config

### Bug Fixes

* fix(tasks): the board card and list row keep focus for the Alt+arrow move without an a11y warning
* fix(tasks): the gantt flag, the time tracker's play and delete, the rail chevron and the clock are .svg files, not inline paths


## [0.5.0](https://github.com/heyramzi/ui/compare/tasks-v0.4.0...tasks-v0.5.0) (2026-10-16)

### Features

* initial publish from this repo

