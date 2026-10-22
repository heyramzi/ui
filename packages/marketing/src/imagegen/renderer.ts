import satori from "satori";
import sharp from "sharp";
import type { SatoriNode } from "#src/imagegen/markup.js";
import type { ImageFormat, ImageSize, RenderOptions } from "#src/imagegen/types.js";

/**
 * Render satori-compatible markup to an image buffer.
 *
 * - `svg` returns the raw SVG bytes from satori.
 * - `png` / `avif` pipe the SVG through sharp.
 */
export async function renderImage(markup: SatoriNode, options: RenderOptions): Promise<Uint8Array> {
  const format: ImageFormat = options.format ?? "png";

  // satori types its input as React's ReactNode but reads only `{ type, props }`, which is what
  // satori-html's `html` returns, so this cast bridges the two.
  const svg = await satori(markup as Parameters<typeof satori>[0], {
    width: options.size.width,
    height: options.size.height,
    fonts: options.fonts,
  });

  if (format === "svg") {
    return new TextEncoder().encode(svg);
  }

  const pipeline = sharp(Buffer.from(svg));

  if (format === "avif") {
    const buffer = await pipeline.avif({ quality: options.quality ?? 82 }).toBuffer();
    return new Uint8Array(buffer);
  }

  const buffer = await pipeline.png({ quality: options.quality ?? 90 }).toBuffer();
  return new Uint8Array(buffer);
}

export const MIME_TYPES: Record<ImageFormat, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  avif: "image/avif",
};

type SvgRenderOptions = {
  size: ImageSize;
  format?: ImageFormat;
  /** PNG/AVIF compression quality, 1 to 100. Defaults to 90 for PNG, 82 for AVIF. */
  quality?: number;
};

/**
 * Render a raw SVG string to an image buffer via sharp (librsvg).
 */

/*
 * Use for templates that need features satori can't handle: `<defs>`, `<radialGradient>`, `<clipPath>`, complex SVG gradients. librsvg has full SVG support.
 */

/*
 * `svg` returns the bytes verbatim. `png` / `avif` rasterize at the given size.
 */
export async function renderSvgImage(svg: string, options: SvgRenderOptions): Promise<Uint8Array> {
  const format: ImageFormat = options.format ?? "png";

  if (format === "svg") {
    return new TextEncoder().encode(svg);
  }

  const pipeline = sharp(Buffer.from(svg), { density: 400 }).resize({
    width: options.size.width,
    height: options.size.height,
    fit: "fill",
  });

  if (format === "avif") {
    const buffer = await pipeline.avif({ quality: options.quality ?? 82 }).toBuffer();
    return new Uint8Array(buffer);
  }

  const buffer = await pipeline.png({ quality: options.quality ?? 90 }).toBuffer();
  return new Uint8Array(buffer);
}
