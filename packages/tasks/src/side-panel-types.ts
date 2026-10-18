// In a .ts file, not the panel's module script, so a plain `tsc` consumer of the
// barrel can read them. tsc sees a .svelte file as a default export only.

/** How wide the panel opens from `sm` (a short form) to `2xl` (a reader). Under
    the `sm` breakpoint every panel is full width. */
export type SidePanelWidth = "sm" | "md" | "lg" | "xl" | "2xl";

/** One number the record is judged on. They sit in the header, in the order given. */
export type PanelStat = {
  label: string;
  value: string;
  /** A quiet note beside the value: the rate behind a count, or what the figure is. */
  sub?: string;
  /** One severity vocabulary: a count that should be zero is `bad`. */
  tone?: "default" | "muted" | "good" | "bad";
};
