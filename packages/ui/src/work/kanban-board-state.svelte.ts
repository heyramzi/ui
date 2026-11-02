import { untrack } from "svelte";
import { SvelteSet } from "svelte/reactivity";
import { prefersReducedMotion } from "svelte/motion";
import { cubicOut } from "svelte/easing";
import { durationMs } from "#src/lib/motion.js";
import { createKanbanDnd } from "#src/work/use-kanban-dnd.svelte.js";
import { createKanbanRailState } from "#src/work/kanban-rail-state.svelte.js";
import { createCardKeyDown } from "#src/work/kanban-keyboard.js";
import type {
  KanbanColumn as KanbanColumnDef,
  KanbanColumnContext,
  KanbanMove,
  KanbanSortKey,
} from "#src/work/kanban-types.js";

/** The board props the state reads, with the board's defaults already applied. */
export type KanbanBoardInput<T, C extends KanbanColumnDef> = {
  columns: C[];
  items: T[];
  getId: (item: T) => string;
  getColumn: (item: T) => string;
  onMove: (id: string, move: KanbanMove) => void | Promise<void>;
  boardOrder?: (item: T) => string | null | undefined;
  manualTiebreak?: (a: T, b: T) => number;
  sortKeys: KanbanSortKey<T>[];
  sortKey: string;
  onSelect?: (id: string) => void;
  limit: number | ((columnId: string) => number | undefined);
  expanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  hidden?: string[];
  onHiddenChange?: (ids: string[]) => void;
  dropAtTop?: (columnId: string) => boolean;
  isDroppable?: (columnId: string) => boolean;
};

/** One column as the board renders it: every card, the head over the fold and the tail in it. */
export type KanbanColumnView<T, C extends KanbanColumnDef> = {
  column: C;
  all: T[];
  head: T[];
  tail: T[];
  foldable: boolean;
  open: boolean;
  capped: boolean;
};

/**
 * A board's state: sort, the per-column fold and cap, and the drag wiring. The hidden rail
 * lives in `rail`, the keyboard move in `onCardKeyDown`.
 * Call it during component init, since it registers an effect. `input` is read on every use.
 */
