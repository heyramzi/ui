/** How a segmented strip that outgrew its row decides what to keep. */

// WHY not a scrollbar: a sideways scroll hid four of five tabs
// behind a gesture nobody makes with a mouse. The tail becomes a menu instead.

// WHY a count, not a measurement: the strip sits in a toolbar sized by its own
// content, so measuring reads its own width back and never collapses.

/**
 * The most objects a strip draws before its tail becomes a menu, the menu
 * counted as one of them. Two to six values is where a segmented control reads best.
 */
export const SEGMENT_MAX = 6;

/**
 * Split items into the drawn ones and the menu's. The current item always stays visible.
 * @param max objects the row may draw, the menu counted as one
 */
export function splitSegments<S>(
  items: readonly S[],
  max: number,
  activeIndex: number,
): { visible: S[]; hidden: S[] } {
  // Under three the row is the menu and a single segment beside it, which says
  // less than the menu alone. Below that, and whenever everything fits, no split.
  if (max < 3 || items.length <= max) return { visible: [...items], hidden: [] };

  const slots = max - 1;
  if (activeIndex < slots && activeIndex >= 0) {
    return { visible: items.slice(0, slots), hidden: items.slice(slots) };
  }
  if (activeIndex < 0 || activeIndex >= items.length) {
    return { visible: items.slice(0, slots), hidden: items.slice(slots) };
  }
  return {
    visible: [...items.slice(0, slots - 1), ...items.slice(activeIndex, activeIndex + 1)],
    hidden: items.filter((_, i) => i >= slots - 1 && i !== activeIndex),
  };
}
