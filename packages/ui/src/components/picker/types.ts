import type { PhosphorIcon } from "#src/lib/icon-types.js";

/** One row in a picker menu. */
export type PickerOption<V extends string = string> = {
  /** The value written when the row is chosen. */
  value: V;
  label: string;
  /** Right-aligned muted text: a date, a count, a unit. Never a second label. */
  hint?: string;
  /** Phosphor component drawn at the head of the row. */
  icon?: PhosphorIcon;
  /** A mark drawn at the head of a row that has no icon: a logo, an avatar.
   *  Drawn by whatever fills `lead`, which is what `MarkPicker` is for. */
  image?: string;
  /** Tone for the icon and, when the row is the current value, for the label. */
  tone?: string;
  /** Extra words the search matches, so "team@" finds a person by email. */
  keywords?: string;
  disabled?: boolean;
};

/** A titled run of options. An untitled group is seamless; a titled one rules off. */
export type PickerGroup<V extends string = string> = {
  heading?: string;
  options: PickerOption<V>[];
};
