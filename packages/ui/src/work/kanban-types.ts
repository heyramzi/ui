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
  /**
   * The drop slot's neighbours, for a backend that orders by neighbour, not by
   * key. Set on manual drops only, null at an end.
   */
  beforeId?: string | null;
  afterId?: string | null;
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

/** Second argument handed to the column header and footer snippets. */
export type KanbanColumnContext = {
  /** Every card in the column, including the ones a `limit` keeps out of view. */
  count: number;
  /** A card is held over the column. */
  active: boolean;
  /** How many cards render. Fewer than `count` while the column is capped. */
  shown: number;
  /** The column's `limit` is hiding its tail. */
  capped: boolean;
  /** Fold the column into the hidden rail. Needs `hidden` or `onHiddenChange` on the board. */
  hide: () => void;
  /** Lift the `limit` so every card shows. */
  expand: () => void;
};

/** The default header renderer when no `columnHeader` snippet is given. */
export type KanbanCardSnippet<T> = Snippet<[T, KanbanCardContext]>;
