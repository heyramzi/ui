/** Descript's empty picture box (fill #0b0b0b, ink #818181, icon 36px, label 23px on a 703px card), sized as fractions of FRAME width. No imports, so Node can load it. */

export const PLACEHOLDER = { fill: "#0b0b0b", ink: "#818181" } as const;

/** Descript's 703px card, measured: icon 36px, label 23px, stroke 2.5px, 32px between them. */
const ICON = 36 / 703;
const FONT = 23 / 703;
const STROKE = 2.5 / 703;
const GAP = 14 / 703;

type Placeholder = {
  /** Where the box sits when it is nested in a bigger SVG. Omit both for a standalone SVG. */
  x?: number;
  y?: number;
  w: number;
  h: number;
  /** The box's own corner radius, in the same units as w and h. */
  radius?: number;
  /** The card's picker name. Left off, only the icon draws. */
  label?: string;
  /** The frame's width in the same units, which everything scales from. */
  frameW: number;
};

const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = (n: number) => Math.round(n * 100) / 100;

/** The SVG markup for one placeholder box. */
export function placeholderSvg({ x, y, w, h, radius = 0, label, frameW }: Placeholder): string {
  // A small box (the bubble) shrinks the icon to fit; a big one keeps Descript's proportion.
  const fit = Math.min(1, (Math.min(w, h) * 0.42) / (ICON * frameW));
  const icon = ICON * frameW * fit;
  const font = FONT * frameW * fit;
  const gap = GAP * frameW * fit;
  const words = label?.trim() ?? "";
  const textW = words.length * font * 0.56;
  const showText = words !== "" && textW < w * 0.9 && icon + gap + font * 1.2 < h * 0.8;
  const showIcon = icon * 1.5 < Math.min(w, h);
  const rx = Math.min(radius, w / 2, h / 2);

  const total = showText ? icon + gap + font : icon;
  const top = (h - total) / 2;
  const stroke = Math.max(STROKE * frameW * fit, 0.5);
  // A 24-unit layout icon: a rounded square, a tall left pane, two stacked right panes.
  const k = icon / 24;
  const at = `translate(${num((w - icon) / 2)} ${num(top)}) scale(${k.toFixed(5)})`;
  const line = `fill="none" stroke="${PLACEHOLDER.ink}" stroke-width="${num(stroke / k)}" stroke-linecap="round" stroke-linejoin="round"`;
  const pos = x === undefined || y === undefined ? "" : ` x="${num(x)}" y="${num(y)}"`;
  const size =
    x === undefined
      ? ` width="100%" height="100%" preserveAspectRatio="none"`
      : ` width="${num(w)}" height="${num(h)}"`;

  return (
    `<svg class="ph"${pos}${size} viewBox="0 0 ${num(w)} ${num(h)}" overflow="hidden">` +
    `<rect width="${num(w)}" height="${num(h)}" rx="${num(rx)}" fill="${PLACEHOLDER.fill}"/>` +
    (showIcon
      ? `<g transform="${at}" ${line}><rect x="2" y="3" width="20" height="18" rx="3.5"/><path d="M10.5 3v18M10.5 12H22"/></g>`
      : "") +
    (showIcon && showText
      ? `<text x="${num(w / 2)}" y="${num(top + icon + gap + font * 0.78)}" text-anchor="middle" font-size="${num(font)}" font-weight="300" font-style="normal" font-family="'DM Sans','Inter',ui-sans-serif,system-ui,sans-serif" fill="${PLACEHOLDER.ink}">${esc(words)}</text>`
      : "") +
    `</svg>`
  );
}
