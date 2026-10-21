import { tick } from "svelte";

// An export reads the page's markup, so it holds this open: every card is drawn in full until it lets go.

const hold = $state({ count: 0 });

/** True while something needs every card drawn in full. */
export const renderAll = {
  get on(): boolean {
    return hold.count > 0;
  },
};

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
// Arrows draw a beat after their cards, once the cards are measured, so they are counted too.
const DRAWN = ".svelte-flow__node, .svelte-flow__edge";
const SETTLE_FRAMES = 8;
const GIVE_UP_MS = 4000;
/** The page's card fade-in is switched off under this attribute, so a card that remounts is captured solid. */
export const EVERY_CARD_ATTR = "data-cv-every-card";

/** Runs `use` with every card drawn in full. Waits until the number of cards and arrows on the page holds still. */
export async function withEveryCard<T>(root: ParentNode, use: () => Promise<T>): Promise<T> {
  hold.count += 1;
  const marked = root instanceof Element ? root : null;
  marked?.setAttribute(EVERY_CARD_ATTR, "");
  try {
    await tick();
    const start = performance.now();
    let last = -1;
    let still = 0;
    while (still < SETTLE_FRAMES && performance.now() - start < GIVE_UP_MS) {
      await frame();
      const now = root.querySelectorAll(DRAWN).length;
      still = now === last ? still + 1 : 0;
      last = now;
    }
    // A fade that began before the switch-off still has to land.
    if ("getAnimations" in root) {
      const running = (root as Element).getAnimations({ subtree: true });
      await Promise.race([
        Promise.allSettled(running.map((animation) => animation.finished)),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    }
    await frame();
    return await use();
  } finally {
    hold.count -= 1;
    if (hold.count === 0) marked?.removeAttribute(EVERY_CARD_ATTR);
  }
}
