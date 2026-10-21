// Where a contextual panel sits so it never covers the selection's grips: beside the selection, on the side with room.

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Side = "right" | "left" | "below" | "above";

/** The panel's gap from the selection: past the grips, which stick out half their size and have a hit area around them. */
export const CLEARANCE = 20;
/** The size chip hangs under a selected card, so a panel below leaves room for it. */
const CHIP_ROOM = 40;
/** The canvas's own docks: the rail on the left, the pill along the bottom, a small margin elsewhere. */
const INSET = { left: 72, top: 12, right: 12, bottom: 76 };
/** The minimap fills the bottom-right corner, so a panel that reaches it stops above it. */
const MINIMAP = { width: 232, height: 172 };

/**
 * The first side with room for the panel (right, left, below, above), centred on the
 * selection. Null when none fits, and the caller docks it at the edge.
 */
export function placeBeside(
  selection: Box,
  panel: Size,
  canvas: Size,
): { x: number; y: number; side: Side } | null {
  const free = {
    left: INSET.left,
    top: INSET.top,
    right: canvas.width - INSET.right,
    bottom: canvas.height - INSET.bottom,
  };
  const centreX = (selection.left + selection.right) / 2 - panel.width / 2;
  const centreY = (selection.top + selection.bottom) / 2 - panel.height / 2;
  // The lowest a panel may reach where it stands: above the minimap when it reaches that corner.
  const floor = (x: number, width: number) =>
    x + width > canvas.width - MINIMAP.width ? canvas.height - MINIMAP.height : free.bottom;
  const clampX = (x: number) => Math.min(Math.max(x, free.left), free.right - panel.width);
  const clampY = (y: number, x: number) =>
    Math.min(Math.max(y, free.top), floor(x, panel.width) - panel.height);

  const tries: Array<{ side: Side; x: number; y: number; fits: boolean }> = [
    {
      side: "right",
      x: selection.right + CLEARANCE,
      y: clampY(centreY, selection.right + CLEARANCE),
      fits: selection.right + CLEARANCE + panel.width <= free.right,
    },
    {
      side: "left",
      x: selection.left - CLEARANCE - panel.width,
      y: clampY(centreY, selection.left - CLEARANCE - panel.width),
      fits: selection.left - CLEARANCE - panel.width >= free.left,
    },
    {
      side: "below",
      x: clampX(centreX),
      y: selection.bottom + CLEARANCE + CHIP_ROOM,
      fits:
        selection.bottom + CLEARANCE + CHIP_ROOM + panel.height <=
        floor(clampX(centreX), panel.width),
    },
    {
      side: "above",
      x: clampX(centreX),
      y: selection.top - CLEARANCE - panel.height,
      fits: selection.top - CLEARANCE - panel.height >= free.top,
    },
  ];
  const found = tries.find((attempt) => attempt.fits);
  return found ? { x: found.x, y: found.y, side: found.side } : null;
}
