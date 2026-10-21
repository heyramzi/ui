// A small drawing on a board. Markup arrives over the API, so it's rebuilt tag by
// tag from an allowlist. Authoring: see the package README.

/** Shapes, text and the local defs they reference. No `a`, `use` or `image`:
 *  each one can point somewhere off the page. */
const ALLOWED_TAGS = new Set([
  "svg",
  "g",
  "defs",
  "title",
  "desc",
  "linearGradient",
  "radialGradient",
  "stop",
  "marker",
  "clipPath",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "text",
  "tspan",
]);

/** Geometry and paint only. An allowlist and not a denylist, so `onload` and
 *  `href` are out by being absent rather than by being remembered. */
const ALLOWED_ATTRS = new Set([
  "viewBox",
  "width",
  "height",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "dx",
  "dy",
  "transform",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-opacity",
  "opacity",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "offset",
  "stop-color",
  "stop-opacity",
  "gradientUnits",
  "gradientTransform",
  "clip-path",
  "clipPathUnits",
  "marker-end",
  "marker-start",
  "markerWidth",
  "markerHeight",
  "refX",
  "refY",
  "orient",
  "id",
  "class",
  "preserveAspectRatio",
]);

/** A figure is a diagram, not a pasted illustration: past this it is an asset
 *  with a URL, and the board holds an image node instead. */
export const MAX_FIGURE_CHARS = 16000;

const TAG = /<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*?)\/?>/g;
const ATTR = /([a-zA-Z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
/** A reference out of the document. `url(#local)` stays; everything else goes. */
const FOREIGN_URL = /url\(\s*['"]?(?!#)/i;

function cleanAttrs(raw: string): string {
  const kept: string[] = [];
  for (const match of raw.matchAll(ATTR)) {
    const name = match[1];
    const value = match[3] ?? match[4] ?? "";
    if (!ALLOWED_ATTRS.has(name)) continue;
    if (FOREIGN_URL.test(value)) continue;
    kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }
  return kept.length > 0 ? ` ${kept.join(" ")}` : "";
}

/** The figure as it's safe to draw, or null without an `<svg>`. Script, style and foreignObject go with contents; unknown tags drop, keeping text. */
export function sanitizeFigureSvg(raw: string): string | null {
  if (typeof raw !== "string" || raw.length > MAX_FIGURE_CHARS) return null;
  const stripped = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
    .replace(/<\?[\s\S]*?\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<(script|style|foreignObject|iframe)\b[\s\S]*?<\/\1\s*>/gi, "");
  if (!/<svg\b/i.test(stripped)) return null;

  let out = "";
  let cursor = 0;
  for (const match of stripped.matchAll(TAG)) {
    const [tag, name, attrs] = match;
    const start = match.index ?? 0;
    out += stripped.slice(cursor, start);
    cursor = start + tag.length;
    if (!ALLOWED_TAGS.has(name)) continue;
    if (tag.startsWith("</")) {
      out += `</${name}>`;
      continue;
    }
    out += `<${name}${cleanAttrs(attrs)}${tag.endsWith("/>") ? " />" : ">"}`;
  }
  out += stripped.slice(cursor);
  return out.trim();
}

function rootAttr(svg: string, name: string): string | undefined {
  const root = svg.match(/<svg\b([^>]*)>/i);
  if (!root) return undefined;
  const found = root[1].match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"));
  return found?.[1];
}

/** Height over width, from the viewBox the author drew in. */
export function figureRatio(svg: string): number | null {
  const box = rootAttr(svg, "viewBox");
  if (box) {
    const [, , w, h] = box
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (w > 0 && h > 0) return h / w;
  }
  const w = Number.parseFloat(rootAttr(svg, "width") ?? "");
  const h = Number.parseFloat(rootAttr(svg, "height") ?? "");
  return w > 0 && h > 0 ? h / w : null;
}

/** The box the drawing needs. The fallback is a wide banner, the shape a
 *  board figure takes when the author gave no viewBox. */
export function figureBoxHeight(svg: string, width: number, fallback = 0.4): number {
  return Math.round(width * (figureRatio(svg) ?? fallback));
}

/** The heading over a figure and the line under it, with their margins. These
 *  mirror sketch-figure.svelte and move when its type sizes do. */
const LABEL_H = 27;
const CAPTION_H = 24;

/** The whole node: the drawing, plus whatever text sits around it. */
export function figureNodeHeight(
  figure: { svg?: string; label?: string; caption?: string; height?: number },
  width: number,
): number {
  const art = figure.height ?? figureBoxHeight(figure.svg ?? "", width);
  return art + (figure.label ? LABEL_H : 0) + (figure.caption ? CAPTION_H : 0);
}
