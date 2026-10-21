/**
 * The one skin for a dashboard data table. Classes, not a component: two
 * dashboards share nothing but the look, and each drew its own slightly different one.
 */

// Heads aren't uppercase. `SectionLabel` already is, and a nine-column head in
// the same style fights the panel title and reads worse where density matters.
export const dataTableClass = "w-full text-sm";

export const dataTheadClass = "bg-muted/40 text-xs text-muted-foreground";

export const dataThClass = "px-4 py-2.5 text-left font-medium";

/** A head over numbers. Right-aligned to the digits under it. */
export const dataThNumClass = "px-4 py-2.5 text-right font-medium";

export const dataTrClass =
  "border-b border-border transition-colors last:border-0 hover:bg-muted/40";

export const dataTdClass = "px-4 py-2.5 align-top";

/**
 * A cell holding a number. `tabular-nums` is required: proportional digits make
 * a spend column ragged, and then nobody can scan it.
 */
export const dataTdNumClass = "px-4 py-2.5 text-right align-top tabular-nums";
