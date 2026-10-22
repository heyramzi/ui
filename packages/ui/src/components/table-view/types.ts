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
}
