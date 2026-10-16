const FRAME_PAD = 16;

/**
 * Native drag shows a flat, faded snapshot. This hands the browser a tilted
 * copy with a lifted shadow instead. Call it from `ondragstart`.
 */
export function liftDragImage(e: DragEvent, tilt = -3): void {
  const source = e.currentTarget as HTMLElement | null;
  if (!source || !e.dataTransfer) return;
  const rect = source.getBoundingClientRect();

  // The padded frame leaves room for the tilt and shadow, or the snapshot crops them.
  const frame = document.createElement("div");
  Object.assign(frame.style, {
    position: "fixed",
    top: "-10000px",
    left: "-10000px",
    padding: `${FRAME_PAD}px`,
    pointerEvents: "none",
  });

  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    width: `${rect.width}px`,
    opacity: "1",
    rotate: `${tilt}deg`,
    filter:
      "drop-shadow(0 2px 4px rgb(35 35 35 / 0.08)) drop-shadow(0 10px 18px rgb(35 35 35 / 0.14))",
  });
  frame.appendChild(ghost);
  document.body.appendChild(frame);
  e.dataTransfer.setDragImage(
    frame,
    e.clientX - rect.left + FRAME_PAD,
    e.clientY - rect.top + FRAME_PAD,
  );
  setTimeout(() => frame.remove());
}
