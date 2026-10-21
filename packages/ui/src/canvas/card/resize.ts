// How a card resizes. The host names one policy per card type; the frame and the handles read it.

/** `both` saves `data.userHeight` as a floor. `width` is a text card. `ratio` keeps an image's shape. */
export type CardResizeAxes = "both" | "width" | "ratio";

/** Where the size lives. `content` cards size their own height; a `box` card has its size only on the node. */
export type CardResizeStore = "content" | "box";

export type CardResize = {
  axes: CardResizeAxes;
  /** Defaults to `content`. */
  store?: CardResizeStore;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  /** Extra data a finished resize writes with the size, in the same undo step. */
  extraData?: (size: { width: number; height: number }) => Record<string, unknown>;
};

export const DEFAULT_MIN_WIDTH = 120;
export const DEFAULT_MAX_WIDTH = 2400;
export const DEFAULT_MIN_HEIGHT = 40;

/** The saved floor height of a card, or 0 when its content sets the height. */
export function userHeightOf(data: unknown): number {
  const value = (data as { userHeight?: unknown } | null | undefined)?.userHeight;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

/** The height a finished drag keeps: the dragged one, never under what the content needs. */
export function keptHeight(dragged: number, content: number): number {
  return Math.max(Math.round(dragged), Math.ceil(content));
}
