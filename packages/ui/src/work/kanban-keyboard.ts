import { boardOrderAt } from "#src/work/board-order.js";
import type { KanbanBoardInput } from "#src/work/kanban-board-state.svelte.js";
import type { KanbanColumn as KanbanColumnDef, KanbanMove } from "#src/work/kanban-types.js";

export type KanbanKeyboardConfig<T, C extends KanbanColumnDef> = {
  input: () => KanbanBoardInput<T, C>;
  canDrop: (columnId: string) => boolean;
  isHidden: (columnId: string) => boolean;
  sortedByColumn: (columnId: string) => T[];
  isCapped: (columnId: string, total: number) => boolean;
  moveAndPin: (id: string, move: KanbanMove) => void | Promise<void>;
};

/** A keyboard move: the column the card went to, and the caller's `onMove` result. */
export type KanbanKeyboardMove<C> = { column: C; done: void | Promise<void> };

/** The card's keydown handler: Enter or Space selects, Alt + arrow moves. */
export function createCardKeyDown<T, C extends KanbanColumnDef>(
  config: KanbanKeyboardConfig<T, C>,
) {
  const { input, canDrop, isHidden, sortedByColumn, isCapped, moveAndPin } = config;

  /**
   * Alt + ArrowLeft/Right moves the focused card to the next droppable column, so
   * keyboard and screen-reader users get drag's onMove contract. Returns the move, if one ran.
   */
  return function onCardKeyDown(e: KeyboardEvent, id: string): KanbanKeyboardMove<C> | undefined {
    const { onSelect, items, getId, getColumn, columns, sortKey, dropAtTop, boardOrder } = input();
    if (onSelect && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelect(id);
      return;
    }
    if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    const item = items.find((entry) => getId(entry) === id);
    if (!item) return;
    const current = getColumn(item);
    const at = columns.findIndex((c) => c.id === current);
    if (at === -1) return;
    const dir = e.key === "ArrowRight" ? 1 : -1;
    for (let i = at + dir; i >= 0 && i < columns.length; i += dir) {
      const target = columns[i];
      if (!canDrop(target.id) || isHidden(target.id) || target.id === current) continue;
      e.preventDefault();
      if (sortKey === "manual") {
        const column = sortedByColumn(target.id).filter((entry) => getId(entry) !== id);
        const atTop = dropAtTop?.(target.id) ?? isCapped(target.id, column.length + 1);
        const index = atTop ? 0 : column.length;
        const before = column[index - 1];
        const after = column[index];
        const done = moveAndPin(id, {
          columnId: target.id,
          ...(boardOrder
            ? { boardOrder: boardOrderAt(column, index, (entry) => boardOrder(entry)) }
            : {}),
          beforeId: before === undefined ? null : getId(before),
          afterId: after === undefined ? null : getId(after),
        });
        return { column: target, done };
      }
      return { column: target, done: moveAndPin(id, { columnId: target.id }) };
    }
  };
}
