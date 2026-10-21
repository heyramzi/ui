// An icon node's geometry from its data alone. The node, the board compiler and the sizer
// all read it, so a curve lands on the mark, not a guess.

export type IconShape = "tile" | "ring";
export type IconLabelSide = "below" | "right";

export type IconGeometryInput = {
  size?: number;
  labelSide?: IconLabelSide;
  label?: string;
  lines?: string[];
};

export type IconGeometry = {
  size: number;
  /** Top-left of the mark inside the node box. */
  markX: number;
  markY: number;
  height: number;
  /** Where curves arrive (left) and leave (right), in node-local px. */
  left: { x: number; y: number };
  right: { x: number; y: number };
};

export const ICON_SIZE = 56;
export const ICON_W = 120;
/** Gap between the mark and its label, either side. */
export const ICON_LABEL_GAP = 12;
export const ICON_LABEL_H = 22;
export const ICON_LINE_H = 20;
/** A right-hand label is set larger: it names an area, not a tool. */
export const ICON_SIDE_LABEL_H = 28;
/** Space between the port line and the first line under it. */
export const ICON_PORT_GAP = 6;

/**
 * A label below centres the mark and hands off at its edges. A right label starts it
 * at x 0 and leaves from the box's right edge.
 */
export function iconGeometry(icon: IconGeometryInput, width: number = ICON_W): IconGeometry {
  const size = icon.size ?? ICON_SIZE;
  const lines = icon.lines?.length ?? 0;
  const mid = size / 2;
  if (icon.labelSide === "right") {
    // The label sits across the port line: name above it, lines below.
    const top = Math.max(0, (icon.label ? ICON_SIDE_LABEL_H : 0) - mid);
    return {
      size,
      markX: 0,
      markY: top,
      height: Math.max(top + size, top + mid + ICON_PORT_GAP + lines * ICON_LINE_H),
      left: { x: 0, y: top + mid },
      right: { x: Math.max(width, size), y: top + mid },
    };
  }
  const markX = (Math.max(width, size) - size) / 2;
  const text = (icon.label ? ICON_LABEL_H : 0) + lines * ICON_LINE_H;
  return {
    size,
    markX,
    markY: 0,
    height: size + (text ? ICON_LABEL_GAP + text : 0),
    left: { x: markX, y: mid },
    right: { x: markX + size, y: mid },
  };
}
