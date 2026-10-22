// Capture a page, or one element of it, to PNG at a canvas size and device scale.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  BrowserLike,
  LocatorLike,
  PageLike,
  Size,
  WaitUntil,
} from "#src/slides/export/types.js";

/**
 * `networkidle` never fires on a page that keeps polling, like a chat widget, so a retry
 * falls back to `load`, which always fires.
 */
export const DEFAULT_WAITS: readonly WaitUntil[] = ["networkidle", "load"];

export interface GotoOptions {
  /** Tried in order; the first that resolves wins and the last failure is thrown. */
  waits?: readonly WaitUntil[];
  timeout?: number;
}

/** Navigates, retrying with the next wait condition when one times out. */
export async function gotoSettled(page: PageLike, url: string, options: GotoOptions = {}) {
  const waits = options.waits ?? DEFAULT_WAITS;
  const timeout = options.timeout ?? 45_000;
  let failure: unknown;
  for (const waitUntil of waits) {
    try {
      return await page.goto(url, { waitUntil, timeout });
    } catch (error) {
      failure = error;
    }
  }
  throw failure ?? new Error("gotoSettled needs at least one wait condition.");
}

export type CaptureSource = { url: string } | { html: string };

export interface CaptureOptions {
  /** The viewport the page lays out in. */
  size: Size;
  /** Device scale factor; 2 doubles the pixels. Default 1. */
  scale?: number;
  /** Capture just the first element matching this selector, once it is visible. */
  selector?: string;
  /** Capture the whole scrollable page. Ignored when a selector is given. */
  fullPage?: boolean;
  /** CSS added after load, for hiding overlays. */
  style?: string;
  /** Settle time in ms after load, for animations and virtualised lists. */
  wait?: number;
  goto?: GotoOptions;
  /** Also write the PNG here. */
  path?: string;
}

/** Opens a page at the canvas size, captures it to PNG and closes the page. */
export async function capturePage(
  browser: BrowserLike,
  source: CaptureSource,
  options: CaptureOptions,
): Promise<Uint8Array> {
  const page = await browser.newPage({
    viewport: options.size,
    deviceScaleFactor: options.scale ?? 1,
  });
  try {
    if ("url" in source) await gotoSettled(page, source.url, options.goto);
    else await page.setContent(source.html, { waitUntil: "load" });
    if (options.style) await page.addStyleTag({ content: options.style });
    if (options.wait) await page.waitForTimeout(options.wait);
    const { selector } = options;
    let bytes: Uint8Array;
    if (selector) {
      const target = page.locator(selector).first();
      await target.waitFor({ state: "visible" });
      bytes = await target.screenshot({ type: "png" });
    } else {
      bytes = await page.screenshot({ type: "png", fullPage: options.fullPage });
    }
    if (options.path) {
      await mkdir(path.dirname(options.path), { recursive: true });
      await writeFile(options.path, bytes);
    }
    return bytes;
  } finally {
    await page.close();
  }
}

/** `01.png`, `02.png` ...: the file name for the nth capture, one-based, zero-padded. */
export function frameName(index: number, digits = 2, extension = "png"): string {
  return `${String(index + 1).padStart(digits, "0")}.${extension}`;
}

/**
 * Screenshots every element a locator matches into `dir`, one PNG each, and
 * returns the paths in order. The elements are the pages of a deck.
 */
export async function captureEach(
  elements: LocatorLike,
  dir: string,
  options: { digits?: number } = {},
): Promise<string[]> {
  await mkdir(dir, { recursive: true });
  const count = await elements.count();
  const files: string[] = [];
  for (let index = 0; index < count; index++) {
    const file = path.join(dir, frameName(index, options.digits));
    await elements.nth(index).screenshot({ path: file });
    files.push(file);
  }
  return files;
}
