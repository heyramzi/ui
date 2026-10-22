// Print a URL or HTML to PDF at a page size, and assemble captured PNGs into one.

import { readFile } from "node:fs/promises";
import type { PageLike, ResponseLike, Size, WaitUntil } from "#src/slides/export/types.js";

/** Chromium drops backgrounds in its print pipeline without the color-adjust line. */
export const RESET_CSS = `*{margin:0;padding:0;box-sizing:border-box;}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;}`;

/** The `@page` rule for a page of this size in CSS pixels, with no margin. */
export function pageRule(size: Size): string {
  return `@page{size:${size.width}px ${size.height}px;margin:0;}`;
}

/** The reset, the page size and one full-bleed `.page` box per image. */
export function imagePagesCss(size: Size, background?: string): string {
  return `${RESET_CSS}
${background ? `body{background:${background};}\n` : ""}${pageRule(size)}
.page{display:block;width:${size.width}px;height:${size.height}px;break-after:page;}
.page:last-child{break-after:auto;}`;
}

/** One `<img class="page">` per data URL, laid out so each prints on its own page. */
export function imagePagesHtml(dataUrls: string[], size: Size, background?: string): string {
  const pages = dataUrls.map((dataUrl) => `<img class="page" src="${dataUrl}" alt="">`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${imagePagesCss(size, background)}
</style></head><body>${pages}</body></html>`;
}

/** The page count of a PDF, read off its page objects. */
export function countPdfPages(pdf: Uint8Array): number {
  return (
    Buffer.from(pdf)
      .toString("latin1")
      .match(/\/Type\s*\/Page[^s]/g) ?? []
  ).length;
}

export interface PrintOptions {
  /**
   * The page size in CSS pixels. Leave it out to print at the size the
   * document's own `@page` declares, which a fixed-size deck writes.
   */
  size?: Size;
  /** A selector to wait for, or a function that resolves when the page is ready to print. */
  ready?: string | ((page: PageLike) => Promise<void>);
  /** How long `ready` may take, in ms. Default 60000. */
  readyTimeout?: number;
  /** A final pause in ms once ready, for paint that has no signal. */
  settle?: number;
  /** For example `1-12`. */
  pageRanges?: string;
  /** Write the PDF here as well as returning it. */
  path?: string;
}

export interface PrintResult {
  pdf: Uint8Array;
  pages: number;
  /** The `src` of every image that had not loaded when the page was printed. */
  brokenImages: string[];
}

/**
 * Prints the page once fonts, images and the caller's signal settle, returning the images
 * that never loaded so a caller can refuse a half-painted sheet.
 */
export async function printPage(page: PageLike, options: PrintOptions = {}): Promise<PrintResult> {
  const { ready } = options;
  if (typeof ready === "string") {
    await page.waitForSelector(ready, { timeout: options.readyTimeout ?? 60_000 });
  } else if (ready) {
    await ready(page);
  }
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  if (options.settle) await page.waitForTimeout(options.settle);
  const brokenImages = await page.evaluate(() =>
    [...document.images]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src),
  );
  const { size } = options;
  const pdf = await page.pdf({
    path: options.path,
    printBackground: true,
    ...(size
      ? { width: `${size.width}px`, height: `${size.height}px` }
      : { preferCSSPageSize: true }),
    pageRanges: options.pageRanges,
  });
  return { pdf, pages: countPdfPages(pdf), brokenImages };
}

export interface PrintNavigation extends PrintOptions {
  /** The load condition for the navigation. Default `load`. */
  waitUntil?: WaitUntil;
  /** Called with the navigation response; throw to refuse to print an error page. */
  check?: (response: ResponseLike | null, page: PageLike) => void;
}

/** Opens a URL in the page and prints it. The caller owns the page and any routing on it. */
export async function printUrl(
  page: PageLike,
  url: string,
  options: PrintNavigation = {},
): Promise<PrintResult> {
  const response = await page.goto(url, { waitUntil: options.waitUntil ?? "load" });
  options.check?.(response, page);
  return printPage(page, options);
}

/** Loads HTML into the page and prints it. */
export async function printHtml(
  page: PageLike,
  html: string,
  options: PrintNavigation = {},
): Promise<PrintResult> {
  await page.setContent(html, { waitUntil: options.waitUntil ?? "load" });
  return printPage(page, options);
}

export interface ImagesToPdfOptions {
  /** The size of every page, in CSS pixels. Each image is drawn at exactly this size. */
  size: Size;
  /** The ground behind the images. */
  background?: string;
}

/**
 * Prints PNGs one per page, never the original document, because Chromium's print pipeline
 * re-rasterises effects: a blurred backdrop lost 47% of its chroma.
 */
export async function imagesToPdf(
  page: PageLike,
  images: Array<string | Uint8Array>,
  options: ImagesToPdfOptions,
): Promise<Uint8Array> {
  if (images.length === 0) throw new Error("imagesToPdf needs at least one image.");
  const dataUrls = await Promise.all(
    images.map(async (image) => {
      const bytes = typeof image === "string" ? await readFile(image) : image;
      return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
    }),
  );
  const { pdf } = await printHtml(
    page,
    imagePagesHtml(dataUrls, options.size, options.background),
    {
      size: options.size,
      pageRanges: `1-${images.length}`,
    },
  );
  return pdf;
}
