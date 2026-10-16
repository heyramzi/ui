import type { Font } from "satori";

export type { Font };

export type ImageSize = {
  width: number;
  height: number;
};

export type ImageFormat = "svg" | "png" | "avif";

export type FontConfig = {
  name: string;
  /** Path to .ttf, .otf, or .woff2 file. woff2 is decoded to ttf at load time. */
  path: string;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: "normal" | "italic";
};

export type RenderOptions = {
  fonts: Font[];
  size: ImageSize;
  format?: ImageFormat;
  /** PNG/AVIF compression quality, 1–100. Defaults to 90 for PNG, 82 for AVIF. */
  quality?: number;
};
