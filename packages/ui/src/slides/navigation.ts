/* Paging rules as pure functions, so the controller stays a thin reactive shell. */

export type Position = { index: number; step: number };

/** What paging needs to know about a slide. `steps` is its highest fragment step. */
export type SlideState = { steps: number; hidden: boolean };

export type KeyAction =
  | "next"
  | "prev"
  | "up"
  | "down"
  | "first"
  | "last"
  | "select"
  | "overview"
  | "close"
  | "fullscreen"
  | "presenter";

export const visibleIndexes = (slides: readonly SlideState[]): number[] =>
  slides.flatMap((slide, index) => (slide.hidden ? [] : [index]));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Snaps a position onto a visible slide and a real step. Empty decks stay at 0, 0. */
export function settle(slides: readonly SlideState[], position: Position): Position {
  const visible = visibleIndexes(slides);
  if (visible.length === 0) return { index: 0, step: 0 };
  const index = visible.find((i) => i >= position.index) ?? visible[visible.length - 1];
  return { index, step: clamp(position.step, 0, slides[index].steps) };
}

/** The position after one forward press, or null at the end of a deck that doesn't loop. */
export function nextPosition(
  slides: readonly SlideState[],
  from: Position,
  loop = false,
): Position | null {
  const visible = visibleIndexes(slides);
  if (visible.length === 0) return null;
  if (from.step < slides[from.index].steps) return { index: from.index, step: from.step + 1 };
  const next = visible.find((i) => i > from.index);
  if (next !== undefined) return { index: next, step: 0 };
  return loop ? { index: visible[0], step: 0 } : null;
}

/** The position after one back press. Landing on an earlier slide shows it fully revealed. */
export function prevPosition(
  slides: readonly SlideState[],
  from: Position,
  loop = false,
): Position | null {
  const visible = visibleIndexes(slides);
  if (visible.length === 0) return null;
  if (from.step > 0) return { index: from.index, step: from.step - 1 };
  const before = visible.filter((i) => i < from.index);
  const index = before.length
    ? before[before.length - 1]
    : loop
      ? visible[visible.length - 1]
      : undefined;
  return index === undefined ? null : { index, step: slides[index].steps };
}

/** Where slide `index` sits among the visible ones, 1 based, for "3 of 12". */
export function ordinalOf(slides: readonly SlideState[], index: number): { n: number; of: number } {
  const visible = visibleIndexes(slides);
  return { n: Math.max(0, visible.indexOf(index)) + 1, of: visible.length };
}

/** How far through the deck a position is, 0 to 1. A slide's fragments split its own share. */
export function progressOf(slides: readonly SlideState[], position: Position): number {
  const visible = visibleIndexes(slides);
  if (visible.length === 0) return 0;
  const at = Math.max(0, visible.indexOf(position.index));
  const steps = slides[position.index]?.steps ?? 0;
  const share = steps > 0 ? (position.step + 1) / (steps + 1) : 1;
  return (at + share) / visible.length;
}

/** Reads `?s=` as a zero based index. Anything that isn't a whole number in range is null. */
export function parseSlideParam(raw: string | null | undefined, total: number): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const index = Number(raw) - 1;
  return index >= 0 && index < total ? index : null;
}

const KEYS: Record<string, KeyAction> = {
  ArrowRight: "next",
  PageDown: "next",
  ArrowLeft: "prev",
  PageUp: "prev",
  ArrowUp: "up",
  ArrowDown: "down",
  Home: "first",
  End: "last",
  Enter: "select",
  Escape: "close",
  o: "overview",
  O: "overview",
  f: "fullscreen",
  F: "fullscreen",
  p: "presenter",
  P: "presenter",
};

/** Maps a key to what the deck does with it. Space moves forward, Shift+Space back. */
export function keyAction(key: string, shift = false): KeyAction | null {
  if (key === " ") return shift ? "prev" : "next";
  return KEYS[key] ?? null;
}
