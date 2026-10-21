# @heyramzi/ui/tasks

Svelte 5 task views. One array of tasks shows as a drag-and-drop board, a
grouped list or a gantt timeline, and the same column config drives all three.
Status badges, dots and icons come from one map too. Live at
[ui.heyramzi.com/tasks](https://ui.heyramzi.com/tasks).

Every view knows nothing about your data. You pass items and a few accessors,
and it hands back a change to persist. It is a subpath of `@heyramzi/ui` and builds on its primitives and on
`phosphor-svelte` and `svelte`.

```
pnpm add @heyramzi/ui phosphor-svelte
```

## Board

The board owns the layout, the drag state and the drop logic. Drag and drop is
native HTML5 (`draggable`, `dragover`, `drop`), so cards can also land on
elements outside the board if you wire those up. Keyboard users move the
focused card with Alt plus Left or Right arrow. A column with
`droppable: false` is display only: it never calls `preventDefault`, so it
isn't a drop target (an Overdue lane, say).

```svelte
<script lang="ts">
  import { KanbanBoard, type KanbanMove } from "@heyramzi/ui/tasks";

  type Task = { id: string; column: string; title: string; order: string };

  let tasks = $state<Task[]>([]);

  const columns = [
    { id: "todo", label: "To do" },
    { id: "doing", label: "In progress", hue: "var(--color-info)" },
    { id: "overdue", label: "Overdue", droppable: false },
    { id: "done", label: "Done", hue: "var(--color-success)" },
  ];

  function onMove(id: string, move: KanbanMove) {
    tasks = tasks.map((task) =>
      task.id === id
        ? { ...task, column: move.columnId, order: move.boardOrder ?? task.order }
        : task,
    );
  }
</script>

<KanbanBoard
  {columns}
  items={tasks}
  getId={(task) => task.id}
  getColumn={(task) => task.column}
  boardOrder={(task) => task.order}
  {onMove}
>
  {#snippet renderCard(task)}
    <article class="rounded-xl border border-border bg-card p-2.5">{task.title}</article>
  {/snippet}
</KanbanBoard>
```

| Prop            | Type                                                    | Notes                                                        |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| `columns`       | `KanbanColumn[]`                                        | `{ id, label, hue?, ariaLabel?, droppable? }`. `hue` tints the column while a card is over it. `droppable: false` makes it display only. |
| `items`         | `T[]`                                                   | Every card.                                                 |
| `getId`         | `(item: T) => string`                                   | Stable id, used for keys and drag payloads.                 |
| `getColumn`     | `(item: T) => string`                                   | Which column the card belongs to.                           |
| `onMove`        | `(id: string, move: KanbanMove) => void \| Promise<void>` | Called on drop. Awaited.                                 |
| `renderCard`    | `Snippet<[T, { columnId, index }]>`                     | Card markup.                                                |
| `boardOrder`    | `(item: T) => string \| null \| undefined`               | Manual order key. Required for `sortKey="manual"`.          |
| `sortKeys`      | `KanbanSortKey<T>[]`                                    | Extra sorts, `{ id, label, compare }`.                     |
| `sortKey`       | `string`                                                | Active sort. Defaults to `"manual"`.                        |
| `columnHeader`  | `Snippet<[KanbanColumn, { count, active }]>`            | Optional header. Defaults to label plus count.              |
| `emptyLabel`    | `string`                                                | Shown in an empty column.                                   |
| `dropAtTop`     | `(columnId: string) => boolean`                         | Drops on a capped column go to the top. Defaults to "is `limit` hiding its tail".  |
| `isDroppable`   | `(columnId: string) => boolean`                         | Overrides the per-column `droppable` flag.                  |
| `manualTiebreak` | `(a: T, b: T) => number`                               | Settles two cards with the same manual key, or none.        |
| `getLabel`      | `(item: T) => string`                                   | The screen-reader name of a card. Defaults to a keyboard hint. |
| `onSelect`      | `(id: string) => void`                                  | Enter or Space on a focused card.                           |
| `columnFooter`  | `Snippet<[Column, KanbanColumnContext]>`                | Under a column's cards: a "Show all" or an add button.      |
| `wrapColumn`    | `Snippet<[Column, Snippet<[props]>]>`                   | Wraps a whole column, for a context menu. Render the inner snippet once with the props you are handed. |
| `limit`         | `(columnId: string) => number \| undefined`             | Cards a column shows before the rest fold. `expanded` and `onExpandedChange` lift it per column. |
| `hidden`        | `string[]`                                              | Columns folded into a rail on the right. Fold and unfold animate, and a card dropped on a rail entry brings the column back. `onHiddenChange`, `hiddenLabel`, `showAllLabel` and `hiddenItem` go with it. |

`columns` can be your own type, as long as it extends `KanbanColumn`: the
header, footer and wrap snippets get it back as you passed it, so a column can
carry a status or a stage for your own markup. The header and footer context is
`{ count, active, shown, capped, hide, expand }`.

`onMove` gives `{ columnId, boardOrder?, beforeId?, afterId? }`. On a manual
drop `beforeId` and `afterId` name the cards above and below the new slot (null
at an end), for a backend that orders by neighbour. `boardOrder` is set when you
pass a `boardOrder` accessor. It's a fractional key that places the card in its
new slot, so a move writes one row instead of renumbering a column.

## List

`TaskList` takes the board's columns as `groups` and the board's `onMove`, so a
page can switch between the two without a second code path. Rows sit under a
header per group that folds open and shut. Drag a row to another group or
another slot, or focus it and press Alt plus Up or Down to send it to the next
group. Rows slide into their new place when the order changes.

```svelte
<TaskList
  groups={columns}
  items={tasks}
  getId={(task) => task.id}
  getGroup={(task) => task.column}
  boardOrder={(task) => task.order}
  {onMove}
>
  {#snippet head()}
    <div class="grid w-full grid-cols-[1fr_6rem] px-3.5"><span>Task</span><span>Due</span></div>
  {/snippet}
  {#snippet renderRow(task)}
    <div class="grid h-10 grid-cols-[1fr_6rem] items-center px-2">{task.title}<span>{task.due}</span></div>
  {/snippet}
</TaskList>
```

Beyond the board's props it takes `head` (a sticky header row), `groupHeader`
(`Snippet<[group, { count, active, open, depth, hasChildren }]>`), `actions` (controls at the end of
a group header, shown on hover), `groupFooter` (an add-task row under the rows),
`collapsible` (default true), `collapsed` (group ids that start folded) and
`onCollapsedChange`. Pass `flat` to drop the card border, radius and fill so the list sits on the page (the gantt takes it too); group dividers stay. Pass `draggable={false}` for a list that only groups: rows
lose the drag handlers and the keyboard move, so links and buttons inside them
keep every key.

Pass `getParent` to nest one group under another, such as a project under its
client. It takes a group and returns the id of its parent, or nothing for a
top-level group. A child draws inside its parent's section, indented, with its
own sticky header under the parent's, and folds when the parent folds. A parent
takes no drops and its `count` adds up its children. A child whose parent id
matches no group is drawn at the top level.

```svelte
<TaskList
  groups={[
    { id: "acme", label: "Acme" },
    { id: "acme-site", label: "Website", parent: "acme" },
    { id: "acme-audit", label: "Audit", parent: "acme" },
  ]}
  getParent={(group) => group.parent}
  ...
/>
```

## Gantt

`TaskGantt` draws each task as a bar from its start to its end date, both
inclusive ISO dates (`"2026-10-16"`). Drag a bar to move it, drag an edge to
resize it, and the bar glides from day to day while a tip shows the new range.
A focused bar moves a day with the arrow keys, and Shift plus an arrow moves
its end. Leave out `onChange` and the chart is read only.

```svelte
<TaskGantt
  items={tasks}
  getId={(task) => task.id}
  getTitle={(task) => task.title}
  getStart={(task) => task.start}
  getEnd={(task) => task.end}
  getDependsOn={(task) => task.blockedBy}
  groups={columns}
  getGroup={(task) => task.column}
  onChange={(id, { start, end }) => save(id, start, end)}
/>
```

| Prop           | Type                                      | Notes                                                       |
| -------------- | ----------------------------------------- | ----------------------------------------------------------- |
| `items`, `getId`, `getTitle` |                             | Required.                                                   |
| `getStart`, `getEnd` | `(item: T) => string \| null \| undefined` | ISO dates, inclusive. A one-day task has the same start and end. One date alone is a one-day task, none is undated. A parent with no dates draws the span of its children as an outline bar. |
| `onChange`     | `(id, { start, end }) => void \| Promise<void>` | Called after a drag, a resize or a key nudge.        |
| `onSelect`     | `(id) => void`                            | A click or Enter that didn't move the bar.                  |
| `getHue`       | `(item: T) => string \| undefined`         | Bar color. Falls back to the group hue, then `--color-primary`. |
| `getProgress`  | `(item: T) => number \| undefined`         | 0 to 1, filled from the left.                               |
| `getDependsOn` | `(item: T) => string[] \| undefined`       | Draws an arrow from each listed task's end to this one's start. |
| `groups`, `getGroup` |                                     | Optional. Groups rows under a header with a span line.      |
| `getParent`    | `(item: T) => string \| null \| undefined` | Nests a task under another by id: indented, foldable, depth first. |
| `collapsed`    | `string[]`                                | Parent ids that start folded.                               |
| `isMilestone`  | `(item: T) => boolean`                    | Draws a flag at the end date instead of a bar. Not draggable. |
| `noDatesLabel` | `string`                                  | Shown for a task with no dates. Default "No dates".         |
| `renderLabel`  | `Snippet<[T, { depth, hasChildren, open }]>` | The left column. Defaults to the title.                  |
| `from`, `to`   | `string`                                  | The shown range. Defaults to the tasks' span, padded, from a Monday. |
| `today`        | `string`                                  | Where the today line sits. Defaults to the viewer's today.  |
| `dayWidth`     | `number`                                  | Default 32. Under 18 the header shows week starts only.     |
| `rowHeight`, `labelWidth`, `labelHeading`, `locale` |      | Layout and text.                                            |

It opens scrolled to today, a third of the way in. Call `scrollToToday()` on a
`bind:this` reference to go back there.

## View switch

There is no switch in this package. The demo flips between views with
`SegmentedFilter` from `@heyramzi/ui/components/segmented` and the Phosphor
icons `Kanban`, `ListBullets` and `ChartBarHorizontal`. Phosphor has no gantt
icon, so `ChartBarHorizontal` stands in.

## Side panel

`SidePanel` is a sheet for one record: a title, a description, status chips, doors
out to other tools (`openIn`), a copy-a-prompt `handoff`, a strip of `stats`, then
the body and an optional pinned `footer`. You pass the tools; the panel knows none.
Import it from `@heyramzi/ui/tasks` or alone from `@heyramzi/ui/tasks/side-panel`.

```svelte
<SidePanel
  bind:open
  title="Pricing page"
  description="Ada, due Friday"
  badges={[{ label: "Review", tone: "warning" }]}
  openIn={[{ tool: github, href: issueUrl, label: "Open the issue on GitHub" }]}
  stats={[{ label: "Logged", value: "6h 30m", sub: "of 8h" }]}
>
  ...
</SidePanel>
```

`tool` is an `OpenInTool` from `@heyramzi/ui/components/open-in`:
`{ name, action, icon }`. `bare` hands the whole panel to the body, and `width`
runs from `sm` to `2xl`.

## Time tracking

Optional. `TimeTracker` logs time against one task: a start and stop timer, quick
entry that reads `1h30`, `90m`, `1.5h` or `1:30`, a date and a note, entries
grouped by day with day totals, a per-person split and an optional estimate shown
as a ring that turns warning at 90% and destructive past 100%. It holds no data
and fetches nothing. You pass entries in and persist what it hands back.

```svelte
<TimeTracker
  entries={entries}
  getId={(e) => e.id}
  getMinutes={(e) => e.minutes}
  getDay={(e) => e.day}
  getPerson={(e) => e.person}
  estimate={480}
  {running}
  onStart={() => (running = { startedAt: Date.now() })}
  onStop={(info) => save(info.minutes, info.day)}
  onLog={(input) => save(input.minutes, input.day, input.note)}
  onDelete={(entry) => remove(entry.id)}
/>
```

| Prop | Type | Notes |
| --- | --- | --- |
| `entries` | `T[]` | Every entry on the task. |
| `getId`, `getMinutes`, `getDay`, `getPerson` | accessors | `getDay` returns `YYYY-MM-DD`. |
| `getPersonId`, `getNote` | accessors | Optional. The id keeps two people with one name apart. |
| `running` | `{ startedAt } \| null` | The host stores it, so it survives a reload. |
| `estimate` | `number` | Minutes budgeted. Draws the ring. |
| `onStart` | `() => void` | The host sets `running`. |
| `onStop` | `(info) => void` | `info` is `{ minutes, startedAt, stoppedAt, day }`. Clear `running` after saving. |
| `onLog` | `(input) => void \| boolean` | `input` is `{ minutes, day, note? }`. Return `false` to keep the fields. |
| `onDelete`, `canDelete` | callback | The delete button shows when `onDelete` is set and `canDelete` allows it. |
| `renderMeta` | `Snippet<[T]>` | Extra text after a row's note. |
| `flat` | `boolean` | Drops the card (border, radius, background, shadow, padding) for a host that already has a panel. The running state then shows through the dot, readout and button. |
| `locale`, `labels`, `class` | | `labels` overrides any string in `DEFAULT_TIME_LABELS`. |

Alt+S starts and stops the timer. A screen reader hears the start, one update a
minute and the stop. Import it alone from `@heyramzi/ui/tasks/time`.

For boards and lists: `TimeChip` (`minutes`, `estimate?`, `running?`) shows the
logged total, with a pulsing dot while a timer runs and a small ring against an
estimate. `TimeRing` and `TimeDot` are the pieces under it.
`parseMinutes`, `formatMinutes`, `formatClock`, `budgetTone` and `localDay` are
exported helpers.

## Also exported

- `KanbanColumn`: the column shell, if you want to build your own board.
- `createKanbanDnd`: the drag state and handlers behind the board and the list.
- `liftDragImage`: gives the browser a tilted, lifted drag snapshot.
- `boardOrderAt`, `keyBetween`: fractional order keys.
- `reorderByIds`: move an item to another item's index in a flat list.
- `addDays`, `dayNumber`, `isoFromDay`, `todayIso`: the date helpers the gantt uses.
- `StatusBadge`, `StatusDot`, `StatusIcon`: chips, dots and icons from one config.
  A badge also takes its text as children, for a caller that already has the word.
- `defineStatuses`: builds a status registry from a plain map.
- `SidePanel`: a sheet for one record, above.
- `salesStatuses`: an example pipeline map.

## Styling

The severity scale (`TONE_CLASS`, `TONE_TEXT`, `TONE_ICON`, `TONE_COLOR`) lives in
`@heyramzi/ui/lib/tone.js`, and `insetWellClass` in `@heyramzi/ui/lib/panel.js`.
The accent tone reads `--tone-accent` and falls back to `--color-primary`. Set
`--tone-accent` when your primary is a neutral and your accent is a brand color.

Classes are Tailwind, on shadcn-style tokens (`bg-card`, `border-border`,
`text-muted-foreground`, `--color-primary`). Point Tailwind at the package with
`@source` so it generates them. Motion reads the `--duration-*` and `--ease-*`
tokens from `@heyramzi/ui/animations` when they're there and falls back to the
same values when they aren't. Everything goes still under
`prefers-reduced-motion`.

## Demo

`src/demo.svelte` puts one task list behind a Board, List and Gantt filter, with
sorting, a Days and Weeks scale and a status badge strip.

The fractional ordering in `board-order.ts` is the CC0 algorithm from
[Implementing Fractional Indexing](https://observablehq.com/@dgreensp/implementing-fractional-indexing).

## License

[MIT](LICENSE)
