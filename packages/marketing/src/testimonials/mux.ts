const MUX_POSTER_BASE = "https://image.mux.com";
const PLAYBACK_SCHEME = "playback:";

/**
 * WHY: the public testimonials API returns a Mux-backed video as `playback:<id>`, which is a sentinel and not a URL.
 */

/*
 * Handing it to a `<video src>` gives ERR_UNKNOWN_URL_SCHEME and a black card, so every consumer has to resolve it before rendering.
 */
export function getMuxPlaybackId(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  if (videoUrl.startsWith(PLAYBACK_SCHEME)) return videoUrl.slice(PLAYBACK_SCHEME.length) || null;

  const streamMatch = videoUrl.match(/stream\.mux\.com\/([^/?.]+)/);
  return streamMatch?.[1] ?? null;
}

export function getMuxPosterUrl(playbackId: string | null | undefined): string | null {
  if (!playbackId) return null;
  return `${MUX_POSTER_BASE}/${playbackId}/thumbnail.jpg?width=1280&fit_mode=preserve`;
}
