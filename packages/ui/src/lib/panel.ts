/** The one panel shell: a titled box holding a table, a chart or a stack. */

// WHY tokens, not markup: `DetailPanel` and `DataPanel` draw the same box with
// different props, and their edges drifted because the classes were typed twice.

// Dashboards used `Card`, so /ads had a ring and a shadow where /social had a
// hairline. Flat, one hairline, `rounded-xl`.
export const panelShellClass = "overflow-hidden rounded-xl border border-border bg-card";

/**
 * The panel's header bar: label left, count or controls right. `min-h-11` so a
 * label-only header matches one with a button.
 */
export const panelHeaderClass =
  "flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border px-4 py-2";

/**
 * The inset well for a control block inside a panel. A visible step at the
 * same depth, for filter rows and grouped controls.
 */
export const insetWellClass = "rounded-lg border border-border bg-muted/40 p-2";
