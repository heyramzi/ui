import { getContext, setContext } from "svelte";

/**
 * Whether the list-page toolbar has run out of room. `ListPageShell` measures
 * its row and sets this; a control inside it reads it and draws a smaller self.
 */
export interface ToolbarDensity {
  /** The tabs fold into one dropdown. */
  readonly compact: boolean;
  /** Folded and still short: a filter or display trigger drops its label and
   *  keeps the icon, so the row never wraps (TSK-2121, 420px). Implies compact. */
  readonly tight: boolean;
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
// WHY `flex: none` too: a row that is itself a flex item takes its width from
// flex-basis, so `max-content` alone read back the container (10 Nov 2026).
export function naturalRowWidth(row: HTMLElement): number {
  const { width, flexWrap, flex } = row.style;
  row.style.width = "max-content";
  row.style.flexWrap = "nowrap";
  row.style.flex = "none";
  const needed = row.getBoundingClientRect().width;
  row.style.width = width;
  row.style.flexWrap = flexWrap;
  row.style.flex = flex;
  return needed;
}
