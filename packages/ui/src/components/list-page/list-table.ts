import { cn } from "#src/lib/utils.js";

/** The list-page table rhythm: 32px rows (DESIGN.md rule 19), hairlines, a flat hover. */

// The header is a muted band tinted off the foreground, so it shows on card and canvas.
export const listTable = {
  /** The header row: 32px, muted, a hairline under it. On the cells: `thead` zeroes its row's border. */
  headRow: (className?: string) =>
    cn(
      "hover:translate-y-0 hover:bg-transparent hover:shadow-none [&>th]:h-8 [&>th]:border-b [&>th]:border-border [&>th]:bg-foreground/3 [&>th]:text-xs [&>th]:font-medium [&>th]:text-muted-foreground",
      className,
    ),
  /** A body row. The shared row lifts on hover; a flush list row does not. */
  row: (className?: string) =>
    cn(
      "border-b border-border/50 last:border-b-0 hover:translate-y-0 hover:bg-foreground/3 hover:shadow-none [&>td]:h-8 [&>td]:py-0 [&>td]:tabular-nums any-pointer-coarse:[&>td]:h-11",
      className,
    ),
};
