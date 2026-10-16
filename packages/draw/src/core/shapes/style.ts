// The clean palette lives here, apart from the rough module, so `ctx.style === "clean"`
// can render with no hand-drawn dependency at all. Same hues as the drawn layer.

export type ShapeColors = {
  /** The outline. */
  stroke: string;
  /** The wash behind a filled shape. */
  fill: string;
  /** Text and labels. */
  text: string;
};

const LIGHT: Record<string, ShapeColors> = {
  ink: { stroke: "#1e1e1e", fill: "#ffffff", text: "#1e1e1e" },
  red: { stroke: "#c92a2a", fill: "#fff5f5", text: "#a61e4d" },
  green: { stroke: "#2f9e44", fill: "#f4fce3", text: "#2b8a3e" },
  blue: { stroke: "#1971c2", fill: "#e7f5ff", text: "#1864ab" },
  violet: { stroke: "#6741d9", fill: "#f3f0ff", text: "#5f3dc4" },
  amber: { stroke: "#e8a33d", fill: "#fff9db", text: "#b8860b" },
  teal: { stroke: "#0c8599", fill: "#e3fafc", text: "#0b7285" },
};

const DARK: Record<string, ShapeColors> = {
  ink: { stroke: "#e9ecef", fill: "#151b30", text: "#f1f3f5" },
  red: { stroke: "#ff8787", fill: "#2a1822", text: "#ffa8c5" },
  green: { stroke: "#69db7c", fill: "#132a20", text: "#8ce99a" },
  blue: { stroke: "#74c0fc", fill: "#12253d", text: "#a5d8ff" },
  violet: { stroke: "#b197fc", fill: "#211c3d", text: "#d0bfff" },
  amber: { stroke: "#ffd43b", fill: "#2b2612", text: "#ffe066" },
  teal: { stroke: "#66d9e8", fill: "#112a30", text: "#99e9f2" },
};

export const DEFAULT_ACCENT = "ink";

/** The stroke, wash and text colour for an accent, lifted for a dark canvas. */
export function shapeColors(accent: string | undefined, dark: boolean): ShapeColors {
  const palette = dark ? DARK : LIGHT;
  return palette[accent ?? DEFAULT_ACCENT] ?? palette.ink;
}
