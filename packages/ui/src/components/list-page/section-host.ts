import { getContext, setContext } from "svelte";
import type { SectionStrip } from "#src/components/segmented/section-runs.svelte";

/**
 * What an app shell gives a list page so the page's toolbar can draw the
 * section strip. `strip` must be reactive (a `$state` field), and `claim` tells
 * the shell a toolbar is drawing it and returns the release.
 */
export interface SectionHost {
  readonly strip: SectionStrip | null;
  claim(): () => void;
}

// WHY context: the shell decides the strip once and ninety pages draw it, so a prop on every page would be ninety edits.
const KEY = Symbol("list-page.section-host");

/** Call once in the layout that owns the section strip. */
export function setSectionHost(host: SectionHost): void {
  setContext(KEY, host);
}

export function getSectionHost(): SectionHost | undefined {
  return getContext<SectionHost | undefined>(KEY);
}
