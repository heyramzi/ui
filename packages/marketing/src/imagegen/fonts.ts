// Apps compile this source, and only a reference carries the wawoff2 types to them.
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="./wawoff2.d.ts" />
import { readFileSync } from "node:fs";
import { tryCatch, tryCatchAsync } from "@heyramzi/utils";
import type { Font } from "satori";
import type { FontConfig } from "#src/imagegen/types.js";

const cache = new Map<string, ArrayBuffer>();

function readRaw(path: string): Uint8Array | null {
  const result = tryCatch(() => readFileSync(path));
  return result.ok ? result.value : null;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

async function decodeFont(path: string): Promise<ArrayBuffer | null> {
  const cached = cache.get(path);
  if (cached) return cached;

  const raw = readRaw(path);
  if (!raw) return null;

  const isWoff2 = path.toLowerCase().endsWith(".woff2");
  if (!isWoff2) {
    const buf = toArrayBuffer(raw);
    cache.set(path, buf);
    return buf;
  }

  const decoded = await tryCatchAsync(async () => {
    const { decompress } = await import("wawoff2");
    return decompress(raw);
  });
  if (!decoded.ok) return null;
  const buf = toArrayBuffer(decoded.value);
  cache.set(path, buf);
  return buf;
}

/**
 * Load fonts from disk for satori. Supports .ttf, .otf, and .woff2. woff2 files are decoded to TTF in memory on first load.
 */

/*
 * Results are cached per path for the lifetime of the process. Fonts that fail to load or decode are skipped silently.
 */
export async function loadFonts(configs: FontConfig[]): Promise<Font[]> {
  // Decode serially: wawoff2.decompress returns a Uint8Array view into a
  // shared WASM heap, so concurrent calls overwrite each other's output
  // before toArrayBuffer can copy the bytes out.
  const decoded: Font[] = [];
  for (const config of configs) {
    const data = await decodeFont(config.path);
    if (!data) continue;
    decoded.push({
      name: config.name,
      data,
      weight: config.weight,
      style: config.style ?? "normal",
    });
  }
  return decoded;
}

/** Clear the font cache. Useful for tests. */
export function clearFontCache(): void {
  cache.clear();
}
