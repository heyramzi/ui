import type { Snippet } from "svelte";

/** A column the board renders. `id` is the value `getColumn` returns for a card. */
export type KanbanColumn = {
  id: string;
  label: string;
  /** Any CSS color. Shown as a tint on the column while a card is held over it. */
  hue?: string;
  /** Screen-reader label for the column region. Defaults to `label`. */
  ariaLabel?: string;
  /**
   * Set false to make the column a display-only lane: cards there cannot be
   * dragged over or dropped onto (e.g. an Overdue lane). Defaults to true.
   */
  droppable?: boolean;
};

/** What the board asks the caller to persist after a drop. */
export type KanbanMove = {
  columnId: string;
  /**
   * Only set when the active sort is manual: a fractional key that places the
   * card in its new slot. Ignore it when you persist order some other way.
   */
  boardOrder?: string;
};

/** A named sort the board can apply instead of manual (`boardOrder`) ordering. */
export type KanbanSortKey<T> = {
  id: string;
  label: string;
  compare: (a: T, b: T) => number;
};

/** Second argument handed to the card snippet. */
export type KanbanCardContext = {
  columnId: string;
  index: number;
};

/** Second argument handed to the column header snippet. */
export type KanbanColumnContext = {
  count: number;
  active: boolean;
};

/** The default header renderer when no `columnHeader` snippet is given. */
export type KanbanCardSnippet<T> = Snippet<[T, KanbanCardContext]>;
