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
// WHY transitions are stopped: under reduced motion `tokens/base.css` gives every
// element an 80ms transition on `all`, so the probe's own width change started a
// transition and the read got the old width. The row never folded at 390px and
// axe flagged the squeezed search field (gallery, 10 Nov 2026). The last fold's
// gap and shrink changes are still running then too, so they're finished first.
export function naturalRowWidth(row: HTMLElement): number {
  for (const animation of row.getAnimations({ subtree: true })) {
    if (animation instanceof CSSTransition) animation.finish();
  }
  const { width, flexWrap, flex } = row.style;
  const transition = row.style.getPropertyValue("transition");
  const priority = row.style.getPropertyPriority("transition");
  row.style.setProperty("transition", "none", "important");
  row.style.width = "max-content";
  row.style.flexWrap = "nowrap";
  row.style.flex = "none";
  const needed = row.getBoundingClientRect().width;
  row.style.width = width;
  row.style.flexWrap = flexWrap;
  row.style.flex = flex;
  // The restored size has to settle before transitions come back, or the
  // row would animate back from its probe width.
  void row.offsetWidth;
  row.style.setProperty("transition", transition, priority);
  return needed;
}
