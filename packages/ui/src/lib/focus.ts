import { tick } from "svelte";

/**
 * Focuses the first target that takes focus, a selector under root or an element, once Svelte
 * has rendered. A moved keyed item or opened pane is a new node.
 */
export async function focusAfterRender(
  root: ParentNode | null | undefined,
  ...targets: (string | HTMLElement | null | undefined)[]
): Promise<HTMLElement | undefined> {
  await tick();
  for (const target of targets) {
    const el = typeof target === "string" ? root?.querySelector<HTMLElement>(target) : target;
    if (!el?.isConnected) continue;
    el.focus();
    if (document.activeElement === el) return el;
  }
  return undefined;
}
