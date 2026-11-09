import type { AnchorPosition } from "#src/effects/animated-beam/types.js";

function anchorX(
  rect: DOMRect,
  containerLeft: number,
  anchor: AnchorPosition,
  offset: number,
): number {
  const left = rect.left - containerLeft;
  if (anchor === "left") return left + offset;
  if (anchor === "right") return left + rect.width + offset;
  return left + rect.width / 2 + offset;
}

export function usePathCalculator() {
  let pathD = $state("");
  let svgDimensions = $state({ width: 0, height: 0 });

  function calculatePath(
    containerRef: HTMLElement | null,
    fromRef: HTMLElement | null,
    toRef: HTMLElement | null,
    curvature: number,
    startXOffset: number,
    startYOffset: number,
    endXOffset: number,
    endYOffset: number,
    fromAnchor: AnchorPosition = "center",
    toAnchor: AnchorPosition = "center",
  ) {
    if (!containerRef || !fromRef || !toRef) return;

    const containerRect = containerRef.getBoundingClientRect();
    const rectA = fromRef.getBoundingClientRect();
    const rectB = toRef.getBoundingClientRect();

    // A scaled ancestor (a gallery tile shrinking the demo) shrinks every rect, but the SVG draws in
    // the container's own unscaled pixels. Divide by that scale, or the beams stop short of their
    // nodes.
    const scaleX = containerRef.offsetWidth ? containerRect.width / containerRef.offsetWidth : 1;
    const scaleY = containerRef.offsetHeight ? containerRect.height / containerRef.offsetHeight : 1;
    const local = (rect: DOMRect) =>
      new DOMRect(
        (rect.left - containerRect.left) / scaleX,
        (rect.top - containerRect.top) / scaleY,
        rect.width / scaleX,
        rect.height / scaleY,
      );
    const a = local(rectA);
    const b = local(rectB);

    svgDimensions = { width: containerRect.width / scaleX, height: containerRect.height / scaleY };

    const startX = anchorX(a, 0, fromAnchor, startXOffset);
    const startY = a.top + a.height / 2 + startYOffset;
    const endX = anchorX(b, 0, toAnchor, endXOffset);
    const endY = b.top + b.height / 2 + endYOffset;

    // A cubic with horizontal handles, not a quadratic through a raised midpoint.

    // The quadratic put its single control point at `midY` minus `curvature`, which for a fan into one node lands past the far end:

    // the top beam dove below the hub and crossed the middle beam before arriving, and three beams bundled into a lens for the last stretch.

    // Handles along the axis of travel make each beam leave and arrive perpendicular to its anchor, so a fan converges at the anchor and nowhere else.

    // `curvature` still bows the middle, and zero still draws a straight line between two anchors at the same height.
    const span = Math.abs(endX - startX);
    const handle = Math.max(span * 0.5, 24);
    const direction = endX >= startX ? 1 : -1;
    const c1x = startX + handle * direction;
    const c2x = endX - handle * direction;
    pathD = `M ${startX},${startY} C ${c1x},${startY - curvature} ${c2x},${endY - curvature} ${endX},${endY}`;
  }

  return {
    get pathD() {
      return pathD;
    },
    get svgDimensions() {
      return svgDimensions;
    },
    calculatePath,
  };
}
