import type { IconName } from "#src/core/types.js";

let current: HTMLMediaElement | null = null;

/** Only one clip plays at a time: starting one stops the last. */
export function claim(element: HTMLMediaElement): void {
  if (current && current !== element) current.pause();
  current = element;
}

/** What a shelf item's preview URL holds, read from its extension. Unknown counts as video. */
export function mediaKind(src: string): "image" | "audio" | "video" {
  const path = decodeURIComponent(src).split("#")[0] ?? "";
  if (/\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i.test(path)) return "image";
  if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(path)) return "audio";
  return "video";
}

const ICONS: Record<string, IconName> = {
  motion: "motion",
  layout: "layout",
  broll: "broll",
  sound: "sound",
  music: "music",
};

/** A glyph for a shelf, by the id an adapter gave it. */
export const shelfIcon = (id: string): IconName => ICONS[id.replaceAll("-", "")] ?? "video";
