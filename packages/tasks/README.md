# @heyramzi/tasks

Svelte 5 task views. One array of tasks shows as a drag-and-drop board, a
grouped list or a gantt timeline, and the same column config drives all three.
Status badges, dots and icons come from one map too. Live at
[ui.heyramzi.com/tasks](https://ui.heyramzi.com/tasks).

Every view knows nothing about your data. You pass items and a few accessors,
and it hands back a change to persist. No runtime dependencies: `svelte` is the
only peer. This package was `@heyramzi/board` up to 0.2.

```
pnpm add @heyramzi/tasks
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
  import { KanbanBoard, type KanbanMove } from "@heyramzi/tasks";

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
| `dropAtTop`     | `(columnId: string) => boolean`                         | Drops on a capped column go to the top.                     |
| `isDroppable`   | `(columnId: string) => boolean`                         | Overrides the per-column `droppable` flag.                  |

`onMove` gives `{ columnId, boardOrder? }`. `boardOrder` is only set for manual
sorting. It's a fractional key that places the card in its new slot, so a move
writes one row instead of renumbering a column.

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
(`Snippet<[group, { count, active, open }]>`), `collapsible` (default true) and
`collapsed` (group ids that start folded).

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
| `getStart`, `getEnd` | `(item: T) => string`               | ISO dates, inclusive. A one-day task has the same start and end. |
| `onChange`     | `(id, { start, end }) => void \| Promise<void>` | Called after a drag, a resize or a key nudge.        |
| `onSelect`     | `(id) => void`                            | A click or Enter that didn't move the bar.                  |
| `getHue`       | `(item: T) => string \| undefined`         | Bar color. Falls back to the group hue, then `--color-primary`. |
| `getProgress`  | `(item: T) => number \| undefined`         | 0 to 1, filled from the left.                               |
| `getDependsOn` | `(item: T) => string[] \| undefined`       | Draws an arrow from each listed task's end to this one's start. |
| `groups`, `getGroup` |                                     | Optional. Groups rows under a header with a span line.      |
| `renderLabel`  | `Snippet<[T]>`                            | The left column. Defaults to the title.                     |
| `from`, `to`   | `string`                                  | The shown range. Defaults to the tasks' span, padded, from a Monday. |
| `today`        | `string`                                  | Where the today line sits. Defaults to the viewer's today.  |
| `dayWidth`     | `number`                                  | Default 32. Under 18 the header shows week starts only.     |
| `rowHeight`, `labelWidth`, `labelHeading`, `locale` |      | Layout and text.                                            |

It opens scrolled to today, a third of the way in. Call `scrollToToday()` on a
`bind:this` reference to go back there.

## View switch

`TaskViewSwitch` is the segmented control the demo uses to flip between views,
with a pill that slides to the active option. Pass `views`
(`{ id, label, icon? }[]`) and `bind:value`. `BoardIcon`, `ListIcon` and
`GanttIcon` are exported for it.

## Also exported

- `KanbanColumn`: the column shell, if you want to build your own board.
- `createKanbanDnd`: the drag state and handlers behind the board and the list.
- `liftDragImage`: gives the browser a tilted, lifted drag snapshot.
- `boardOrderAt`, `keyBetween`: fractional order keys.
- `reorderByIds`: move an item to another item's index in a flat list.
- `addDays`, `dayNumber`, `isoFromDay`, `todayIso`: the date helpers the gantt uses.
- `StatusBadge`, `StatusDot`, `StatusIcon`: chips, dots and icons from one config.
- `defineStatuses`: builds a status registry from a plain map.
- `TONE_CLASS`, `TONE_COLOR`, `TONE_ICON`, `TONE_TEXT`, `insetWellClass`: the severity scale.
- `salesStatuses`: an example pipeline map.

## Styling

Classes are Tailwind, on shadcn-style tokens (`bg-card`, `border-border`,
`text-muted-foreground`, `--color-primary`). Point Tailwind at the package with
`@source` so it generates them. Motion reads the `--duration-*` and `--ease-*`
tokens from `@heyramzi/ui/animations` when they're there and falls back to the
same values when they aren't. Everything goes still under
`prefers-reduced-motion`.

## Demo

`src/demo.svelte` puts one task list behind a Board, List and Gantt switch, with
sorting, a Days and Weeks scale and a status badge strip.

The fractional ordering in `board-order.ts` is the CC0 algorithm from
[Implementing Fractional Indexing](https://observablehq.com/@dgreensp/implementing-fractional-indexing).

## License

[MIT](LICENSE)
