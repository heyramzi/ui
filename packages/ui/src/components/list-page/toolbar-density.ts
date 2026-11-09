import { getContext, setContext } from "svelte";

/**
 * Whether the list-page toolbar has run out of room. `ListPageShell` measures
 * its row and sets this; a control inside it reads it and draws a smaller self.
 */
export interface ToolbarDensity {
  readonly compact: boolean;
}

// WHY context: the shell owns the measurement and 26 pages render their tabs
// through a snippet, so a prop would be an edit on every page.
const KEY = Symbol("list-page.toolbar-density");

export function setToolbarDensity(density: ToolbarDensity): void {
  setContext(KEY, density);
}

/** Undefined outside a list-page toolbar, where nothing ever folds. */
export function getToolbarDensity(): ToolbarDensity | undefined {
  return getContext<ToolbarDensity | undefined>(KEY);
}

/**
 * The width a row needs to sit on one line with every child at its natural
 * size. Read in one synchronous pass, so the browser never paints the probe.
 */
// WHY `max-content` on a probe, not the row's own width: the row is sized by
// its container, so reading it back always says "it fits" (see collapse.ts).
export function naturalRowWidth(row: HTMLElement): number {
  const { width, flexWrap } = row.style;
  row.style.width = "max-content";
  row.style.flexWrap = "nowrap";
  const needed = row.getBoundingClientRect().width;
  row.style.width = width;
  row.style.flexWrap = flexWrap;
  return needed;
}
