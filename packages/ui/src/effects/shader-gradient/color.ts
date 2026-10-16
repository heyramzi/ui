type Rgb = [number, number, number];

let probe: CanvasRenderingContext2D | null | undefined;

function getProbe() {
  if (probe !== undefined) return probe;
  probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  return probe;
}

/**
 * Any CSS color to a 0..1 RGB triplet, `var(--token)` included.
 */

/*
 * The values go through a 1x1 canvas rather than a hand-written parser because the brand palette is authored in oklch, and the canvas gives the browser's own conversion for every
 */

/*
 * color space it supports instead of a second implementation that has to keep up.
 */
export function resolveColor(input: string, scope: Element | null): Rgb {
  const fallback: Rgb = [0, 0, 0];
  if (typeof document === "undefined") return fallback;

  let value = input.trim();
  const token = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/.exec(value);
  if (token) {
    const resolved = getComputedStyle(scope ?? document.documentElement)
      .getPropertyValue(token[1])
      .trim();
    value = resolved || token[2]?.trim() || "";
  }
  if (!value) return fallback;

  const context = getProbe();
  if (!context) return fallback;

  context.fillStyle = value;
  context.clearRect(0, 0, 1, 1);
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}
