const FRAME_PAD = 24;

/**
 * Native drag shows a flat, faded snapshot. This hands the browser a lifted copy instead: the
 * raised elevation step and a 2% grow, so the held card reads as picked up. The browser moves the
 * image with the pointer itself, so there's no transition while it moves. Call it from
 * `ondragstart`. `tilt` rotates the copy in degrees, 0 by default.
 */
export function liftDragImage(e: DragEvent, tilt = 0): void {
  const source = e.currentTarget as HTMLElement | null;
  if (!source || !e.dataTransfer) return;
  const rect = source.getBoundingClientRect();

  // The padded frame leaves room for the shadow and the grow, or the snapshot crops them.
  const frame = document.createElement("div");
  Object.assign(frame.style, {
    position: "fixed",
    top: "-10000px",
    left: "-10000px",
    padding: `${FRAME_PAD}px`,
    pointerEvents: "none",
  });

  const ghost = source.cloneNode(true) as HTMLElement;
  // The copy's first child is the card the consumer drew, so the shadow sits on its corners.
  const card = (ghost.firstElementChild as HTMLElement | null) ?? ghost;
  Object.assign(ghost.style, {
    width: `${rect.width}px`,
    opacity: "1",
    rotate: tilt ? `${tilt}deg` : "",
    // 2 minus the tooltip's shrink step is a 1.02 grow, kept on the motion scale.
    scale: "calc(2 - var(--scale-small))",
  });
  card.style.boxShadow = "var(--elev-raised)";
  frame.appendChild(ghost);
  document.body.appendChild(frame);
  e.dataTransfer.setDragImage(
    frame,
    e.clientX - rect.left + FRAME_PAD,
    e.clientY - rect.top + FRAME_PAD,
  );
  setTimeout(() => frame.remove());
}
