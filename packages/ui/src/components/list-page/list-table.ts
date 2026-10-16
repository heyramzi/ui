import { cn } from "@heyramzi/utils";

/**
 * The list-page table rhythm, Attio's: one 40px row, a hairline under each, a flat hover.
 */
export const listTable = {
  /** The header row: 36px, a hairline under it. On the cells: `thead` zeroes its row's border. */
  headRow: (className?: string) =>
    cn(
      "hover:translate-y-0 hover:bg-transparent hover:shadow-none [&>th]:h-9 [&>th]:border-b [&>th]:border-border",
      className,
    ),
  /** A body row. The shared row lifts on hover; a flush list row does not. */
  row: (className?: string) =>
    cn(
      "border-b border-border/50 last:border-b-0 hover:translate-y-0 hover:bg-muted/40 hover:shadow-none [&>td]:h-10 [&>td]:py-0",
      className,
    ),
};
