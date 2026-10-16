import type { Attachment } from "svelte/attachments";

/** The travelling highlight behind the active tab. Attach it to a span inside the list. */

// WHY attach to the pill, not the list: the pill finds its list via
// `parentElement`, so any strip that renders one span gets the motion.

// WHY measure: the active item's width is its label. The selector covers the
// three ways a strip marks it: a tab, a nav link, a toggle.

// Per transitions.dev `tabs-sliding`: first paint and resizes write the
// position with the transition off, so the pill snaps in instead of flying.
const ACTIVE = '[data-state="active"],[aria-current="page"],[aria-pressed="true"]';

export const slidingPill: Attachment<HTMLElement> = (pill) => {
  const list = pill.parentElement;
  if (!list) return;

  let settled = false;

  function move(animate: boolean) {
    const active = list!.querySelector<HTMLElement>(ACTIVE);
    if (!active) {
      pill.style.opacity = "0";
      return;
    }
    pill.style.opacity = "1";
    if (animate) {
      pill.style.transform = `translateX(${active.offsetLeft}px)`;
      pill.style.width = `${active.offsetWidth}px`;
      return;
    }
    // Suspend, write, reflow, restore. Without the reflow the browser
    // coalesces the two writes and the snap animates anyway.
    pill.style.transition = "none";
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
    pill.style.width = `${active.offsetWidth}px`;
    void pill.offsetWidth;
    pill.style.transition = "";
  }

  // Position first, THEN hand the highlight over. Swapped, one frame draws both
  // the trigger's own background and a zero-width pill: a flicker on hydration.
  move(false);
  list.dataset.pill = "on";
  settled = true;

  // The selection lives in an attribute bits-ui owns, and a badge arriving
  // changes a trigger's width without any attribute changing.
  const attributes = new MutationObserver(() => move(settled));
  attributes.observe(list, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-state", "aria-current", "aria-pressed"],
  });

  // A list that reflows (a rail collapsing, a font landing) re-measures
  // without motion: nothing was chosen, so nothing should travel.
  const resize = new ResizeObserver(() => move(false));
  resize.observe(list);

  return () => {
    attributes.disconnect();
    resize.disconnect();
    delete list.dataset.pill;
  };
};
