export type AnchorPosition = "center" | "left" | "right";

export interface AnimatedBeamProps {
  class?: string;
  containerRef: HTMLElement | null;
  fromRef: HTMLElement | null;
  toRef: HTMLElement | null;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
  fromAnchor?: AnchorPosition;
  toAnchor?: AnchorPosition;
}
