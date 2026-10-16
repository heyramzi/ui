# @heyramzi/board

A generic Svelte 5 kanban board plus configuration-driven status badges, dots
and icons. Merged from `@heyramzi/kanban` and `@heyramzi/status`: one package,
one version line.

## Board

The board owns the layout, the drag state and the drop logic, and knows
nothing about your data: you pass columns, items and three accessors, and it
hands back a move to persist.

Drag and drop is native HTML5 (`draggable`, `dragover`, `drop`), so cards can
also be dropped on elements outside the board if you wire those up. Keyboard
users move the focused card with Alt plus Left or Right arrow. A column with
`droppable: false` is display only: it never calls `preventDefault`, so it is
not a drop target (e.g. an Overdue lane).

## Install

```
pnpm add @heyramzi/board
```

`@heyramzi/board` has no runtime dependencies. `svelte` is a peer.

## Usage

```svelte
<script lang="ts">
  import { KanbanBoard, type KanbanMove } from "@heyramzi/board";

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

## Props

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
sorting. It is a fractional key that places the card in its new slot.

## Also exported

- `KanbanColumn`: the column shell, if you want to build your own board.
- `createKanbanDnd`: the drag state and handlers behind the board.
- `liftDragImage`: gives the browser a tilted, lifted drag snapshot.
- `reorderByIds`: move an item to another item's index in a flat list.
- `StatusBadge`, `StatusDot`, `StatusIcon`: chips, dots and icons from one config.
- `defineStatuses`: builds a status registry from a plain map.
- `TONE_CLASS`, `TONE_COLOR`, `TONE_ICON`, `TONE_TEXT`, `insetWellClass`: the severity scale.
- `salesStatuses`: an example pipeline map.

## Demo

`src/demo.svelte` is a four column board of tasks (one lane display only)
with a sort switch and a status badge strip.
