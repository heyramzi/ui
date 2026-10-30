/**
 * The shapes the work organisms (kanban, task list, gantt) put on wrappers they don't render
 * themselves: a held card's hole, the focus ring around a consumer's card or row. The organism
 * picks the role, this file owns the radius, so a token edit moves every view at once.
 */
export const workLooks = {
  /** A card-sized hole: a drop slot, the held card's own place, an empty column. */
  hole: "rounded-xl bg-foreground/[0.03] outline-1 outline-dashed outline-border -outline-offset-1",
  /** The wrapper around a consumer's card, so its focus ring follows the card's corners. */
  card: "rounded-xl",
  /** A list row or a rail entry: control radius. */
  row: "rounded-lg",
  /** A one-line row: 32px, 44px on touch (DESIGN.md, Patterns: list rows). The snippet stretches to fill it; a two-line row grows. */
  rowHeight: "grid min-h-8 any-pointer-coarse:min-h-11",
  /** A row-sized hole: an empty list group. */
  rowHole: "rounded-lg outline-1 outline-dashed outline-border -outline-offset-1",
  /** A link wrapped round a chip: the focus ring takes the chip's corners. */
  chipLink: "rounded-sm outline-none focus-visible:shadow-(--ring-focus)",
  /** A quiet grey box inside a card: a command, a quote. Chip radius, no edge. */
  inset: "rounded-sm bg-muted/50",
  /** A surface that holds a whole list: the card step, whose shadow draws its own hairline. */
  panel: "rounded-xl bg-card text-card-foreground shadow-card",
} as const;

/**
 * The gantt's marks. A bar is a control-sized shape, a mark inside a row is chip-sized, and
 * the two round ones are a progress track and today's date number, which DESIGN rule 15
 * allows as a count.
 */
export const ganttLooks = {
  bar: "rounded-lg",
  mark: "rounded-sm",
  /** The readout that follows a dragged bar. */
  tip: "rounded-sm bg-foreground px-2 py-1 text-[11px] font-medium whitespace-nowrap text-background tabular-nums shadow-raised",
  /** A title that didn't fit its bar, set beside it. */
  outsideLabel: "rounded-sm bg-card/90 px-1 text-xs text-muted-foreground",
  track: "rounded-full",
  day: "rounded-full",
} as const;

/**
 * The doc pages' shapes. Their icon buttons and history button are controls, so they take the
 * Button atom's radius; the edited chip is a chip; the page's icon tile and the demo's frame are
 * card-sized.
 */
export const docLooks = {
  /** A 28px icon button or a full-width row button: control radius, as `Button`. */
  control: "rounded-lg",
  /** The "Edited" chip that opens the page's history. */
  chip: "rounded-sm",
  /** The icon tile above a page title. */
  tile: "rounded-xl",
  /** The frame a demo draws round a whole doc page. */
  frame: "rounded-xl",
} as const;
