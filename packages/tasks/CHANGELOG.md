# Changelog

## Unreleased

### Features

* feat(tasks): TaskList and TaskGantt take `flat`, which drops the card border, radius and fill
* feat(tasks): TimeTracker, an optional time log for one task with a start and stop timer, quick entry, day groups, a per-person split and an estimate ring
* feat(tasks): TimeTracker takes `flat`, which drops its card
* feat(tasks): TimeChip, TimeRing and TimeDot show logged time on cards and rows, with a pulsing dot while a timer runs
* feat(tasks): parseMinutes, formatMinutes and formatClock, and a `./time` subpath
* feat(tasks): KanbanBoard takes `onSelect`, called on Enter or Space on a focused card
* feat(tasks): KanbanBoard takes your own column type, a `limit` per column with `expanded`, a `hidden` rail with animated fold and unfold, a `columnFooter`, a `wrapColumn` for context menus, `getLabel` and `manualTiebreak`
* feat(tasks): onMove carries `beforeId` and `afterId` on a manual drop, and `boardOrder` only when you pass an accessor
* feat(tasks): the board folds a held card out of its column and slides a drop slot in, instead of fading the card
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

