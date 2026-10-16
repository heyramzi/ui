/**
 * The rail surface of a queue page, passed to `MasterDetail`'s `railClass`.
 * A class, not a wrapper: the shell's `<aside>` already owns the scroll height.
 */
// Copies of this string drifted to `rounded-lg`, the control radius, not the container one.
export const queueRailClass =
  "flex flex-col overflow-hidden rounded-xl border border-border bg-card";

/**
 * The rail column track, passed to `MasterDetail`'s `railWidth`. One page ran
 * 20px wider, so the detail pane jumped between pages.
 */
// 280px fits a two-line thread title. Past 340px the list competes with the record.
export const queueRailWidth = "minmax(280px, 340px)";

/**
 * Context key for the pane `MasterDetail` shows on a phone. Picking a row moves
 * to the record, so `RailRow` reads this instead of each page passing a callback.
 */
export const MASTER_DETAIL_PANE = Symbol("master-detail-pane");

export type MasterDetailPane = {
  /** Show the detail pane. No-op above the stack breakpoint, where both are visible. */
  open: () => void;
};
