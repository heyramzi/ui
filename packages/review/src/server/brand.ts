/**
 * A person's brand as review tokens, served as /brand.css with its fonts, so Editor OS and
 * Shorts OS draw the same page in the same brand.
 */
import { existsSync, readFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { basename, join } from "node:path";

export type FontFile = { weight: number; file: string };

/** The part of a brand the theme reads. */
export type BrandTheme = {
  roles: { dark: string; gray: string; light: string; primary: string };
  radius: number;
  files: { text: FontFile[]; title: FontFile[] };
};

const rgb = (hex: string): [number, number, number] =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (c: number[]): string =>
  `#${c
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** WCAG relative luminance. */
const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].toSorted((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** `t` is how much of `to` goes into `from`. */
const mix = (from: string, to: string, t: number): string => {
  const [r1, g1, b1] = rgb(from);
  const [r2, g2, b2] = rgb(to);
  return toHex([r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]);
};

/** Walks `color` toward `to` until it reads at `min` against `against`: a brand colour is kept as long as it can be read. */
const reach = (
  color: string,
  to: string,
  against: string,
  min: number,
  from: string = color,
): string => {
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const c = mix(from, to, t);
    if (contrast(c, against) >= min) return c;
  }
  return to;
};

/** The text colour for a button filled with `fill`: the brand's own ink or ground when one reads at 4.5, else white or black, whichever reads better. */
const onFill = (fill: string, candidates: string[]): string => {
  const ok = candidates.find((c) => contrast(c, fill) >= 4.5);
  if (ok) return ok;
  return contrast("#ffffff", fill) >= contrast("#000000", fill) ? "#ffffff" : "#000000";
};

/**
 * The studio's chrome in their brand: dark ground, light text, primary accent, their corner and
 * two faces. Every value is held to a reading contrast; status colours stay fixed.
 */
export function brandTheme(brand: BrandTheme): string {
  const { dark, gray, light, primary } = brand.roles;
  const [darker, lighter] = luminance(dark) <= luminance(light) ? [dark, light] : [light, dark];
  // One scheme per side of the theme switch: the darker role is the dark ground, the lighter one the light.
  const scheme = (base: string, ink0: string): string[] => {
    const ground = luminance(base) < 0.5;
    const ink =
      contrast(ink0, base) >= 7 ? ink0 : reach(ink0, ground ? "#ffffff" : "#000000", base, 7);
    const dim = contrast(gray, base) >= 4.5 ? gray : reach(mix(base, ink, 0.7), ink, base, 4.5);
    const faint = reach(mix(base, ink, 0.5), ink, base, 3);
    const accent = reach(primary, ink, base, 3);
    return [
      `color-scheme:${ground ? "dark" : "light"}`,
      `--ground:${base}`,
      `--surface:${mix(base, ink, 0.05)}`,
      `--raised:${mix(base, ink, 0.1)}`,
      `--line-soft:${mix(base, ink, 0.12)}`,
      `--line:${mix(base, ink, 0.18)}`,
      `--text:${ink}`,
      `--dim:${dim}`,
      `--faint:${faint}`,
      `--accent:${accent}`,
      `--on-accent:${onFill(accent, [base, ink])}`,
      `--accent-deep:${reach(primary, base, ink, 4.5)}`,
    ];
  };
  const radius = Math.min(20, Math.max(0, Math.round(brand.radius)));

  const face = (family: string, files: FontFile[]) =>
    files
      .map(
        (f) =>
          `@font-face{font-family:"${family}";font-weight:${f.weight};font-display:swap;src:url(/brand/fonts/${encodeURIComponent(f.file)})}`,
      )
      .join("\n");
  const text = brand.files.text;
  const title = brand.files.title.length ? brand.files.title : text;
  const fonts = [face("brand-chrome-text", text), face("brand-chrome-title", title)]
    .filter(Boolean)
    .join("\n");

  const shared = [
    `--radius:${radius}px`,
    `--radius-sm:${Math.min(6, radius)}px`,
    ...(text.length ? [`--sans:"brand-chrome-text","Satoshi",system-ui,sans-serif`] : []),
    ...(title.length ? [`--display:"brand-chrome-title","Manrope",system-ui,sans-serif`] : []),
  ];
  return `\n/* The person's brand, drawn over the defaults above. */\n${fonts}\n:root{${[...scheme(darker, lighter), ...shared].join(";")}}\n:root[data-theme="light"]{${scheme(lighter, darker).join(";")}}\n`;
}

type Harvested = {
  roles?: BrandTheme["roles"];
  radius?: number;
  type?: { files?: FontFile[]; title?: { files?: FontFile[] } };
};

/** The theme fields of `<brandDir>/brand.json`, or null when there's no brand yet. */
export function readBrandTheme(brandDir: string): BrandTheme | null {
  const path = join(brandDir, "brand.json");
  if (!existsSync(path)) return null;
  try {
    const h = JSON.parse(readFileSync(path, "utf8")) as Harvested;
    if (!h.roles || !h.type) return null;
    return {
      roles: h.roles,
      radius: h.radius ?? 10,
      files: { text: h.type.files ?? [], title: h.type.title?.files ?? [] },
    };
  } catch {
    return null;
  }
}

/** Answers `/brand.css` and `/brand/fonts/<file>`; false for any other path. Read per request, so a brand edit shows on reload. */
export function serveBrand(brandDir: string, pathname: string, response: ServerResponse): boolean {
  if (pathname === "/brand.css") {
    const brand = readBrandTheme(brandDir);
    response.writeHead(200, {
      "content-type": "text/css; charset=utf-8",
      "cache-control": "no-cache",
    });
    response.end(brand ? brandTheme(brand) : "");
    return true;
  }
  const font = pathname.match(/^\/brand\/fonts\/([^/]+)$/);
  if (!font) return false;
  let name: string;
  try {
    name = decodeURIComponent(font[1] ?? "");
  } catch {
    name = "";
  }
  const file = join(brandDir, "fonts", basename(name));
  if (!name || name !== basename(name) || !existsSync(file)) {
    response.writeHead(404).end("no such font");
    return true;
  }
  response.writeHead(200, {
    "content-type": `font/${file.split(".").pop()}`,
    "cache-control": "no-store",
  });
  response.end(readFileSync(file));
  return true;
}
