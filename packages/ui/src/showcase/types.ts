/**
 * A section of a component showcase, as the nav rail needs to know it.
 */

/*
 * `demos` and `listed` are counted by the page, not derived here: only the page knows which of its components it has written a demo for.
 */
export interface ShowcaseSectionMeta {
  /** Anchor id. Must match the `id` given to the matching ShowcaseSection. */
  id: string;
  /** Rail label, e.g. "Overlays". */
  label: string;
  /** How many components in the section render live. */
  demos: number;
  /** How many are listed by name only. */
  listed: number;
  /**
   * The rail heading this section files under, e.g. "Kit" or "Primitives".
   */

  /*
   * Consecutive sections sharing a group are drawn under one heading; a section with no group sits above the first heading.
   */

  /*
   * Order comes from the array, so a group is a run rather than a key to sort by.
   */
  group?: string;
}