export function createKanbanBoardState<T, C extends KanbanColumnDef>(
  input: () => KanbanBoardInput<T, C>,
) {
  // The drop slot takes the held card's height, so the column doesn't jump when it lands.
  let slotHeight = $state(0);
  let slotMotion = $derived({
    duration: prefersReducedMotion.current ? 0 : durationMs("quick"),
    easing: cubicOut,
  });

  let internalExpanded = $state<string[]>([]);
  let expandedIds = $derived(input().expanded ?? internalExpanded);

  function compare(a: T, b: T): number {
    const { sortKey, manualTiebreak, boardOrder, sortKeys } = input();
    if (sortKey === "manual") {
      const tie = manualTiebreak?.(a, b) ?? 0;
      if (!boardOrder) return tie;
      const ao = boardOrder(a);
      const bo = boardOrder(b);
      if (ao == null && bo == null) return tie;
      if (ao == null) return 1;
      if (bo == null) return -1;
      return ao < bo ? -1 : ao > bo ? 1 : tie;
    }
    const key = sortKeys.find((entry) => entry.id === sortKey);
    return key ? key.compare(a, b) : 0;
  }

  function sortedByColumn(columnId: string): T[] {
    const { items, getColumn } = input();
    return items
      .filter((item) => getColumn(item) === columnId)
      .slice()
      .sort(compare);
  }

  function idAt(list: T[], index: number): string | null {
    const item = list[index];
    return item === undefined ? null : input().getId(item);
  }

  function capOf(columnId: string): number | undefined {
    const { limit } = input();
    return typeof limit === "function" ? limit(columnId) : limit;
  }

  /** The column holds more cards than its cap, so it gets a fold. */
  function isFoldable(columnId: string, total: number): boolean {
    const cap = capOf(columnId);
    return cap !== undefined && total > cap;
  }

  // Open from this board's "Show N more", on top of the header caret's `expanded`.
  const laneOpen = new SvelteSet<string>();

  function isOpen(columnId: string): boolean {
    return expandedIds.includes(columnId) || laneOpen.has(columnId);
  }

  /** The fold is shut, so the tail is out of sight. */
  function isCapped(columnId: string, total: number): boolean {
    return isFoldable(columnId, total) && !isOpen(columnId);
  }

  // A card moved into a folded column stays in view, wherever its sort puts it.
  const pinned = new SvelteSet<string>();

  // The caret folding a column shuts this board's own fold of it too, so every lane lands on the cap.
  let previousExpanded: string[] = [];
  $effect(() => {
    const now = expandedIds;
    untrack(() => {
      for (const id of previousExpanded) if (!now.includes(id)) shut(id);
    });
    previousExpanded = [...now];
  });

  function moveAndPin(id: string, move: KanbanMove): void | Promise<void> {
    pinned.add(id);
    return input().onMove(id, move);
  }

  function canDrop(columnId: string): boolean {
    const { isDroppable, columns } = input();
    return isDroppable?.(columnId) ?? columns.find((c) => c.id === columnId)?.droppable ?? true;
  }

  function setExpanded(next: string[]): void {
    internalExpanded = next;
    input().onExpandedChange?.(next);
  }

  // Shutting drops the column's pins, so the fold closes to exactly its cap.
  function shut(columnId: string): void {
    laneOpen.delete(columnId);
    for (const item of sortedByColumn(columnId)) pinned.delete(input().getId(item));
  }

  /** "Show N more": opens this board's cell only. */
  function expand(columnId: string): void {
    laneOpen.add(columnId);
  }

  /** "Show less": shuts this board's cell, and lifts the caret's open if it was the caret's. */
  function collapse(columnId: string): void {
    shut(columnId);
    if (expandedIds.includes(columnId)) setExpanded(expandedIds.filter((id) => id !== columnId));
  }

  /** The header caret: the whole column, in every board that shares `expanded`. */
  function toggleColumn(columnId: string): void {
    if (expandedIds.includes(columnId)) collapse(columnId);
    else setExpanded([...expandedIds, columnId]);
  }

  const dnd = createKanbanDnd<T>({
    items: () => input().items,
    getId: (item) => input().getId(item),
    getColumn: (item) => input().getColumn(item),
    getColumnItems: sortedByColumn,
    getSortKey: () => input().sortKey,
    boardOrder: (item) => input().boardOrder?.(item),
    onMove: moveAndPin,
    dropAtTop: (columnId) =>
      input().dropAtTop?.(columnId) ?? isCapped(columnId, sortedByColumn(columnId).length),
    isDroppable: canDrop,
  });

  const rail = createKanbanRailState({
    hidden: () => input().hidden,
    onHiddenChange: () => input().onHiddenChange,
    canDrop,
    dnd,
  });

  const onCardKeyDown = createCardKeyDown<T, C>({
    input,
    canDrop,
    isHidden: (columnId) => rail.hiddenSet.has(columnId),
    sortedByColumn,
    isCapped,
    moveAndPin,
  });

  let view = $derived(
    input().columns.map((column): KanbanColumnView<T, C> => {
      const all = sortedByColumn(column.id);
      const cap = capOf(column.id);
      const foldable = isFoldable(column.id, all.length);
      const open = foldable && isOpen(column.id);
      if (!foldable || cap === undefined) {
        return { column, all, head: all, tail: [] as T[], foldable, open, capped: false };
      }
      // Head: the first `cap` cards plus any pinned ones, in sort order. The fold holds the rest.
      const head: T[] = [];
      const tail: T[] = [];
      all.forEach((item, index) => {
        (index < cap || pinned.has(input().getId(item)) ? head : tail).push(item);
      });
      return { column, all, head, tail, foldable, open, capped: !open && tail.length > 0 };
    }),
  );

  let hiddenColumns = $derived(input().columns.filter((column) => rail.hiddenSet.has(column.id)));

  function contextOf(entry: KanbanColumnView<T, C>, active: boolean): KanbanColumnContext {
    const { column, all, head, capped } = entry;
    return {
      count: all.length,
      active,
      shown: capped ? head.length : all.length,
      capped,
      hide: () => rail.hide(column.id),
      expand: () => expand(column.id),
      collapse: () => collapse(column.id),
    };
  }

  return {
    get slotHeight() {
      return slotHeight;
    },
    set slotHeight(value: number) {
      slotHeight = value;
    },
    get slotMotion() {
      return slotMotion;
    },
    get expandedIds() {
      return expandedIds;
    },
    get view() {
      return view;
    },
    get hiddenColumns() {
      return hiddenColumns;
    },
    dnd,
    rail,
    sortedByColumn,
    idAt,
    expand,
    collapse,
    toggleColumn,
    onCardKeyDown,
    contextOf,
  };
}

export type KanbanBoardState<T, C extends KanbanColumnDef> = ReturnType<
  typeof createKanbanBoardState<T, C>
>;
