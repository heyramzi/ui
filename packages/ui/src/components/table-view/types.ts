/** One column of a `TableView`. */
export interface TableColumn<Row> {
  /** The key of the value in the row. */
  key: string;
  label: string;
  /** A number or an amount: right-aligned, tabular figures, never wraps. */
  numeric?: boolean;
  /** Turns the raw value into the text shown. A string value that has no `format` prints as it is. A money column passes its own currency formatter. */
  format?: (value: unknown, row: Row) => string;
  /** A column width such as `"30%"` or `"8rem"`. Leave it out and the table shares the rest. */
  width?: string;
  /** Draws the column in the muted colour. */
  muted?: boolean;
  /** Click or press Enter on the head to sort. The table sorts nothing itself: bind `sort` and order `rows` with `sortRows`. */
  sortable?: boolean;
  /** Lifts the column's cells above the row link, so a button or a link inside it takes its own click. */
  interactive?: boolean;
  /** Hidden below this breakpoint, head and cells both. */
  hideBelow?: "sm" | "md" | "lg";
  /** Pins the column to the left edge while the table scrolls sideways. */
  sticky?: boolean;
  /** Extra classes on the column's cells (and its head, unless `headClass` is set). */
  class?: string;
  headClass?: string;
}
