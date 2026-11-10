import { tick } from "svelte";

/**
 * Focuses the first match of the selectors under root, tried in order, once Svelte has rendered.
 * A moved keyed item or a newly opened pane is a new node.
 */
export async function focusAfterRender(
  root: ParentNode | null | undefined,
  ...selectors: string[]
): Promise<HTMLElement | undefined> {
  await tick();
  for (const selector of selectors) {
    const el = root?.querySelector<HTMLElement>(selector);
    if (!el) continue;
    el.focus();
    if (document.activeElement === el) return el;
  }
  return undefined;
}
