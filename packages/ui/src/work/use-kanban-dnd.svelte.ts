import { boardOrderAt } from "#src/work/board-order.js";
import type { KanbanMove } from "#src/work/kanban-types.js";

export type KanbanDragOver = { columnId: string; overId: string | null };

export type KanbanDndConfig<T> = {
  items: () => readonly T[];
  getId: (item: T) => string;
  getColumn: (item: T) => string;
  getColumnItems: (columnId: string) => readonly T[];
  /** The active sort. `"manual"` orders by `boardOrder`; anything else is a move only. */
  getSortKey: () => string;
  boardOrder?: (item: T) => string | null | undefined;
  onMove: (id: string, move: KanbanMove) => void | Promise<void>;
  /** A capped column hides its tail, so a drop on its empty space should land on top. */
  dropAtTop?: (columnId: string) => boolean;
  /**
   * Return false for display-only lanes (e.g. an Overdue lane). The board then
   * never calls preventDefault for that column, so it is not a drop target.
   */
  isDroppable?: (columnId: string) => boolean;
};

/**
 * A board's drag state and handlers, on native HTML5 drag so a card can leave the board for
 * any drop target a caller wired up.
 */
export function createKanbanDnd<T>(config: KanbanDndConfig<T>) {
  let draggedId = $state<string | null>(null);
  let dragOver = $state<KanbanDragOver | null>(null);

  function readDraggedId(e: DragEvent): string | null {
    const raw = e.dataTransfer?.getData("text/plain");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { id?: string };
      return parsed.id ?? null;
    } catch {
      return null;
    }
  }

  function onDragStart(e: DragEvent, id: string): void {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify({ id }));
    }
    // Defer: marking the source during the dragstart event makes some browsers
    // snapshot the faded state instead of the card.
    requestAnimationFrame(() => {
      draggedId = id;
    });
  }

  function onItemDragOver(
    e: DragEvent,
    columnId: string,
    overId: string,
    nextId: string | null,
  ): void {
    if (config.isDroppable && !config.isDroppable(columnId)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const insertAfter = e.clientY > rect.top + rect.height / 2;
    const targetOverId = insertAfter ? nextId : overId;

    if (targetOverId === draggedId) return;
    if (dragOver?.columnId === columnId && dragOver.overId === targetOverId) return;
    dragOver = { columnId, overId: targetOverId };
  }

  function onColumnDragOver(e: DragEvent, columnId: string): void {
    if (config.isDroppable && !config.isDroppable(columnId)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (dragOver?.columnId !== columnId || dragOver.overId !== null) {
      dragOver = { columnId, overId: null };
    }
  }

  function onDragLeave(e: DragEvent): void {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      dragOver = null;
    }
  }

  function clearDragOver(): void {
    dragOver = null;
  }

  function resetDrag(): void {
    draggedId = null;
    dragOver = null;
  }

  /** Where a manual drop lands: on the hovered card, else the top or the end. */
  function manualInsertIndex(
    column: readonly T[],
    overId: string | null,
    columnId: string,
  ): number {
    const overIndex = overId ? column.findIndex((item) => config.getId(item) === overId) : -1;
    if (overIndex !== -1) return overIndex;
    return config.dropAtTop?.(columnId) ? 0 : column.length;
  }

  function onDrop(e: DragEvent, targetColumnId: string): void {
    e.preventDefault();
    if (config.isDroppable && !config.isDroppable(targetColumnId)) return;
    const overId = dragOver?.overId ?? null;
    dragOver = null;
    draggedId = null;

    const id = readDraggedId(e);
    const item = id ? config.items().find((entry) => config.getId(entry) === id) : undefined;
    if (!item) return;

    const movedId = config.getId(item);

    if (config.getSortKey() !== "manual") {
      if (config.getColumn(item) !== targetColumnId) {
        void config.onMove(movedId, { columnId: targetColumnId });
      }
      return;
    }

    const column = config
      .getColumnItems(targetColumnId)
      .filter((entry) => config.getId(entry) !== movedId);
    const index = manualInsertIndex(column, overId, targetColumnId);
    const before = column[index - 1];
    const after = column[index];
    const orderOf = config.boardOrder;
    void config.onMove(movedId, {
      columnId: targetColumnId,
      ...(orderOf ? { boardOrder: boardOrderAt(column, index, orderOf) } : {}),
      beforeId: before === undefined ? null : config.getId(before),
      afterId: after === undefined ? null : config.getId(after),
    });
  }

  return {
    get draggedId() {
      return draggedId;
    },
    get dragOver() {
      return dragOver;
    },
    set dragOver(value: KanbanDragOver | null) {
      dragOver = value;
    },
    onDragStart,
    onItemDragOver,
    onColumnDragOver,
    onDragLeave,
    onDrop,
    clearDragOver,
    resetDrag,
    isDragSource(id: string): boolean {
      return draggedId === id;
    },
    showIndicatorBefore(columnId: string, itemId: string): boolean {
      return dragOver?.columnId === columnId && dragOver.overId === itemId && draggedId !== null;
    },
    showIndicatorEnd(columnId: string): boolean {
      return dragOver?.columnId === columnId && dragOver.overId === null && draggedId !== null;
    },
  };
}
