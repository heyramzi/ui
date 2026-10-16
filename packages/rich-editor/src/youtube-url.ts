// No markdown-it here, so the editor can import it without the markdown engine.

export const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export type YoutubeRef = { videoId: string; start: number };

function toUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function videoIdOf(parsed: URL): string | null {
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return parsed.pathname.slice(1);
  if (host !== "youtube.com" && host !== "m.youtube.com") return null;
  if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
  if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.slice("/embed/".length);
  return null;
}

/**
 * Reads youtube.com/watch?v=ID, youtu.be/ID and youtube.com/embed/ID. A `t`
 * param in seconds becomes `start`.
 */
export function parseYoutubeUrl(url: string): YoutubeRef | null {
  const parsed = toUrl(url);
  if (!parsed) return null;
  const videoId = videoIdOf(parsed);
  if (!videoId || !YOUTUBE_ID_RE.test(videoId)) return null;
  const t = parseInt(parsed.searchParams.get("t") ?? "", 10);
  return { videoId, start: Number.isFinite(t) && t > 0 ? t : 0 };
}
